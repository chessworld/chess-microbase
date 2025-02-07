class CreateMemberships < ActiveRecord::Migration[4.2]
  def up
    create_table :memberships do |t|
      t.integer :microbase_id, null: false
      t.integer :user_id, null: false
      t.string :role, null: false
      t.integer :inviter_id, null: true

      t.timestamps
    end
    add_index :memberships, :microbase_id
    add_index :memberships, :user_id
    execute '
      insert into memberships (microbase_id, user_id, role)
      select id, owner_id, \'owner\'
      from microbases
    '
    remove_column :microbases, :owner_id
    remove_column :games, :owner_id
  end

  def down
    drop_table :memberships
    add_column :microbases, :owner_id, :integer
    add_column :games, :owner_id, :integer
  end
end
