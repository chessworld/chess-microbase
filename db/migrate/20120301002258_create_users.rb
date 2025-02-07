class CreateUsers < ActiveRecord::Migration[4.2]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.boolean :admin, null: false, default: false
      t.string :password_digest, null: false
      t.datetime :confirmed_at
      t.string :confirmed_with_ip
      t.string :confirmation_token
      t.string :recovery_token
      t.string :account, default: 'free', null: false
      t.datetime :paid_until

      t.timestamps
    end
    add_index :users, :email, unique: true
  end
end
