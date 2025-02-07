namespace :openings do
  desc "Loads all openings from CSV, and updates games"
  task load: :environment do
    require 'csv'
    
    # Erase openings table
    puts "Erasing existing openings"
    Opening.destroy_all

    # Load SCID openings database
    puts "Loading SCID openings"
    File.new('scid.eco').each_line do |line|
      if result = line.match(/^\s*([A-E][0-9][0-9])\w?\s+\"([^\"]+)\"\s+([^\*]+)\*\s*$/)
        code = result[1]
        name = result[2].strip

        # Change move numbering to have a space between dot and move
        moves = result[3].strip.gsub(/(\d+\.+)(\w)/){ "#{$1} #{$2}" }

        unless moves.empty? || name.empty?
          Opening.create!(
            code:   code,
            name:   name,
            moves:  moves
          )
        end
      end
    end

    # NOTE: Not loading this database, because it's not as good as the SCID one
    #
    # # Load Bill Wall's opening variations database
    # puts "Loading Bill Wall's opening variations"
    # CSV.foreach('openings.csv') do |row|
    #   # Skip entries that don't have a full name (only ECO code as name)
    #   if row[1].length > 3
    #     # Strip ECO from end of opening name
    #     name = row[1].sub /;\s*[A-E][0-9][0-9]$/, ''

    #     Opening.create!(
    #       code:   row[0],
    #       name:   name,
    #       moves:  row[2].strip
    #     )
    #   end
    # end
    
    # Look up opening for each game
    puts "Looking up game openings"
    Game.all.each do |game|
      game.update_attribute :updated_at, Time.now
    end
  end
end