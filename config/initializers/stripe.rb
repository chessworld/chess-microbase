require 'stripe'

Stripe.api_key = ENV['STRIPE_SECRET_KEY']
STRIPE_PUBLIC_KEY = ENV['STRIPE_PUBLIC_KEY']
