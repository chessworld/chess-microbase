class MicrobasesController < ApplicationController
  before_action :require_authenticated, except: [:show, :embed]
  before_action :check_limit,     only: [:create, :new]
  before_action :find_microbase,  only: [:destroy, :edit, :embed, :import, :remove, :show, :update]
  before_action :check_game_limit, only: :import
  before_action :authorize_show,  only: [:show, :embed]

  skip_before_action :verify_authenticity_token, only: :show

  def create
    @microbase = Microbase.new(microbase_params)
    @microbase.memberships.build(user: current_user, role: 'owner')
    if @microbase.save
      redirect_to @microbase
    else
      render action: :new
    end
  end

  def destroy
    authorize! :destroy, @microbase

    @microbase.destroy
    redirect_to microbases_url
  end

  def edit
    authorize! :update, @microbase
  end

  def embed
    @games = @microbase.games.order('id').limit(20)
  end

  def import
    @microbase.import_limit = current_user.game_limit - @microbase.games.count
    if params[:microbase] && microbase_params[:pgn_file]
      @microbase.pgn_file = microbase_params[:pgn_file]
      if @microbase.save
        status = if @microbase.import_report[:truncated] > 0 || @microbase.import_report[:failed] > 0
          :warning
        else
          :success
        end
        flash[status] = render_to_string(partial: 'import_report', locals: {report: @microbase.import_report}).html_safe
        @microbase.update_player_names
      else
        flash[:error] = 'There was an unknown error importing this file'
      end
      redirect_to @microbase
    end
  end

  def index
    @microbases = current_user.microbases
  end

  def new
    @microbase = Microbase.new
  end

  def remove
    authorize! :delete, @microbase
  end

  def show
    @games = @microbase.filtered_games(params)
    @paste_pgn_game = Game.new do |game|
      game.microbase = @microbase
      game.game_number = @microbase.games.size + 1
    end

    respond_to do |format|
      format.html do
        if @embedded = !!params[:embedded]
          @more_games = @games.count - Microbase::EMBED_LIMIT
          @games = @games.reorder('position').limit(Microbase::EMBED_LIMIT)
          response.headers.except!('X-Frame-Options')
          render layout: 'embedded'
        else
          @games = @games.page params[:page]
        end
      end
      format.pgn  { render plain: @games.reorder('position').map(&:pgn).join("\n\n\n") }
      format.js
    end
  end

  def update
    authorize! :update, @microbase

    if @microbase.update(microbase_params)
      redirect_to @microbase
    else
      render action: :edit
    end
  end

  private

  def authorize_show
    unless microbase_token?
      authorize! :read, @microbase
      @microbase.touch :last_accessed_at if can?(:update, @microbase)
    end
  end

  def check_game_limit
    if @microbase.games.count >= current_user.game_limit
      flash[:error] = "Sorry, you have exceeded the maximum game limit per microbase for your account type. <a href=\"#{upgrade_user_path(current_user)}\">Upgrade your account</a>".html_safe
      redirect_to @microbase
    end
  end

  def check_limit
    if current_user.microbases.count >= current_user.microbase_limit
      flash[:error] = "Sorry, you have exceeded the maximum microbase limit for your account type. <a href=\"#{upgrade_user_path(current_user)}\">Upgrade your account</a>".html_safe
      redirect_to microbases_url
    end
  end

  def find_microbase
    @microbase = Microbase.find params[:id]
  end

  def microbase_params
    params.require(:microbase).permit(:name, :preamble, :pgn_file)
  end
end
