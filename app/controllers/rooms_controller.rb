class RoomsController < ApplicationController
def show
  @room = Room.find_by!(code: params[:id])
  render json: { 
    id: @room.id, 
    code: @room.code, 
    players: @room.players # <--- THIS ENSURES THE BOT IS SENT
  }
end

end
