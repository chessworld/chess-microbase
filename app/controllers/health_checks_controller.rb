class HealthChecksController < ApplicationController
  def show
    render plain: 'OK'
  end
end
