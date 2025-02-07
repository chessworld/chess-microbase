Rails.application.config.session_store(:redis_store,
  servers: ENV['REDIS_URLS']&.split(";"),
  key: 'chessmicrobase_session',
  expire_after: 1.week,
)
