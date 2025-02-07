class AddDefaultToTrainingModeOptionToUsers < ActiveRecord::Migration[4.2]
  def change
    add_column :users, :default_to_training_mode, :boolean, null: false, default: false
  end
end
