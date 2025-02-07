class CreateCouponClaims < ActiveRecord::Migration[4.2]
  def change
    create_table :coupon_claims do |t|
      t.integer :coupon_id, null: false
      t.integer :user_id, null: false

      t.timestamps
    end
    add_index :coupon_claims, :coupon_id
    add_index :coupon_claims, :user_id
    add_index :coupon_claims, [:coupon_id, :user_id]
  end
end
