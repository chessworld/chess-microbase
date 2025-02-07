class SessionsController < ApplicationController
  before_action :require_unauthenticated, only: [:create, :new]
  before_action :find_user, only: :create

  include ApplicationHelper
  include ActionView::Helpers::UrlHelper

  def create
    if @user
      sign_in @user
    else
      flash[:error] = 'The email or password you entered was incorrect.'
      render action: :new
    end
  end

  def destroy
    sign_out
    redirect_to root_url
  end

  def new
    @user = User.new
  end

  def switch_format
    session[:preferred_format] = params[:preferred_format]
    redirect_back fallback_location: root_path
  end

  private
    def find_user
      @user = if params[:code]
        token = Koala::Facebook::OAuth.new.get_access_token(params[:code], redirect_uri: auth_url)
        api = Koala::Facebook::API.new(token)
        permissions = api.get_connections('me', 'permissions')
        unless permissions.any? { |o| o['permission'] == 'email' }
          raise "no email permission"
        end
        object = api&.get_object('me', fields: 'first_name,last_name,email')
        email = object && object['email']
        unless email
          flash[:error] = ('Chess Microbase needs your permission to get your email address from Facebook in order to sign you in. ' +
            link_to('Grant permission', facebook_sign_in_url(rerequest: true))).html_safe
          redirect_to root_url
          return
        end

        User.find_by_email(email) || begin
          User.create!(
            email: email,
            first_name: object['first_name'],
            last_name:  object['last_name'],
            password:   rand(36**8).to_s(36)
          )
        end
      elsif params[:error_msg]
        flash[:error] = ERB::Util.html_escape(params[:error_msg])
        redirect_to home_url
      elsif params[:error]
        redirect_to home_url
      else
        User.authenticate(params[:session])
      end
    end
end
