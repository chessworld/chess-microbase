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

require 'spec_helper'

describe CouponClaim do
  describe "a new coupon claim" do
    subject { Fabricate :coupon_claim }
    it { is_expected.to be_a CouponClaim }

    it "should update Coupon coupon_claims_count" do
      expect(subject.coupon.coupon_claims_count).to eq(1)
    end
  end
end
