namespace :maint do
  namespace :db do
    desc 'Fix incorrect autoincrement values'
    task :fix_autoincrement => :environment do
      connection = ActiveRecord::Base.connection
      table_names = connection.execute("SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_catalog = '#{connection.current_database}'")
        .map{|r| r['table_name']}
      table_names.each do |table_name|
        begin
          puts (table_name + ": " + connection.execute("SELECT
            setval('#{table_name}_id_seq', (SELECT max(id) FROM #{table_name})) r;").first['r'].to_s)
        rescue
          puts "#{table_name} failed, skipping..."
        end
      end
    end
  end
end