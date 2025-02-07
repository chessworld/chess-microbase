class CreateGames < ActiveRecord::Migration[4.2]
  def change
    create_table :games do |t|
      t.integer :owner_id, null: false
      t.integer :database_id, null: false
      t.string :fen
      t.text :movetext, null: false
      t.string :white
      t.string :black
      t.decimal :white_rating, precision: 9, scale: 4
      t.decimal :black_rating, precision: 9, scale: 4
      t.string :tournament
      t.string :location
      t.integer :tournament_rounds
      t.string :tournament_type
      t.string :tournament_country
      t.integer :round
      t.integer :subround
      t.string :result
      t.date :date
      t.text :unannotated_movetext
      t.integer :move_count
      t.integer :ply_count
      t.integer :opening_id
      t.column :opening_code, 'char(3)'
      t.string :token

      t.timestamps
    end
    add_index :games, :owner_id
    add_index :games, :database_id
  end
end
