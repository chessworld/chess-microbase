Rails.application.configure do
  config.cache_classes = true

  config.eager_load = true

  config.consider_all_requests_local       = false
  config.action_controller.perform_caching = true

  config.read_encrypted_secrets = true

  config.public_file_server.enabled = ENV['RAILS_SERVE_STATIC_FILES'].present?

  config.assets.js_compressor = Uglifier.new(harmony: true)

  config.assets.compile = true

  #config.action_controller.asset_host = "//assets.chessmicrobase.com"
  config.serve_static_assets = true

  config.action_mailer.perform_caching = false

  config.i18n.fallbacks = true
  config.active_support.deprecation = :notify
    
  config.log_tags = [ :request_id ]
  config.log_formatter = ::Logger::Formatter.new

  config.active_record.dump_schema_after_migration = false

  # Prevent issue with origin check failing due to HTTPS proxy
  config.action_controller.forgery_protection_origin_check = false
end
