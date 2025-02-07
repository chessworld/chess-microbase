class ApplicationController < ActionController::Base
  rescue_from CanCan::AccessDenied, with: :on_access_denied

  before_action :handle_mobile
  before_action :use_preferred_format

  protect_from_forgery

  private

  def default_url_options(options={})
    { protocol: ENV['USE_HTTPS'].present? ? 'https' : 'http' }
  end

    def admin?
      current_user.try :admin?
    end
    helper_method :admin?

    def color_scheme
      if current_user
        'scheme-' + current_user.color_scheme.downcase
      else
        'scheme-default'
      end
    end
    helper_method :color_scheme

    def current_user
      @current_user ||= begin
        User.find_by_id(session[:user_id]) if session[:user_id]
      end
    end
    helper_method :current_user

    def game_token?
      @game && params[:token] && params[:token] == @game.token
    end
    helper_method :game_token?

    def handle_mobile
      request.format = :mobile if request.format == :html && !params[:embedded] && mobile_user_agent?
    end

    def home_path
      if current_user
        microbases_path
      else
        root_path
      end
    end
    helper_method :home_path

    def home_url
      if current_user
        microbases_url
      else
        root_url
      end
    end
    helper_method :home_url

    def microbase_token?
      @microbase && params[:token] && params[:token] == @microbase.token
    end
    helper_method :microbase_token?

    def mobile_user_agent?
      request.env["HTTP_USER_AGENT"] && request.env["HTTP_USER_AGENT"].match(/(iphone|ipod|android)/i)
    end

    def on_access_denied
      if current_user
        flash[:error] = "Sorry, you don't have permission to access this page"
        redirect_to home_url
      else
        session[:after_sign_in] = request.url
        flash[:error] = "You must be signed in to access this page"
        redirect_to new_session_url
      end
    end

    def redcarpet
      @@redcarpet ||= Redcarpet::Markdown.new Redcarpet::Render::HTML,
        autolink: true
    end
    helper_method :redcarpet

    def require_admin
      unless admin?
        flash[:error] = "You must be an administrator to access this page"
        redirect_to home_url
      end
    end

    def require_authenticated
      redirect_to new_session_url unless current_user
    end

    def require_unauthenticated
      redirect_to home_url, notice: "You must be signed out to access this page" if current_user
    end

    def sign_in user, redirect_back=true
      session[:user_id] = user.try(:id)
      if redirect_back && session[:after_sign_in]
        redirect_to session.delete(:after_sign_in)
      else
        redirect_to home_url
      end
    end

    def sign_out
      session.delete :user_id
    end

    def use_preferred_format
      if request.format == 'html' && session[:preferred_format] == 'mobile'
        request.format = 'mobile'
      end
      if request.format == 'mobile' && session[:preferred_format] == 'html'
        request.format = 'html'
      end
    end
end
