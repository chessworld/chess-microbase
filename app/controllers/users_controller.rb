class UsersController < ApplicationController
  before_action :find_user, only: [:confirm, :destroy, :edit, :show, :update, :upgrade]
  before_action :require_unauthenticated, only: [:create, :new]
  before_action :require_admin, only: [:index, :show, :destroy]

  def confirm
    if @user.confirmed?
      flash[:warning] = 'Your email address is already confirmed.'
      redirect_to root_url
    elsif @user.confirmation_token == params[:token]
      @user.confirmed_at = Time.now
      @user.confirmed_with_ip = request.remote_ip
      @user.confirmation_token = nil
      @user.save!
      flash[:success] = '<strong>Thank you,</strong> your email address has been confirmed successfully'.html_safe
      sign_in @user
    else
      flash[:warning] = 'Sorry, the confirmation link you supplied was not valid, or has already been used'
      redirect_to root_url
    end
  end

  def create
    @user = User.new(user_params)
    if @user.save
      flash[:success] = "<strong>Welcome to Chess Microbase,</strong> your new account was created successfully".html_safe
      sign_in @user
    else
      flash.now[:error] = @user.errors.full_messages.join("\n")
      render :new
    end
  end

  def destroy
    @user.destroy
    flash[:success] = "<strong>User deleted successfully</strong>".html_safe
    redirect_to users_url
  end

  def edit
    unless @user.recovery_token && params[:token] == @user.recovery_token
      authorize! :update, @user
    end
  end

  def index
    @search_term = params[:search_term]
    @users = User.order('created_at desc')
    if @search_term.present?
      @users = @users.where(
        '(first_name || \' \' || last_name) ilike :term or email ilike :term',
        term: "%#{@search_term}%"
      )
    end
    @users = @users.paginate(page: params[:page], per_page: 100)
  end

  def new
    @user = User.new
  end

  def recover_password
    if params[:email]
      if @user = User.find_by_email(params[:email])
        @user.generate_recovery_token!
        UserMailer.recovery_email(@user).deliver
        flash[:info] = '<strong>You have been emailed a link to reset your password,</strong> please check your email to continue'.html_safe
      else
        flash[:warning] = '<strong>That email address is not registered,</strong> please sign up for a new account'.html_safe
      end
      redirect_to new_session_url
    end
  end

  def redeem
    if coupon = Coupon.with_code(params[:coupon_code]).first
      if current_user.can_claim_coupon?(coupon)
        current_user.claim_coupon(coupon)
        current_user.reload
        flash[:success] = "<strong>Coupon redeemed successfully,</strong> your account has been upgraded to #{coupon.upgrades_to} until #{coupon.upgrades_from_now_until.to_date.to_s :long}".html_safe
        redirect_to home_url
      else
        flash[:error] = '<strong>Sorry,</strong> the code you entered is no longer available.'.html_safe
        redirect_to upgrade_user_url(current_user)
      end
    else
      flash[:warning] = '<strong>The code you entered was incorrect,</strong> please check your code and try again.'.html_safe
      redirect_to upgrade_user_url(current_user)
    end
  end

  def show; end

  def update
    unless @user.recovery_token && params[:token] == @user.recovery_token
      authorize! :update, @user
    end
    if params[:token] && user_params[:password].present? && @user.update(user_params)
      @user.delete_recovery_token!
      flash[:success] = "<strong>Your password has been reset successfully,</strong> and you have been signed in to Chess Microbase".html_safe
      sign_in @user, false
    elsif !params[:token] && params[:user] && @user.update(user_params)
      redirect_to microbases_url
    else
      render action: :edit
    end
  end

  def upgrade
    authorize! :update, @user
    if params[:upgrade] && admin?
      time = case params[:upgrade][:upgrade_for]
        when '1 week' then 1.week
        when '2 weeks' then 2.weeks
        when '1 month' then 1.month
        when '3 months' then 3.months
        when '6 months' then 6.months
        when '1 year' then 1.year
        when '3 years' then 3.years
      end
      if time
        @user.upgrades.create!(
          level: 'premium',
          upgraded_until: time.from_now
        )
        flash[:success] = "User upgraded successfully"
        redirect_to @user
      end
    end
  end

  private

  def find_user
    @user = User.find params[:id]
  end

  def user_params
    params.require(:user).permit(
      :first_name,
      :last_name,
      :email,
      :password,
      :password_confirmation,
      :color_scheme,
      :default_to_training_mode
    )
  end

end
