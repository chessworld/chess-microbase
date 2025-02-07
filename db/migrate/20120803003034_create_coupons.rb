class CreateCoupons < ActiveRecord::Migration[4.2]
  def change
    create_table :coupons do |t|
      t.string :code, null: false
      t.string :upgrades_to, null: false
      t.integer :upgrade_length_in_days, null: false
      t.date :expires_on
      t.integer :maximum_claims
      t.integer :coupon_claims_count, null: false, default: 0

      t.timestamps
    end
  end
end
