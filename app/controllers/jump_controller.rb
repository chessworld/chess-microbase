class JumpController < ApplicationController
  def game
    if @game = Game.find_by_token(params[:token])
      redirect_to microbase_game_url(@game.microbase, @game, filtered_params)
    else
      flash[:warning] = "<strong>Sorry,</strong> the game you were looking for could not be found.".html_safe
      redirect_to home_url
    end
  end

  def microbase
    if microbase = Microbase.find_by_token(params[:token])
      redirect_to microbase_url(microbase, filtered_params)
    else
      flash[:warning] = "<strong>Sorry,</strong> the microbase you were looking for could not be found.".html_safe
      redirect_to home_url
    end
  end

  def filtered_params
    params.permit(:token, :live)
  end
end
