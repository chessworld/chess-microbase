FROM ubuntu:jammy

RUN apt-get update -qq && apt-get install -y \
  build-essential \
  libpq-dev \
  postgresql-client \
  default-jre \
  python-setuptools \
  ruby-full

# Make app directory
RUN mkdir -p /srv
WORKDIR /srv

# Install gems with bundler
ADD Gemfile /srv/Gemfile
ADD Gemfile.lock /srv/Gemfile.lock
RUN gem install bundler && bundle install

# Install node modules with yarn
# ADD package.json /srv/package.json
# ADD yarn.lock /srv/yarn.lock
# RUN yarn install

# Copy the application code
ADD . /srv/

# Compile assets
# RUN bundle exec rake RAILS_ENV=production NODE_ENV=production assets:precompile
