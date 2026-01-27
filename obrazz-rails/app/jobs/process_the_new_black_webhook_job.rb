# frozen_string_literal: true

class ProcessTheNewBlackWebhookJob < ApplicationJob
  queue_as :webhooks
  
  retry_on StandardError, wait: :polynomially_longer, attempts: 5
  discard_on ActiveRecord::RecordNotFound

  def perform(webhook_event_id)
    event = WebhookEvent.find(webhook_event_id)
    return if event.processed?

    event.start_processing!

    begin
      payload = event.payload.deep_symbolize_keys
      task_id = payload[:task_id] || payload[:id]
      status = payload[:status]

      # Находим генерацию по external_id
      generation = AiGeneration.find_by(external_id: task_id)

      unless generation
        Rails.logger.warn "Generation not found for The New Black task: #{task_id}"
        event.mark_processed!
        return
      end

      case status.to_s.downcase
      when 'completed', 'done', 'success'
        handle_completed(event, generation, payload)
      when 'failed', 'error'
        handle_failed(event, generation, payload)
      else
        Rails.logger.info "Unknown The New Black status: #{status}"
        event.mark_processed!(ai_generation_id: generation.id, user_id: generation.user_id)
      end
    rescue => e
      event.mark_failed!('processing_error', e.message)
      raise
    end
  end

  private

  def handle_completed(event, generation, payload)
    images = extract_images(payload)
    
    generation.complete!(images, {
      webhook_payload: payload,
      completed_via: 'webhook'
    })

    event.mark_processed!(
      ai_generation_id: generation.id,
      user_id: generation.user_id
    )

    Rails.logger.info "Generation #{generation.id} completed via webhook with #{images.size} images"
  end

  def handle_failed(event, generation, payload)
    error_message = payload[:error] || payload[:message] || 'Generation failed'
    error_code = payload[:error_code] || 'webhook_error'

    generation.fail!(error_code, error_message)

    event.mark_processed!(
      ai_generation_id: generation.id,
      user_id: generation.user_id
    )

    Rails.logger.warn "Generation #{generation.id} failed via webhook: #{error_message}"
  end

  def extract_images(payload)
    payload[:images] ||
      payload[:output_images] ||
      payload[:result_images] ||
      payload[:result] ||
      [payload[:image_url]].compact
  end
end
