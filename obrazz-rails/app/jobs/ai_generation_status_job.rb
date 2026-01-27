# frozen_string_literal: true

class AiGenerationStatusJob < ApplicationJob
  queue_as :ai_generations
  
  # Retry configuration
  retry_on StandardError, wait: :polynomially_longer, attempts: 10
  discard_on ActiveRecord::RecordNotFound

  # Polling intervals (seconds)
  INITIAL_DELAY = 5
  MAX_DELAY = 60
  MAX_POLLING_TIME = 10.minutes

  def perform(generation_id, attempt: 1)
    generation = AiGeneration.find(generation_id)
    
    # Не проверяем завершённые генерации
    return if generation.completed? || generation.failed? || generation.cancelled?

    # Проверяем, не истекло ли время
    if generation.created_at < MAX_POLLING_TIME.ago
      generation.fail!('timeout', 'Generation timed out')
      return
    end

    # Получаем статус от API
    client = Ai::TheNewBlackClient.new
    result = client.get_task_status(generation.external_id)

    case result[:status]
    when 'completed', 'done', 'success'
      handle_completion(generation, result)
    when 'failed', 'error'
      handle_failure(generation, result)
    else
      # Ещё в процессе - планируем следующую проверку
      schedule_next_check(generation_id, attempt)
    end
  rescue Ai::TheNewBlackClient::ApiError => e
    Rails.logger.error "API error checking generation #{generation_id}: #{e.message}"
    
    # При ошибках API продолжаем пытаться
    if attempt < 20
      schedule_next_check(generation_id, attempt)
    else
      generation = AiGeneration.find_by(id: generation_id)
      generation&.fail!('api_error', "Failed to get status: #{e.message}")
    end
  end

  private

  def handle_completion(generation, result)
    images = extract_images(result)
    generation.complete!(images, result)
    
    # Можно отправить push notification пользователю
    # NotificationService.new(generation.user).generation_completed(generation)
    
    Rails.logger.info "Generation #{generation.id} completed with #{images.size} images"
  end

  def handle_failure(generation, result)
    error_message = result[:error] || result[:message] || 'Generation failed'
    generation.fail!('generation_failed', error_message)
    
    Rails.logger.warn "Generation #{generation.id} failed: #{error_message}"
  end

  def extract_images(result)
    result[:images] || 
      result[:output_images] || 
      result[:result_images] ||
      [result[:image_url]].compact
  end

  def schedule_next_check(generation_id, attempt)
    # Экспоненциальная задержка с jitter
    delay = calculate_delay(attempt)
    
    AiGenerationStatusJob.set(wait: delay.seconds).perform_later(generation_id, attempt: attempt + 1)
  end

  def calculate_delay(attempt)
    # Базовая задержка с экспоненциальным ростом
    base_delay = [INITIAL_DELAY * (1.5 ** attempt), MAX_DELAY].min
    
    # Добавляем jitter (±20%)
    jitter = base_delay * 0.2 * (rand - 0.5)
    
    (base_delay + jitter).round
  end
end
