require_relative 'boot'

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Chessdb
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 5.1

    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    config.action_mailer.delivery_method = :smtp
    config.action_mailer.default_url_options = {
      host: ENV['DOMAIN'],
      protocol: ENV['USE_HTTPS'].present? ? 'https' : 'http'
    }
    #config.action_mailer.asset_host = "http://#{$domain}"

    config.assets.precompile += %w(
      embedded.css
      mobile.css
      print.css
      modernizr.js
      microbases.js
      games.js
      sharing.js
      embed.js
      embedding.js
      garbochess.js
      mobile.js
      confirm_delete.js
      scheme_select.js)

    config.assets.paths << Rails.root.join('vendor', 'assets', 'javascripts', 'seaturtle', 'lib').to_s
    config.assets.paths << Rails.root.join('vendor', 'assets', 'javascripts', 'game-editor', 'lib').to_s

    config.paths.add 'extras', eager_load: true

    unless Rails.env.test?
      logger = ActiveSupport::Logger.new(STDOUT)
      logger.formatter = config.log_formatter
      config.logger = ActiveSupport::TaggedLogging.new(logger)
      log_level = String(ENV['LOG_LEVEL'] || "info").to_sym
      config.log_level = log_level
      config.lograge.enabled = true
    end
  end
end
