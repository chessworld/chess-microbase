class ChangeRatingsType < ActiveRecord::Migration[4.2]
  def up
    change_column :games, :white_rating, :integer
    change_column :games, :black_rating, :integer
  end

  def down
    change_column :games, :white_rating, :decimal, :precision => 9, :scale => 4
    change_column :games, :black_rating, :decimal, :precision => 9, :scale => 4
  end
end
