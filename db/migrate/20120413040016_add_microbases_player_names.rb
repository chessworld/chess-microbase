class AddMicrobasesPlayerNames < ActiveRecord::Migration[4.2]
  def change
    add_column :microbases, :player_names_json, :text
  end
end
