# app/models/player.rb
class Player < ApplicationRecord
  belongs_to :room

  # Tell Rails to broadcast the JSON representation of the player
  after_update_commit -> { broadcast_replace_to room, target: self, status: :updated }
  after_create_commit -> { broadcast_append_to room, target: self, status: :created }

  enum :role, { engineer: 0, virus: 1 }

  before_create do
    self.x ||= rand(0..100)
    self.y ||= rand(0..100)
  end
end
