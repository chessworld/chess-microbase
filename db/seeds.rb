admin = User.where(email: 'admin@chesskids.com.au').first_or_create!(
  password: 'password',
  admin: true,
  first_name: 'Admin',
  last_name: 'User',
)

microbase = Microbase.where(name: 'Test').first_or_create!(
  preamble: 'Lorem ipsum',
)
microbase.memberships.first_or_create!(
  user: admin,
  role: 'owner'
)

game = microbase.games.first_or_create!(
  white: 'Jane',
  black: 'Ada',
  movetext: '1. e4 e5',
  location: 'Vermilion City',
  round: 1,
  tournament: 'Test Tournament'
)
