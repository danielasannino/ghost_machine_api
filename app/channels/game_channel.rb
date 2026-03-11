class GameChannel < ApplicationCable::Channel
  def subscribed
    stream_from "room_#{params[:room_id]}"
  end

  def move(data)
    player = Player.find(data["player_id"])
    player.update(x: data["x"], y: data["y"])
    
    ActionCable.server.broadcast("room_#{params[:room_id]}", {
      type: "PLAYER_MOVED",
      player_id: player.id,
      x: player.x,
      y: player.y
    })
  end

  def send_chat(data)
    ActionCable.server.broadcast("room_#{params[:room_id]}", {
      type: "CHAT_MESSAGE",
      name: data["name"],
      message: data["message"]
    })
  end

  def start_game
  room = Room.find_by(code: params[:room_id])
  # When the game starts, give everyone a fresh, spread-out position
  room.players.each do |p|
    p.update(
      role: :engineer,
      x: rand(15..85), # Keep them away from the absolute edges
      y: rand(15..85)
    )
  end
  
  virus = room.players.sample
  virus.virus!
  
  ActionCable.server.broadcast("room_#{room.code}", { type: "GAME_STARTED", virus_id: virus.id })
end

  def infect_player(data)
  player = Player.find(data["player_id"])
  player.virus! # Sets role to virus
  
  ActionCable.server.broadcast("room_#{params[:room_id]}", {
    type: "PLAYER_INFECTED",
    virus_id: player.id
  })
end

end
