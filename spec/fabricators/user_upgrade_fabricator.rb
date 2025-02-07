Fabricator :user_upgrade do
  user
  level { 'premium' }
  upgraded_until { Date.today + 1.year }
  stripe_customer_id { Faker::Code.isbn }
  stripe_charge_id { Faker::Code.isbn }
end