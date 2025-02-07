class UserMailer < ActionMailer::Base
  default from: "Chess Microbase <info@chessmicrobase.com>"
  
  def confirmation_email user
    @user = user
    mail to: user.email, subject: 'Confirm your Chess Microbase account'
  end
  
  def recovery_email user
    @user = user
    mail to: user.email, subject: 'Reset your password'
  end
end
