class RenameDatabasesToMicrobases < ActiveRecord::Migration[4.2]
  def change
    rename_table :databases, :microbases
    rename_column :games, :database_id, :microbase_id
  end
end
