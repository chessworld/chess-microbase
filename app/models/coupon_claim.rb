# == Schema Information
#
# Table name: coupon_claims
#
#  id         :integer          not null, primary key
#  coupon_id  :integer          not null
#  user_id    :integer          not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

class CouponClaim < ActiveRecord::Base
  belongs_to :coupon, counter_cache: true
  belongs_to :user

  validates :coupon, presence: true
  validates :user, presence: true
end
