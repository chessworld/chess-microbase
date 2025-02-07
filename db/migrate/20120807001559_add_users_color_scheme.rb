class AddUsersColorScheme < ActiveRecord::Migration[4.2]
  def up
    add_column :users, :color_scheme, :string, null: false, default: 'Default'
  end

  def down
    remove_column :users, :color_scheme
  end
end
