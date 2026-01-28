class CreateAiGenerations < ActiveRecord::Migration[8.0]
  def change
    create_table :ai_generations, id: :uuid do |t|
      t.uuid :user_id, null: false

      # Тип генерации
      t.string :generation_type, null: false # virtual_try_on, fashion_model, variation

      # Статус обработки
      t.string :status, null: false, default: 'pending' # pending, processing, completed, failed, cancelled

      # Стоимость в токенах
      t.integer :tokens_cost, null: false, default: 1

      # The New Black API
      t.string :external_id # ID задачи в The New Black
      t.string :external_status # Статус в The New Black API

      # Входные параметры
      t.jsonb :input_params, default: {} # garment_url, model_url, prompt и т.д.

      # Входные изображения (URLs)
      t.text :input_image_urls, array: true, default: []

      # Результаты
      t.text :output_image_urls, array: true, default: []
      t.jsonb :output_metadata, default: {}

      # Ошибки
      t.string :error_code
      t.text :error_message

      # Время обработки
      t.datetime :started_at
      t.datetime :completed_at
      t.integer :processing_time_ms

      # Метаданные (для аналитики)
      t.jsonb :metadata, default: {}

      t.timestamps

      t.index :user_id
      t.index :generation_type
      t.index :status
      t.index :external_id
      t.index :created_at
    end

    add_foreign_key :ai_generations, :users
  end
end
