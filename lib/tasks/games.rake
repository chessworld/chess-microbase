namespace :games do
  desc "Renumbers all games"
  task renumber: :environment do
    Microbase.all.each &:renumber
  end

  desc "Regenerates player name indexes for games"
  task count_players: :environment do
    Microbase.all.each &:update_player_names
  end
end