Fabricator(:user) do
  email         { Faker::Internet.email }
  first_name    { Faker::Name.name.split(' ').first }
  last_name     { Faker::Name.name.split(' ').last }
  password      { "rook123" }
end