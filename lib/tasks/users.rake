namespace :users do
  desc "Makes a user into an admin"
  task promote_admin: :environment do
    print "Email: "
    email = STDIN.gets.chomp
    if user = User.find_by_email(email)
      user.update_attribute :admin, true
      puts "User #{user.full_name} promoted to admin"
    else
      puts "User not found"
    end
  end
end