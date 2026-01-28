# frozen_string_literal: true

module Admin
  class SubscriptionsController < AdminController
    def index
      @subscriptions = Subscription.includes(:user)
                                   .order(created_at: :desc)
                                   .page(params[:page])
                                   .per(20)

      # Apply filters
      if params[:plan].present?
        @subscriptions = @subscriptions.where(plan: params[:plan])
      end

      if params[:status].present?
        @subscriptions = @subscriptions.where(status: params[:status])
      end

      @stats = {
        total: Subscription.count,
        active: Subscription.active.count,
        cancelled: Subscription.where(status: "cancelled").count,
        by_plan: Subscription.active.group(:plan).count
      }
    end

    def show
      @subscription = Subscription.includes(:user).find(params[:id])
      @payments = @subscription.user.payments.order(created_at: :desc).limit(10)
    end

    def edit
      @subscription = Subscription.find(params[:id])
    end

    def update
      @subscription = Subscription.find(params[:id])

      if @subscription.update(subscription_params)
        redirect_to admin_subscription_path(@subscription), notice: "Subscription updated successfully"
      else
        render :edit, status: :unprocessable_entity
      end
    end

    private

    def subscription_params
      params.require(:subscription).permit(:plan, :status, :current_period_end)
    end
  end
end
