require Rails.root.join('lib/sandbox_email_interceptor')
if Rails.env.staging?
  ActionMailer::Base.register_interceptor(SandboxEmailInterceptor)
end
