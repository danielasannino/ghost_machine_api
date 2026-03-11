class Player < ApplicationRecord
  belongs_to :room
  
  enum :role, { engineer: 0, virus: 1 }, default: :engineer
  
  before_create do
    self.x ||= rand(10..90)
    self.y ||= rand(10..90)
    # Default is_bot to false if not specified
    self.is_bot ||= false 
  end

  after_create_commit do
    ActionCable.server.broadcast("room_#{room.code}", {
      type: "PLAYER_JOINED",
      player: self
    })
  end
end
