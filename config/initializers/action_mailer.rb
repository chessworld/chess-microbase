ActionMailer::Base.smtp_settings[:address] = ENV['SMTP_HOST']
ActionMailer::Base.smtp_settings[:port] = ENV['SMTP_PORT']
ActionMailer::Base.smtp_settings[:password] = ENV['SMTP_PASSWORD']
ActionMailer::Base.smtp_settings[:user_name] = ENV['SMTP_USERNAME']
ActionMailer::Base.smtp_settings[:authentication] = :plain
