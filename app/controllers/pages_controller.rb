# encoding: UTF-8

class PagesController < ApplicationController
  def home
    redirect_to microbases_url if current_user
  end
end