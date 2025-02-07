class MakeGameOwnerOptional < ActiveRecord::Migration[4.2]
  def up
    change_column :games, :owner_id, :integer, null: true
  end

  def down
    change_column :games, :owner_id, :integer, null: false
  end
end
