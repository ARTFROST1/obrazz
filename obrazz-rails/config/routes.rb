Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Root route - redirect to login or dashboard
  root to: redirect("/login")

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # ==================== API ROUTES ====================
  namespace :api do
    namespace :v1 do
      # Health check (public)
      get "health", to: "health#show"

      # User profile
      get "users/me", to: "users#me"
      put "users/me", to: "users#update"
      patch "users/me", to: "users#update"

      # Tokens
      resources :tokens, only: [ :index ] do
        collection do
          get "balance"
          get "history"
        end
      end

      # Subscriptions
      resource :subscription, only: [ :show, :create, :update, :destroy ] do
        post "upgrade"
        post "cancel"
      end

      # AI Generations
      resources :ai_generations, only: [ :index, :show, :create ] do
        member do
          post "cancel"
          get "status"
        end
      end

      # Virtual Try-On shortcut
      namespace :ai do
        post "virtual-try-on", to: "virtual_try_on#create"
        post "fashion-model", to: "fashion_model#create"
        post "variation", to: "variation#create"
      end

      # Payments
      resources :payments, only: [ :index, :show, :create ] do
        collection do
          get "token_packs"
        end
      end

      # Webhooks (public, signature verified)
      namespace :webhooks do
        post "yookassa", to: "yookassa#create"
        post "apple", to: "apple#create"
        post "google", to: "google#create"
        post "the_new_black", to: "the_new_black#create"
      end
    end
  end

  # ==================== DASHBOARD (User Cabinet) ====================
  # Authentication - Login
  get "login", to: "dashboard/sessions#new", as: :login
  post "login", to: "dashboard/sessions#create"
  delete "logout", to: "dashboard/sessions#destroy", as: :logout

  # Authentication - Registration
  get "signup", to: "dashboard/registrations#new", as: :signup
  post "signup", to: "dashboard/registrations#create"

  # Authentication - OAuth (Google, Apple)
  post "auth/google", to: "dashboard/oauth#google", as: :auth_google
  post "auth/apple", to: "dashboard/oauth#apple", as: :auth_apple
  get "auth/oauth/callback", to: "dashboard/oauth#callback", as: :auth_oauth_callback
  post "auth/token", to: "dashboard/oauth#token", as: :auth_token

  # Legacy callback (for magic link)
  get "auth/callback", to: "dashboard/sessions#callback", as: :auth_callback

  # Dashboard namespace
  namespace :dashboard do
    root to: "home#index"

    # Subscription management
    resource :subscription, only: [ :show ] do
      get "plans"
      post "upgrade"
      post "cancel"
      post "reactivate"
    end

    # Tokens management
    resources :tokens, only: [ :index ] do
      collection do
        get "history"
        post "purchase"
      end
    end

    # AI Generations gallery
    resources :generations, only: [ :index, :show ] do
      member do
        get "download"
      end
    end

    # Settings
    resource :settings, only: [ :show, :update ] do
      delete "account", to: "settings#destroy_account", as: :destroy_account
      get "notifications"
      patch "notifications", to: "settings#update_notifications"
    end
  end

  # ==================== ADMIN PANEL ====================
  namespace :admin do
    root to: "dashboard#index"

    resources :users, only: [ :index, :show ]
    resources :subscriptions, only: [ :index, :show, :edit, :update ]
    resources :payments, only: [ :index, :show ]
    resources :ai_generations, only: [ :index, :show ]
    resources :token_transactions, only: [ :index, :show ]
  end
end
