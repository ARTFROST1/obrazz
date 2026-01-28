# frozen_string_literal: true

module Admin
  class PaymentsController < AdminController
    def index
      @payments = Payment.includes(:user)
                         .order(created_at: :desc)
                         .page(params[:page])
                         .per(20)

      # Apply filters
      if params[:status].present?
        @payments = @payments.where(status: params[:status])
      end

      if params[:payment_type].present?
        @payments = @payments.where(payment_type: params[:payment_type])
      end

      if params[:provider].present?
        @payments = @payments.where(provider: params[:provider])
      end

      if params[:date_from].present?
        @payments = @payments.where("created_at >= ?", params[:date_from].to_date.beginning_of_day)
      end

      if params[:date_to].present?
        @payments = @payments.where("created_at <= ?", params[:date_to].to_date.end_of_day)
      end

      @stats = {
        total_revenue: Payment.succeeded.sum(:amount),
        this_month: Payment.succeeded.where("created_at >= ?", Date.current.beginning_of_month).sum(:amount),
        by_provider: Payment.succeeded.group(:provider).sum(:amount),
        by_type: Payment.succeeded.group(:payment_type).count
      }
    end

    def show
      @payment = Payment.includes(:user).find(params[:id])
    end
  end
end
