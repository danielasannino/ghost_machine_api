class CreateRooms < ActiveRecord::Migration[8.1]
  def change
    create_table :rooms do |t|
      t.string :code
      t.integer :status

      t.timestamps
    end
  end
end
