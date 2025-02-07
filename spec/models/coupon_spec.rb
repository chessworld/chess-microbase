#
# Table name: coupons
#
#  id                     :integer          not null, primary key
#  code                   :string(255)      not null
#  upgrades_to            :string(255)      not null
#  upgrade_length_in_days :integer          not null
#  expires_on             :date
#  maximum_claims         :integer
#  coupon_claims_count    :integer          default(0), not null
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#

require 'spec_helper'

describe Coupon do
  subject(:coupon) { Fabricate.build :coupon }

  describe "a new coupon" do
    it { is_expected.to be_a Coupon }
    it { is_expected.to be_valid }
  end

  describe '#available?' do
    it { is_expected.to be_available }

    context "when fully claimed" do
      before { allow(subject).to receive(:fully_claimed?).and_return(true) }
      it { is_expected.not_to be_available }
    end

    context "when expired" do
      before { allow(subject).to receive(:expired?).and_return(true) }
      it { is_expected.not_to be_available }
    end
  end

  describe '#expired?' do
    context "with no expiry date" do
      it { is_expected.not_to be_expired }
    end

    context "when before expiry date" do
      before { subject.expires_on = 1.day.from_now }
      it { is_expected.not_to be_expired }
    end

    context "when on expiry date" do
      before { subject.expires_on = Date.today }
      it { is_expected.not_to be_expired }
    end

    context "when past expiry date" do
      before { subject.expires_on = 1.day.ago }
      it { is_expected.to be_expired }
    end
  end

  describe '#fully_claimed?' do
    context "with no maximum claims" do
      it { is_expected.not_to be_fully_claimed }
    end

    context "when under maximum claims" do
      before do
        subject.maximum_claims = 20
        subject.coupon_claims_count = 5
      end

      it { is_expected.not_to be_fully_claimed }
    end

    context "when at maximum claims" do
      before do
        subject.maximum_claims = 20
        subject.coupon_claims_count = 20
      end

      it { is_expected.to be_fully_claimed }
    end
  end

  describe '#upgrades_from_now_until' do
    describe '#upgrades_from_now_until' do
      subject { super().upgrades_from_now_until }
      it { is_expected.to be_the_same_time_as 3.days.from_now }
    end

    context "with a longer expiry date" do
      before { subject.upgrade_length_in_days = 20 }

      describe '#upgrades_from_now_until' do
        it 'returns correct date' do
          expect(coupon.upgrades_from_now_until).to be_the_same_time_as 20.days.from_now
        end
      end
    end
  end
end
