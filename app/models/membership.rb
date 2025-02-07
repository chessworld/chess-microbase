# == Schema Information
#
# Table name: memberships
#
#  id           :integer          not null, primary key
#  microbase_id :integer          not null
#  user_id      :integer          not null
#  role         :string(255)      not null
#  inviter_id   :integer
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#

class Membership < ActiveRecord::Base
  ROLES = %w(owner collaborator invitee)

  belongs_to :microbase
  belongs_to :user
  belongs_to :inviter, class_name: 'User', optional: true

  validates :role, presence: true, inclusion: { in: ROLES }
  validates :inviter, presence: true, if: -> { role == 'invitee' }

  scope :invites, -> { where(role: 'invitee') }
end
