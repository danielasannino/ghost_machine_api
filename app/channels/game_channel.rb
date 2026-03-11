class GameChannel < ApplicationCable::Channel
  def subscribed
    # Each room gets its own "stream"
    stream_from "room_#{params[:room_id]}"
  end

  def move(data)
    player = Player.find(data["player_id"])

    # Update coordinates in DB
    player.update(x: data["x"], y: data["y"])

    # Broadcast the new position to EVERYONE in the room
    ActionCable.server.broadcast("room_#{player.room_id}", {
      type: "PLAYER_MOVED",
      player_id: player.id,
      x: player.x,
      y: player.y
    })
  end
end
