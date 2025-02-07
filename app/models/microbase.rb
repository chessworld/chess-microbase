# encoding: UTF-8
# == Schema Information
#
# Table name: microbases
#
#  id                :integer          not null, primary key
#  name              :string(255)
#  token             :string(255)
#  last_accessed_at  :datetime
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  player_names_json :text
#  preamble          :text
#


class Microbase < ActiveRecord::Base
  # Maximum number of games to include in an embedded microbase
  EMBED_LIMIT = 50

  has_many :games, -> { order(:position) }, dependent: :destroy
  has_many :memberships, dependent: :destroy
  has_many :editors, -> { where('memberships.role' => %w(owner collaborator)) }, through: :memberships, source: :user
  has_many :owners, -> { where('memberships.role' => 'owner') }, through: :memberships, source: :user

  validates_presence_of :name
  validates_length_of :name, within: 3..200

  before_create :generate_token
  after_save :import, if: :pgn_file

  scope :other_than, lambda {|microbase| where('microbases.id != ?', microbase.id) }

  attr_accessor :pgn_file, :import_report, :import_limit

  def filtered_games(params)
    order = params[:order]
    order = 'white' unless order.in? %w(white white_rating black black_rating result move_count tournament date)
    filtered = if params[:tag]
      games.tagged_with(params[:tag], on: :tags)
    elsif params[:player]
      games.where('white = :player or black = :player', player: params[:player])
    elsif params[:opening]
      games.where('opening_code like ?', "#{params[:opening]}%")
    else
      games
    end
    filtered.order(order)
  end

  def openings
    @openings ||= {}.tap do |ops|
      games
        .where('opening_code is not null')
        .select(:opening_code)
        .group(:opening_code)
        .reorder(:opening_code)
        .count
        .each do |code, count|
          letter = code[0]
          ops[letter] ||= 0
          ops[letter] += count
        end
    end
  end

  def owner
    owners.first
  end

  def player_names
    @player_names ||= JSON.parse(player_names_json || update_player_names)
  end

  def tag_counts
    @tag_counts ||= games.tag_counts_on(:tags)
  end

  def renumber
    games.reorder('position').each_with_index do |game, i|
      game.position = i + 1
      game.game_number = nil
      game.save
    end
  end

  def update_player_names
    count_player_names
    save
    player_names_json
  end

  private

  def count_player_names
    counts = Hash.new(0)
    names = games.pluck(:white) + games.pluck(:black)
    names.select(&:present?).each do |name|
      counts[name] += 1
    end
    ordered = counts.sort_by{|k,v| v}.reverse
    ordered[50..-1] = [] if ordered.size > 50
    self.player_names_json = ordered.sort.to_json
  end

  def generate_token
    self.token = rand(36**8).to_s(36)
  end

  def import
    pgn = Pgn.new pgn_file.tempfile
    @import_report = {
      imported: 0,
      failed: 0,
      truncated: 0
    }
    position = games.size + 1
    pgn.each do |pgn_game|
      if @import_report[:imported] >= @import_limit
        @import_report[:truncated] += 1
      else
        game = Game.from_pgn(pgn_game)
        game.position, position = position, position + 1
        game.microbase = self
        if game && game.save
          @import_report[:imported] += 1
        else
          @import_report[:failed] += 1
        end
      end
    end
  end
end
