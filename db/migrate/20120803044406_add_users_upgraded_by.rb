class AddUsersUpgradedBy < ActiveRecord::Migration[4.2]
  def up
    add_column :users, :upgraded_by, :string
    rename_column :users, :paid_until, :upgraded_until
  end

  def down
    rename_column :users, :upgraded_until, :paid_until
    remove_column :users, :upgraded_by
  end
end
