class SearchesController < ApplicationController
  before_action :require_authenticated

  def show
    microbase_ids = current_user.microbases.pluck(:id)
    @games = Game.where(microbase_id: microbase_ids)
      .search(params[:q])
      .order('created_at DESC')
      .page(params[:page])

    respond_to do |format|
      format.html
      format.json { render json: @games.to_json }
    end
  end
end
