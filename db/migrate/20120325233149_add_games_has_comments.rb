class AddGamesHasComments < ActiveRecord::Migration[4.2]
  def change
    add_column :games, :has_comments, :boolean
  end
end
