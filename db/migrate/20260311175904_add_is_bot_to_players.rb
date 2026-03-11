class AddIsBotToPlayers < ActiveRecord::Migration[8.1]
  def change
    # This adds the column AND sets the default to false correctly
    add_column :players, :is_bot, :boolean, default: false
  end
end
