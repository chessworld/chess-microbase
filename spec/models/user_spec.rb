# encoding: UTF-8
# == Schema Information
#
# Table name: users
#
#  id                       :integer          not null, primary key
#  email                    :string(255)      not null
#  first_name               :string(255)      not null
#  last_name                :string(255)      not null
#  admin                    :boolean          default(FALSE), not null
#  password_digest          :string(255)      not null
#  confirmed_at             :datetime
#  confirmed_with_ip        :string(255)
#  confirmation_token       :string(255)
#  recovery_token           :string(255)
#  account                  :string(255)      default("free"), not null
#  upgraded_until           :datetime
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#  upgraded_by              :string(255)
#  color_scheme             :string(255)      default("Default"), not null
#  default_to_training_mode :boolean          default(FALSE), not null
#


require 'spec_helper'

describe User do
  let(:user) { Fabricate.build :user }

  describe '#premium?' do
    subject(:premium?) { user.premium? }

    context 'user does not have premium upgrade' do
      it 'is false' do
        expect(premium?).to be(false)
      end
    end

    context 'user has a premium upgrade' do
      let!(:upgrade) { Fabricate :user_upgrade, user: user }

      it 'is true' do
        expect(premium?).to be(true)
      end
    end
  end

  describe '#account_level' do
    subject(:account_level) { user.account_level }

    context 'user does not have premium upgrade' do
      it 'is free' do
        expect(account_level).to eq('free')
      end
    end

    context 'user has a premium upgrade' do
      let!(:upgrade) { Fabricate :user_upgrade, user: user }

      it 'is premium' do
        expect(account_level).to eq('premium')
      end
    end
  end

  describe '#microbase_limit' do
    subject(:microbase_limit) { user.microbase_limit }

    context 'user does not have premium upgrade' do
      it 'is 3' do
        expect(microbase_limit).to eq(3)
      end
    end

    context 'user has a premium upgrade' do
      let!(:upgrade) { Fabricate :user_upgrade, user: user }

      it 'is 100' do
        expect(microbase_limit).to eq(100)
      end
    end
  end

  describe '#game_limit' do
    subject(:game_limit) { user.game_limit }

    context 'user does not have premium upgrade' do
      it 'is 100' do
        expect(game_limit).to eq(100)
      end
    end

    context 'user has a premium upgrade' do
      let!(:upgrade) { Fabricate :user_upgrade, user: user }

      it 'is 2000' do
        expect(game_limit).to eq(2000)
      end
    end
  end

  describe '#full_name' do
    subject(:full_name) { user.full_name }

    it 'joins first and last names' do
      expect(full_name).to eq("#{user.first_name} #{user.last_name}")
    end
  end

  describe '#can_claim_coupon?' do
    subject(:can_claim_coupon?) { user.can_claim_coupon?(coupon) }
    let(:coupon) { Fabricate.build :coupon }

    it "should be true if coupon is available" do
      expect(can_claim_coupon?).to be(true)
    end

    it "should be false if coupon is not available" do
      coupon.expires_on = 1.week.ago
      expect(can_claim_coupon?).to be(false)
    end

    it "should be false if user has already claimed coupon" do
      user.save!
      coupon.save!
      user.claim_coupon coupon
      expect(can_claim_coupon?).to be(false)
    end

    it "should be false if user account is already upgraded" do
      user.save!
      user.upgrades.create(
        level: 'premium',
        upgraded_until: 1.year.from_now,
      )
      expect(can_claim_coupon?).to be(false)
    end
  end

  describe '#has_claimed_coupon?' do
    subject(:has_claimed_coupon?) { user.has_claimed_coupon?(coupon) }
    let(:coupon) { Fabricate.build :coupon }

    it "should be false if coupon not claimed" do
      expect(has_claimed_coupon?).to be(false)
    end

    it "should be true if coupon has been claimed" do
      user.claim_coupon(coupon)
      expect(has_claimed_coupon?).to be(true)
    end
  end

  describe '#claim_coupon' do
    subject(:claim_coupon) { user.claim_coupon(coupon) }
    let(:coupon) { Fabricate.build :coupon }
    before { user.save! }

    it "should create a coupon claim" do
      claim_coupon
      expect(CouponClaim.where(user_id: user.id, coupon_id: coupon.id).count).to eq(1)
    end

    it "should upgrade account" do
      claim_coupon
      expect(user).to be_premium
    end

    it "should set upgraded until" do
      claim_coupon
      expect(user.upgrades.active.first.upgraded_until.to_date).to eq(coupon.upgrades_from_now_until.to_date)
    end

    it "should set coupon_code" do
      claim_coupon
      expect(user.upgrades.active.first.coupon_code).to eq(coupon.code)
    end
  end
end
