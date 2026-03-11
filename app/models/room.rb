class Room < ApplicationRecord
  has_many :players, dependent: :destroy

  enum :status, { waiting: 0, active: 1, finished: 2 }, default: :waiting

  # This is the "Cleanup" magic
  after_create :setup_clean_room

  def setup_clean_room
    # 1. Destroy any players accidentally linked to this room ID
    players.destroy_all 
    
    # 2. Add the BOT (This ensures count is exactly 1 at start)
    players.create!(name: "CPU_STALKER", is_bot: true)
  end

  def assign_roles!
    players.update_all(role: :engineer)
    players.sample.update!(role: :virus)
    
    # Send the FRESH list to React to overwrite those ghosts
    ActionCable.server.broadcast("room_#{code}", {
      type: "GAME_STARTED",
      players: players.as_json
    })
  end
end
