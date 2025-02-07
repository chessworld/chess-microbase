touch tmp/maintenance.txt
git submodule update
bundle install --deployment
bundle exec rake deploy RAILS_ENV=production
touch tmp/restart.txt
rm tmp/maintenance.txt