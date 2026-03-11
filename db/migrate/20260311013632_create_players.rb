class CreatePlayers < ActiveRecord::Migration[8.1]
  def change
    create_table :players do |t|
      t.string :name
      t.integer :role
      t.integer :x
      t.integer :y
      t.references :room, null: false, foreign_key: true

      t.timestamps
    end
  end
end
