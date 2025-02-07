# == Schema Information
#
# Table name: coupons
#
#  id                     :integer          not null, primary key
#  code                   :string(255)      not null
#  upgrades_to            :string(255)      not null
#  upgrade_length_in_days :integer          not null
#  expires_on             :date
#  maximum_claims         :integer
#  coupon_claims_count    :integer          default(0), not null
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#

class Coupon < ActiveRecord::Base
  has_many :coupon_claims, dependent: :destroy
  has_many :users, through: :coupon_claims

  validates :code, presence: true, length: {in: 4..255}
  validates :upgrades_to, presence: true, inclusion: {in: User::ACCOUNT_TYPES}
  validates :upgrade_length_in_days, numericality: {only_integer: true}, allow_blank: true
  validates :maximum_claims, numericality: {only_integer: true}, allow_blank: true

  before_validation :upcase_code

  scope :with_code, -> (code) { where('code ILIKE ?', code) }

  # Checks if coupon is available to be claimed
  def available?
    !expired? && !fully_claimed?
  end

  # Checks if coupon is past expiry date
  def expired?
    expires_on && expires_on < Date.today
  end

  # Checks if coupon is fully claimed (has already been claimed the maximum
  # number of times allowed)
  def fully_claimed?
    maximum_claims && coupon_claims_count >= maximum_claims
  end

  # Returns date that coupon will upgrade until, if upgrade applied now
  def upgrades_from_now_until
    upgrade_length_in_days.days.from_now
  end

  private

  def upcase_code
    self.code = code.try(:upcase)
  end
end
