# frozen_string_literal: true

module Api
  module V1
    class BaseController < Api::BaseController
      # V1-specific logic goes here
      
      # Версия API
      def api_version
        'v1'
      end
    end
  end
end
