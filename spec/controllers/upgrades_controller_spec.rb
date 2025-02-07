require 'rails_helper'

RSpec.describe UpgradesController, type: :controller do
  describe '#create' do
    subject(:create) { post :create, params: { user_id: user.id, stripeEmail: stripe_email, stripeToken: stripe_token } }
    let(:user) { Fabricate :user }
    let(:stripe_email) { Faker::Internet.email }
    let(:stripe_token) { Faker::Internet.password }
    before { self.current_user = user }

    context 'when stripe API calls succeed' do
      let(:customer_id) { '123' }
      let(:charge_id) { '456' }
      before do
        allow(Stripe::Customer).to receive(:create) { double id: customer_id }
        allow(Stripe::Charge).to receive(:create) { double id: charge_id }
      end

      it 'creates stripe customer' do
        expect(Stripe::Customer).to receive(:create).with(
          email: stripe_email,
          source: stripe_token,
        )
        create
      end

      it 'creates stripe charge' do
        expect(Stripe::Charge).to receive(:create).with(
          customer: customer_id,
          amount: UpgradesController::PLAN_AMOUNT,
          description: UpgradesController::PLAN_DESCRIPTION,
          currency: UpgradesController::PLAN_CURRENCY,
        )
        create
      end

      it 'creates upgrade' do
        create
        expect(user.upgrades.first.attributes).to include(
          'level' => 'premium',
          'stripe_customer_id' => customer_id,
          'stripe_charge_id' => charge_id,
        )
      end

      it 'displays a success message' do
        create
        expect(flash[:success]).to include('your account has been upgraded')
      end

      it 'redirects to microbases index' do
        create
        expect(response).to redirect_to(microbases_url)
      end
    end

    context 'when stripe API calls fails' do
      before do
        allow(Stripe::Customer).to receive(:create) { double id: 123 }
        allow(Stripe::Charge).to receive(:create).and_raise(Stripe::CardError.new('bad times', 123, 500))
      end

      it 'displays error message' do
        create
        expect(flash[:error]).to eq('bad times')
      end

      it 'redirects to upgrade user path' do
        create
        expect(response).to redirect_to(upgrade_user_path(user.id))
      end
    end
  end
end