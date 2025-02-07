class AddGamesPosition < ActiveRecord::Migration[4.2]
  def up
  	add_column :games, :position, :integer
  	add_index :games, [:microbase_id, :position]
  end

  def down
  	remove_index :games, [:microbase_id, :position]
  	remove_column :games, :position
  end
end
