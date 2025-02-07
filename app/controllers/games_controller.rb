class GamesController < ApplicationController
  before_action :require_authenticated, except: [:show, :embed]
  before_action :find_microbase
  before_action :find_game, only: [:copy, :destroy, :edit, :embed, :move, :show, :update]
  before_action :check_limit, only: [:create, :new]

  skip_before_action :verify_authenticity_token, only: :show

  def copy
    unless microbase_token? || game_token?
      authorize! :read, @game
    end

    @to_microbase = Microbase.find(params[:copy_to_id])

    authorize! :update, @to_microbase

    if @to_microbase.games.size >= current_user.game_limit
      flash[:error] = "Sorry, the destination microbase has exceeded the maximum game limit for your account type. <a href=\"#{upgrade_user_path(current_user)}\">Upgrade your account</a>".html_safe
      redirect_to microbase_game_url(@microbase, @game, token: params[:token])
    else
      @copy = @to_microbase.games.build(@game.copyable_attributes)
      @copy.position = @to_microbase.games.count + 1

      if @copy.save
        @to_microbase.update_player_names
        flash[:success] = "<strong>Game copied successfully,</strong> now showing your new copy in <i>#{CGI.escape_html @to_microbase.name}</i>.".html_safe
        redirect_to microbase_game_url(@to_microbase, @copy)
      else
        flash[:error] = "Error, unable to copy game"
        redirect_to microbase_game_url(@microbase, @game, token: params[:token])
      end
    end
  end

  def create
    authorize! :update, @microbase

    @game = Game.new(game_params)
    @game.microbase = @microbase

    if @game.save
      @microbase.update_player_names
      redirect_to [@microbase, @game]
    else
      flash.now[:error] = @game.errors.full_messages.join("\n")
      render action: :new
    end
  end

  def destroy
    authorize! :destroy, @game

    @game.destroy
    @microbase.update_player_names
    redirect_to @microbase
  end

  def edit
    authorize! :update, @game
  end

  def embed
    unless microbase_token? || game_token?
      authorize! :read, @game
    end
  end

  def move
    authorize! :update, @game
    @to_microbase = Microbase.find(params[:move_to_id])
    authorize! :update, @to_microbase

    if @to_microbase.games.size >= current_user.game_limit
      flash[:error] = "Sorry, the destination microbase has exceeded the maximum game limit for your account type. <a href=\"#{upgrade_user_path(current_user)}\">Upgrade your account</a>".html_safe
      redirect_to microbase_game_url(@microbase, @game, token: params[:token])
    else
      @game.move_to @to_microbase
      @microbase.update_player_names
      @to_microbase.update_player_names
      flash[:success] = "<strong>Game moved successfully.".html_safe
      redirect_to microbase_game_url(@to_microbase, @game)
    end
  end

  def new
    authorize! :update, @microbase
    @game = Game.new
    @game.position = @microbase.games.count + 1
    @game.microbase = @microbase
  end

  def show
    unless microbase_token? || game_token?
      authorize! :read, @game
    end

    # Count a hit for game, only if viewing read-only
    @game.hit unless can?(:read, @game)

    @embedded = !!params[:embedded]
    respond_to do |format|
      format.html do
        response.headers.except!('X-Frame-Options') if @embedded        
        render layout: @embedded ? 'embedded' : 'application'
      end
      format.pgn  { render plain: @game.pgn }
      format.js
    end
  end

  def update
    authorize! :update, @game

    if @game.update(game_params)
      @microbase.update_player_names
      redirect_to [@microbase, @game]
    else
      render action: :edit
    end
  end

  private

  def check_limit
    if @microbase.games.count >= current_user.game_limit
      flash[:error] = "Sorry, you have exceeded the maximum game limit per microbase for your account type. <a href=\"#{upgrade_user_path(current_user)}\">Upgrade your account</a>".html_safe
      redirect_to @microbase
    end
  end

  def find_microbase
    @microbase = Microbase.find(params[:microbase_id])
  end

  def find_game
    @game = @microbase.games.find(params[:id])
  end

  def game_params
    params.require(:game).permit(:fen, :movetext, :game_number, :white, :black, :white_rating,
      :black_rating, :tournament, :location, :tournament_rounds,
      :tournament_type, :tournament_country, :round, :subround, :result, :date,
      :date_formatted, :tag_list, :pgn)
  end
end
