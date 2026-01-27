Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # ==================== API ROUTES ====================
  namespace :api do
    namespace :v1 do
      # Health check (public)
      get 'health', to: 'health#show'

      # User profile
      get 'users/me', to: 'users#me'
      put 'users/me', to: 'users#update'
      patch 'users/me', to: 'users#update'

      # Tokens
      resources :tokens, only: [:index] do
        collection do
          get 'balance'
          get 'history'
        end
      end

      # Subscriptions
      resource :subscription, only: [:show, :create, :update, :destroy] do
        post 'upgrade'
        post 'cancel'
      end

      # AI Generations
      resources :ai_generations, only: [:index, :show, :create] do
        member do
          post 'cancel'
          get 'status'
        end
      end

      # Virtual Try-On shortcut
      namespace :ai do
        post 'virtual-try-on', to: 'virtual_try_on#create'
        post 'fashion-model', to: 'fashion_model#create'
        post 'variation', to: 'variation#create'
      end

      # Payments
      resources :payments, only: [:index, :show, :create] do
        collection do
          get 'token_packs'
        end
      end

      # Webhooks (public, signature verified)
      namespace :webhooks do
        post 'yookassa', to: 'yookassa#create'
        post 'apple', to: 'apple#create'
        post 'google', to: 'google#create'
        post 'the_new_black', to: 'the_new_black#create'
      end
    end
  end

  # ==================== ADMIN & DASHBOARD ====================
  # Will be configured in Phase 6
  # namespace :admin do
  #   resources :users
  #   resources :subscriptions
  #   resources :payments
  #   resources :ai_generations
  # end

  # Root path
  root to: proc { [200, { 'Content-Type' => 'application/json' }, [{ service: 'Obrazz API', version: 'v1' }.to_json]] }
end
