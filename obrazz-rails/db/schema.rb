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

ActiveRecord::Schema[8.0].define(version: 2026_01_27_180008) do
  create_schema "auth"
  create_schema "extensions"
  create_schema "graphql"
  create_schema "graphql_public"
  create_schema "pgbouncer"
  create_schema "realtime"
  create_schema "storage"
  create_schema "supabase_migrations"
  create_schema "vault"

  # These are extensions that must be enabled in order to support this database
  enable_extension "extensions.pg_stat_statements"
  enable_extension "extensions.pgcrypto"
  enable_extension "extensions.uuid-ossp"
  enable_extension "graphql.pg_graphql"
  enable_extension "pg_catalog.plpgsql"
  enable_extension "vault.supabase_vault"

  create_table "admins", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "name"
    t.boolean "active", default: true, null: false
    t.datetime "last_login_at", precision: nil
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["email"], name: "index_admins_on_email", unique: true
  end

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

  create_table "items", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id"
    t.string "name"
    t.string "category", null: false
    t.string "subcategory"
    t.jsonb "colors", default: []
    t.jsonb "primary_color"
    t.string "material"
    t.jsonb "style", default: []
    t.jsonb "season", default: []
    t.string "image_url"
    t.boolean "is_default", default: false
    t.string "brand"
    t.string "size"
    t.decimal "price", precision: 10, scale: 2
    t.jsonb "tags", default: []
    t.boolean "favorite", default: false
    t.integer "wear_count", default: 0
    t.datetime "last_worn_at"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "color"
    t.string "thumbnail_url"
    t.string "image_hash"
    t.index ["category"], name: "index_items_on_category"
    t.index ["created_at"], name: "index_items_on_created_at"
    t.index ["favorite"], name: "index_items_on_favorite"
    t.index ["image_hash"], name: "index_items_on_image_hash"
    t.index ["is_default"], name: "index_items_on_is_default"
    t.index ["user_id"], name: "index_items_on_user_id"
  end

  create_table "outfits", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.string "title"
    t.text "description"
    t.jsonb "items", default: []
    t.jsonb "background", default: {"type" => "color", "value" => "#FFFFFF"}
    t.string "visibility", default: "private"
    t.boolean "is_ai_generated", default: false
    t.jsonb "ai_metadata"
    t.jsonb "tags", default: []
    t.jsonb "styles", default: []
    t.jsonb "seasons", default: []
    t.jsonb "occasions", default: []
    t.datetime "last_worn_at"
    t.integer "wear_count", default: 0
    t.boolean "is_favorite", default: false
    t.integer "likes_count", default: 0
    t.integer "views_count", default: 0
    t.integer "shares_count", default: 0
    t.jsonb "canvas_settings"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_outfits_on_created_at"
    t.index ["is_ai_generated"], name: "index_outfits_on_is_ai_generated"
    t.index ["is_favorite"], name: "index_outfits_on_is_favorite"
    t.index ["last_worn_at"], name: "index_outfits_on_last_worn_at"
    t.index ["user_id"], name: "index_outfits_on_user_id"
    t.index ["visibility"], name: "index_outfits_on_visibility"
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

  create_table "user_profiles", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.string "display_name"
    t.text "bio"
    t.string "location"
    t.string "website"
    t.jsonb "preferences", default: {"theme" => "system", "language" => "ru", "notifications" => {"promotions" => false, "pushEnabled" => true, "aiSuggestions" => true, "communityUpdates" => true}}
    t.integer "items_count", default: 0
    t.integer "outfits_count", default: 0
    t.integer "ai_generations_used", default: 0
    t.integer "likes_received", default: 0
    t.integer "followers_count", default: 0
    t.integer "following_count", default: 0
    t.integer "streak_days", default: 0
    t.datetime "last_streak_date"
    t.integer "total_points", default: 0
    t.jsonb "achievements", default: []
    t.jsonb "badges", default: []
    t.boolean "onboarding_completed", default: false
    t.jsonb "onboarding_progress", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["display_name"], name: "index_user_profiles_on_display_name"
    t.index ["user_id"], name: "index_user_profiles_on_user_id", unique: true
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
  add_foreign_key "user_profiles", "users", on_delete: :cascade
end
