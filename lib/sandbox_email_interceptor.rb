class SandboxEmailInterceptor
  def self.delivering_email(message)
    message.to = ['developer+sandbox@kidsunlimited.com.au']
  end
end
