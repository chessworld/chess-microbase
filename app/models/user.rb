# encoding: UTF-8
# == Schema Information
#
# Table name: users
#
#  id                       :integer          not null, primary key
#  email                    :string(255)      not null
#  first_name               :string(255)      not null
#  last_name                :string(255)      not null
#  admin                    :boolean          default(FALSE), not null
#  password_digest          :string(255)      not null
#  confirmed_at             :datetime
#  confirmed_with_ip        :string(255)
#  confirmation_token       :string(255)
#  recovery_token           :string(255)
#  account                  :string(255)      default("free"), not null
#  upgraded_until           :datetime
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#  upgraded_by              :string(255)
#  color_scheme             :string(255)      default("Default"), not null
#  default_to_training_mode :boolean          default(FALSE), not null
#


class User < ActiveRecord::Base
  ACCOUNT_TYPES = %w(free premium)
  PREMIUM_COST = 1995
  COLOR_SCHEMES = %w(Default High-contrast Blueberry Dragon-fruit Grape Lime Mango Orange Strawberry)

  has_many :memberships, dependent: :destroy
  has_many :microbases, -> { where("role = 'owner' or role = 'collaborator'") }, through: :memberships
  has_many :coupon_claims, dependent: :destroy
  has_many :upgrades, class_name: 'UserUpgrade', dependent: :destroy

  validates_presence_of :email, :first_name, :last_name
  validates_presence_of :password, on: :create
  validates_uniqueness_of :email

  before_create :generate_confirmation_token
  after_create  :send_confirmation_email

  has_secure_password

  def self.authenticate session
    find_by_email(session[:email]).try(:authenticate, session[:password])
  end

  def confirmed?
    !!confirmed_at
  end

  def premium?
    upgrades.active.where(level: 'premium').any?
  end

  def account_level
    if premium?
      'premium'
    else
      'free'
    end
  end

  def microbase_limit
    if premium?
      100
    else
      3
    end
  end

  def game_limit
    if premium?
      2_000
    else
      100
    end
  end

  def full_name
    "#{first_name} #{last_name}".strip
  end

  def delete_recovery_token!
    update_attribute :recovery_token, nil
  end

  def generate_recovery_token!
    update_attribute :recovery_token, rand(36**8).to_s(36)
  end

  # Checks if user is allowed to claim a coupon
  def can_claim_coupon?(coupon)
    coupon.available? && !has_claimed_coupon?(coupon) && !premium?
  end

  # Checks if user has already claimed a coupon
  def has_claimed_coupon?(coupon)
    coupon_claims.where(coupon_id: coupon.id).any?
  end

  # Claims a coupon for this account
  def claim_coupon(coupon)
    coupon_claims.build(coupon: coupon)
    upgrades.build(
      level: coupon.upgrades_to,
      upgraded_until: coupon.upgrades_from_now_until,
      coupon_code: coupon.code,
    )
    save!
  end

  private

  def generate_confirmation_token
    self.confirmation_token = rand(36**8).to_s(36)
  end

  def send_confirmation_email
    UserMailer.confirmation_email(self).deliver
  end

end
