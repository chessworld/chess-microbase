class UpgradesController < ApplicationController
  PLAN_AMOUNT = 19_95
  PLAN_DESCRIPTION = 'One year premium upgrade'
  PLAN_CURRENCY = 'usd'

  def create
    customer = Stripe::Customer.create(
      email: params[:stripeEmail],
      source: params[:stripeToken],
    )
    charge = Stripe::Charge.create(
      customer: customer.id,
      amount: PLAN_AMOUNT,
      description: PLAN_DESCRIPTION,
      currency: PLAN_CURRENCY,
    )
    current_user.upgrades.create!(
      level: 'premium',
      upgraded_until: Date.today + 1.year,
      stripe_customer_id: customer.id,
      stripe_charge_id: charge.id,
    )
    flash[:success] = "<strong>Thank you for your purchase,</strong> your account has been upgraded to premium".html_safe
    redirect_to microbases_url
  rescue Stripe::CardError => e
    flash[:error] = e.message
    redirect_to upgrade_user_path(current_user.id)
  end
end