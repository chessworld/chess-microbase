class MigrateUser < ActiveRecord::Base
  self.table_name = 'users'
end

class MigrateUserUpgrade < ActiveRecord::Base
  self.table_name = 'user_upgrades'
end

class CreateUserUpgrades < ActiveRecord::Migration[5.1]
  def up
    create_table :user_upgrades do |t|
      t.string :level, null: false
      t.integer :user_id, null: false
      t.date :upgraded_until, null: false
      t.string :coupon_code
      t.string :stripe_customer_id
      t.string :stripe_charge_id

      t.timestamps
    end

    add_index :user_upgrades, [:user_id, :upgraded_until]

    MigrateUser.where('upgraded_until >= now()').each do |user|
      MigrateUserUpgrade.create!(
        user_id: user.id,
        level: user.account,
        upgraded_until: user.upgraded_until,
      )
    end
  end

  def down
    drop_table :user_upgrades
  end
end
