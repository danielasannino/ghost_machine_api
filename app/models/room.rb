class Room < ApplicationRecord
  has_many :players, dependent: :destroy

  # Statuses: 0: waiting, 1: active, 2: finished
  enum :status, { waiting: 0, active: 1, finished: 2 }, default: :waiting

  def assign_roles!
    # Pick one random player to be the Virus (role: 1)
    # All others are Engineers (role: 0)
    players.update_all(role: :engineer)
    players.sample.update(role: :virus)
  end
end
