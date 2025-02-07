class AddMicrobasePreamble < ActiveRecord::Migration[4.2]
  def up
    add_column :microbases, :preamble, :text
  end

  def down
    remove_column :microbases, :preamble
  end
end
