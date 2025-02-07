class AddHits < ActiveRecord::Migration[4.2]
  def up
    add_column :games, :hits, :integer, default: 0, null: false
  end

  def down
    remove_column :games, :hits
  end
end
