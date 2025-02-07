module GamesHelper
  def initialize_name name
    name.sub(/,\s*(\w).*$/){", #{$1}."}
  end
  
  def black_name_and_rating_for game
    display_name_and_rating game.black, game.black_rating
  end
  
  def display_name_and_rating name, rating
    s = html_escape(name.presence || "Unknown")
    if rating.present?
      s += raw(" " + content_tag('span', class: 'rating-inline'){ rating.to_s })
    end
    s.html_safe
  end
  
  def white_name_and_rating_for game
    display_name_and_rating game.white, game.white_rating
  end
end
