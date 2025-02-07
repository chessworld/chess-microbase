class LivePresentationsController < ApplicationController
  def create
     if presentation = LivePresentation.create
       render json: presentation.to_json, status: 201
     else
       head 500
     end
  end
end
