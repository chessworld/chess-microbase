class CreateDatabases < ActiveRecord::Migration[4.2]
  def change
    create_table :databases do |t|
      t.string :name
      t.integer :owner_id
      t.string :token
      t.datetime :last_accessed_at

      t.timestamps
    end
    add_index :databases, :owner_id
    add_index :databases, :token, unique: true
  end
end
