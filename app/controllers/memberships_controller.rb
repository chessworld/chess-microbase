class MembershipsController < ApplicationController
  before_action :find_microbase
  before_action :find_user, only: :create
  before_action :find_membership, only: [:destroy, :accept]

  def new
    authorize! :update, @microbase
  end

  def create
    authorize! :update, @microbase

    @membership = Membership.new(params[:membership]) do |m|
      m.microbase = @microbase
      m.role = 'invitee'
      m.user = @user
      m.inviter = current_user
    end
    if @membership.save
      flash[:success] = "#{@membership.user.full_name} has been invited to collaborate on this microbase."
      redirect_to @microbase
    else
      flash[:error] = "Unable to invite that user, he or she may already have an invitation.".html_safe
      redirect_to @microbase
    end
  end

  def destroy
    @membership.destroy if @membership.user == current_user
    redirect_to home_path
  end

  def accept
    if @membership.role == 'invitee' && @membership.user == current_user
      @membership.update_attribute :role, 'collaborator'
      flash[:success] = '<strong>Welcome,</strong> you are now a collaborator on this microbase.'.html_safe
      redirect_to @microbase
    else
      redirect_to home_path
    end
  end

  private
    def find_microbase
      @microbase = Microbase.find params[:microbase_id]
    end

    def find_user
      unless @user = User.find_by_email(params[:user_email])
        flash[:error] = "Unable to find any user with that email address."
        redirect_to @microbase
      end
    end

    def find_membership
      @membership = @microbase.memberships.find(params[:id])
    end
end
