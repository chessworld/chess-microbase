class DiagramsController < ApplicationController
  def show
    @diagram = Diagram.new params[:fen]
    respond_to do |format|
      format.png do
        send_data(
          @diagram.string,
          disposition:  'attachment',
          type:         'image/png',
          filename:     'diagram.png',
        )
      end
    end
  end
end
