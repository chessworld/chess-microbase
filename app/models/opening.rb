# == Schema Information
#
# Table name: openings
#
#  id    :integer          not null, primary key
#  code  :string(3)        not null
#  name  :string(255)      not null
#  moves :string(255)      not null
#

class Opening < ActiveRecord::Base
end
