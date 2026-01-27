# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_01_27_170035) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "ai_generations", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.string "generation_type", null: false
    t.string "status", default: "pending", null: false
    t.integer "tokens_cost", default: 1, null: false
    t.string "external_id"
    t.string "external_status"
    t.jsonb "input_params", default: {}
    t.text "input_image_urls", default: [], array: true
    t.text "output_image_urls", default: [], array: true
    t.jsonb "output_metadata", default: {}
    t.string "error_code"
    t.text "error_message"
    t.datetime "started_at"
    t.datetime "completed_at"
    t.integer "processing_time_ms"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_ai_generations_on_created_at"
    t.index ["external_id"], name: "index_ai_generations_on_external_id"
    t.index ["generation_type"], name: "index_ai_generations_on_generation_type"
    t.index ["status"], name: "index_ai_generations_on_status"
    t.index ["user_id"], name: "index_ai_generations_on_user_id"
  end

  create_table "payments", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.uuid "subscription_id"
    t.string "provider", null: false
    t.string "external_id", null: false
    t.string "external_status"
    t.string "status", default: "pending", null: false
    t.string "payment_type", null: false
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.string "currency", default: "RUB", null: false
    t.integer "tokens_amount"
    t.string "token_pack_id"
    t.string "subscription_plan"
    t.datetime "paid_at"
    t.datetime "refunded_at"
    t.string "payment_method"
    t.string "error_code"
    t.text "error_message"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_payments_on_created_at"
    t.index ["external_id"], name: "index_payments_on_external_id", unique: true
    t.index ["payment_type"], name: "index_payments_on_payment_type"
    t.index ["provider"], name: "index_payments_on_provider"
    t.index ["status"], name: "index_payments_on_status"
    t.index ["subscription_id"], name: "index_payments_on_subscription_id"
    t.index ["user_id"], name: "index_payments_on_user_id"
  end

  create_table "subscriptions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.string "plan", default: "free", null: false
    t.string "status", default: "active", null: false
    t.datetime "current_period_start"
    t.datetime "current_period_end"
    t.datetime "cancelled_at"
    t.string "payment_provider"
    t.string "external_id"
    t.boolean "auto_renew", default: true
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["current_period_end"], name: "index_subscriptions_on_current_period_end"
    t.index ["external_id"], name: "index_subscriptions_on_external_id"
    t.index ["plan"], name: "index_subscriptions_on_plan"
    t.index ["status"], name: "index_subscriptions_on_status"
    t.index ["user_id"], name: "index_subscriptions_on_user_id"
  end

  create_table "token_balances", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.string "token_type", null: false
    t.integer "balance", default: 0, null: false
    t.datetime "expires_at"
    t.string "source"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_token_balances_on_expires_at"
    t.index ["token_type"], name: "index_token_balances_on_token_type"
    t.index ["user_id", "token_type"], name: "index_token_balances_on_user_id_and_token_type", unique: true
  end

  create_table "token_transactions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.uuid "token_balance_id", null: false
    t.string "operation", null: false
    t.integer "amount", null: false
    t.integer "balance_before", null: false
    t.integer "balance_after", null: false
    t.string "reason"
    t.uuid "ai_generation_id"
    t.uuid "payment_id"
    t.string "description"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["ai_generation_id"], name: "index_token_transactions_on_ai_generation_id"
    t.index ["created_at"], name: "index_token_transactions_on_created_at"
    t.index ["operation"], name: "index_token_transactions_on_operation"
    t.index ["payment_id"], name: "index_token_transactions_on_payment_id"
    t.index ["token_balance_id"], name: "index_token_transactions_on_token_balance_id"
    t.index ["user_id"], name: "index_token_transactions_on_user_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "supabase_id", null: false
    t.string "email", null: false
    t.string "username"
    t.string "full_name"
    t.string "avatar_url"
    t.string "status", default: "active", null: false
    t.datetime "last_active_at"
    t.jsonb "preferences", default: {}
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["status"], name: "index_users_on_status"
    t.index ["supabase_id"], name: "index_users_on_supabase_id", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true, where: "(username IS NOT NULL)"
  end

  create_table "webhook_events", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "source", null: false
    t.string "external_id", null: false
    t.string "event_type", null: false
    t.string "status", default: "pending", null: false
    t.jsonb "payload", default: {}, null: false
    t.jsonb "headers", default: {}
    t.integer "attempts", default: 0
    t.datetime "processed_at"
    t.datetime "last_attempted_at"
    t.string "error_code"
    t.text "error_message"
    t.uuid "user_id"
    t.uuid "payment_id"
    t.uuid "subscription_id"
    t.uuid "ai_generation_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_webhook_events_on_created_at"
    t.index ["event_type"], name: "index_webhook_events_on_event_type"
    t.index ["source", "external_id"], name: "index_webhook_events_on_source_and_external_id", unique: true
    t.index ["status"], name: "index_webhook_events_on_status"
    t.index ["user_id"], name: "index_webhook_events_on_user_id"
  end

  add_foreign_key "ai_generations", "users"
  add_foreign_key "payments", "subscriptions"
  add_foreign_key "payments", "users"
  add_foreign_key "subscriptions", "users"
  add_foreign_key "token_balances", "users"
  add_foreign_key "token_transactions", "token_balances"
  add_foreign_key "token_transactions", "users"
end
