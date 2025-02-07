class CreateOpenings < ActiveRecord::Migration[4.2]
  def change
    create_table :openings do |t|
      t.column :code, 'char(3)', null: false
      t.string :name, null: false
      t.string :moves, null: false
    end
  end
end
