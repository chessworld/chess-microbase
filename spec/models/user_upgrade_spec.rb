require 'rails_helper'

RSpec.describe UserUpgrade, type: :model do
  describe '.active' do
    context 'when upgraded_until is in the future' do
      let!(:user_upgrade) { Fabricate :user_upgrade }

      it 'matches the user upgrade' do
        expect(UserUpgrade.active).to include(user_upgrade)
      end
    end

    context 'when upgraded_until is in the past' do
      let!(:user_upgrade) { Fabricate :user_upgrade, upgraded_until: 1.day.ago }

      it 'does not match the user upgrade' do
        expect(UserUpgrade.active).not_to include(user_upgrade)
      end
    end
  end
end
