def current_user=(user)
  session[:user_id] = user.id
end