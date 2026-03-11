class PlayersController < ApplicationController
  def create
    room = Room.find_or_create_by(code: params[:room_code])
    player = room.players.create(name: params[:name])

    if player.save
      render json: { player: player, room: room }, status: :created
    else
      render json: player.errors, status: :unprocessable_entity
    end
  end

  def update
    @player = Player.find(params[:id])
    if @player.update(player_params)
      render json: @player
    else
      render json: @player.errors, status: :unprocessable_entity
    end
  end

  private

  def player_params
    params.require(:player).permit(:x, :y, :role)
  end
end
