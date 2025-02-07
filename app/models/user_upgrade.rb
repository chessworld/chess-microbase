class UserUpgrade < ApplicationRecord
  belongs_to :user

  scope :active, -> { where('upgraded_until >= now()') }
end
