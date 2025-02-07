# encoding: UTF-8
# == Schema Information
#
# Table name: games
#
#  id                   :integer          not null, primary key
#  microbase_id         :integer          not null
#  fen                  :string(255)
#  movetext             :text             default(""), not null
#  white                :string(255)
#  black                :string(255)
#  white_rating         :integer
#  black_rating         :integer
#  tournament           :string(255)
#  location             :string(255)
#  tournament_rounds    :integer
#  tournament_type      :string(255)
#  tournament_country   :string(255)
#  round                :integer
#  subround             :integer
#  result               :string(255)
#  date                 :date
#  unannotated_movetext :text
#  move_count           :integer
#  ply_count            :integer
#  opening_id           :integer
#  opening_code         :string(3)
#  token                :string(255)
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  has_comments         :boolean
#  position             :integer
#  hits                 :integer          default(0), not null
#

class Game < ActiveRecord::Base
  include ActionView::Helpers::TextHelper

  RESULTS = %w(1-0 ½-½ 0-1)

  belongs_to :microbase
  belongs_to :opening, optional: true

  validates :game_number, inclusion: { in: -> (r) { r.valid_game_numbers }, message: 'invalid' }, allow_blank: true

  before_create :generate_token
  before_save :calculate_data
  after_save :reposition, if: :game_number_changed?

  scope :shared, -> { where('hits > 0') }

  scope :search, -> (terms) do
    result = self
    if terms.present?
      terms.split(/\s+/).each do |term|
        next if term.blank?

        result = result.where('
          fen ILIKE :term OR
          white ILIKE :term OR
          black ILIKE :term OR
          tournament ILIKE :term OR
          location ILIKE :term OR
          tournament_type ILIKE :term OR
          tournament_country ILIKE :term
        ', term: "%#{term}%")
      end
    end
    result
  end

  attr :game_number

  acts_as_list scope: :microbase

  acts_as_taggable
  self.per_page = 100

  def initialize *args
    super
    @game_number = position
  end

  # TODO: Move this somewhere more appropriate, and refactor
  def self.deannotate movetext
    tokens = tokenize movetext
    depth = 0
    in_annotation = false
    output = []
    tokens.each do |token|
      if in_annotation
        in_annotation = false if token == '}'
      else
        if token == '('
          depth += 1
        elsif token == ')'
          depth -= 1
        elsif token == '{'
          in_annotation = true
        elsif depth == 0 && token.match(/([a-h][1-8]|O-O|--)/)
          if output.length % 3 == 0
            output.push "#{output.length / 3 + 1}."
          end
          output.push token.sub(/[\?\!]+$/,'')
        end
      end
    end
    output.join ' '
  end

  def self.from_pgn pgn
    self.new.tap do |game|
      game.pgn_data = pgn
    end
  end

  # TODO: Make this private
  def self.tokenize(movetext)
    [].tap do |tokens|
      word = ''
      movetext.each_char do |character|
        if character.match /[\[\]\(\)<>\{\}\.\s]/
          unless word.empty?
            word.sub! /\s+$/, ''
            tokens << word unless word.empty?
            word = ''
          end
          tokens << character if character.match /[\[\]\(\)\{\}<>]/
        else
          word << character
        end
      end
      tokens << word unless word.empty?
    end
  end

  def black_with_rating
    black.presence && (black_rating.present? ? "#{black} (#{black_rating})" : black)
  end

  def copyable_attributes
    # TODO: Reduce repetition here
    {
      fen:                  fen,
      movetext:             movetext,
      white:                white,
      black:                black,
      white_rating:         white_rating,
      black_rating:         black_rating,
      tournament:           tournament,
      location:             location,
      tournament_rounds:    tournament_rounds,
      tournament_type:      tournament_type,
      tournament_country:   tournament_country,
      round:                round,
      subround:             subround,
      result:               result,
      date:                 date,
      tag_list:             tag_list
    }
  end

  def date_formatted
    date.presence && date.strftime('%-d/%-m/%Y')
  end

  def date_formatted= value
    parts = value.split('/')
    self.date = if parts.count == 3
      Date.parse(parts.reverse.join('-'))
    else
      nil
    end
  end

  def game_number= value
    value = value.blank? ? nil : value.to_i
    unless value == @game_number
      @game_number = value
      @game_number_changed = true
    end
  end

  def game_number_changed?
    !!@game_number_changed
  end

  def generate_token
    self.token = rand(36**8).to_s(36)
  end

  def hit
    increment! :hits
  end

  def metadata
    m = [
      tournament,
      location,
      date? && date.strftime("%-d %b %Y"),
      round? && "Round #{round}"
    ]
    m.select(&:present?)
  end

  # Moves this game from one microbase to another, placing it at the end of
  # list. Takes care to ensure game positions are kept consistent in both the
  # source and destination database.
  def move_to(to_microbase)
    Game.transaction do
      remove_from_list
      reload
      self.microbase = to_microbase
      self.position = to_microbase.games.count + 1
      Game.skip_callback(:update, :after, :update_positions)
      save!
    end
  end

  def name
    "#{white.presence || 'Unknown'} vs #{black.presence || 'Unknown'}"
  end

  def name_with_ratings
    "#{white_with_rating || 'Unknown'} vs #{black_with_rating || 'Unknown'}"
  end

  # TODO: Refactor PGN methods into their own class
  def pgn
    lines = []

    # STR
    lines << %{[Event "#{tournament}"]} if tournament.present?
    lines << %{[Site "#{location}"]} if location.present?
    lines << %{[Date "#{date.strftime '%Y.%m.%d'}"]} if date.present?
    lines << %{[Round "#{round_and_subround}"]} if round.present?
    lines << %{[White "#{white}"]} if white.present?
    lines << %{[Black "#{black}"]} if black.present?
    lines << %{[Result "#{pgn_result}"]} if result.present?

    # Options
    lines << %{[WhiteElo "#{white_rating}"]} if white_rating.present?
    lines << %{[BlackElo "#{black_rating}"]} if black_rating.present?
    lines << %{[EventType "#{tournament_type}"]} if tournament_type.present?
    lines << %{[EventRounds "#{tournament_rounds}"]} if tournament_rounds.present?
    lines << %{[EventCountry "#{tournament_country}"]} if tournament_country.present?
    lines << %{[FEN "#{fen}"]} if fen.present?

    # Opening
    if opening
      lines << %{[ECO "#{opening.code}"]}
      lines << %{[Opening "#{opening.name}"]}
    end

    lines << ''
    lines << pgn_movetext
    lines.join "\n"
  end

  def pgn= value
    self.pgn_data = Pgn.new(StringIO.new(value)).first
  end

  def pgn_data= pgn
    self.fen = pgn['FEN'] if pgn['FEN']
    self.result = pgn['Result'] if pgn['Result']
    self.result = '½-½' if result == '1/2-1/2'
    self.result = nil if result == '*'
    if pgn[:moves]
      self.movetext = pgn[:moves]
      # Add default finish reason for games without checkmate
      unless movetext.match /#/
        self.movetext += case result
          when '1-0'
            ' {#r}'
          when '0-1'
            ' {#R}'
          when '½-½'
            ' {#d}'
          else
            ''
        end
      end
    end
    self.white = pgn['White'] if pgn['White']
    self.black = pgn['Black'] if pgn['Black']
    self.white_rating = pgn['WhiteElo'] if pgn['WhiteElo']
    self.black_rating = pgn['BlackElo'] if pgn['BlackElo']
    self.date = pgn['Date'] if pgn['Date']
    self.tournament = pgn['Event'] if pgn['Event']
    self.location = pgn['Site'] if pgn['Site']
    self.tournament_type = pgn['EventType'] if pgn['EventType']
    self.tournament_rounds = pgn['EventRounds'] if pgn['EventRounds']
    self.tournament_country = pgn['EventCountry'] if pgn['EventCountry']
    if pgn['Round']
      a = pgn['Round'].split('.')
      self.round = a[0] if a[0]
      self.subround = a[1] if a[1]
    end
  end

  def pgn_movetext
    word_wrap "#{movetext} #{pgn_result}", line_width: 78
  end

  def pgn_result
    case result
      when '½-½'
        '1/2-1/2'
      when '1-0'
        '1-0'
      when '0-1'
        '0-1'
      else
        '*'
    end
  end

  def round_and_subround
    if subround
      "#{round}.#{subround}"
    elsif round
      round
    else
      nil
    end
  end

  def white_with_rating
    white.presence && (white_rating.present? ? "#{white} (#{white_rating})" : white)
  end

  def valid_game_numbers
    max = microbase.games.last.try(:position) || 0
    max += 1 if new_record? || microbase_id_changed?
    1..max
  end

  private

  def calculate_data
    self.unannotated_movetext = Game.deannotate(movetext)
    self.opening = Opening.where("? like concat(moves, '%')", unannotated_movetext).order('length(moves) desc').first
    self.opening_code = opening.try(:code)
    self.move_count = (unannotated_movetext && unannotated_movetext.match(/(\d+)\.[^\.]+$/) && $1).to_i
    self.ply_count = (unannotated_movetext && unannotated_movetext.scan(/([a-h][1-8]|O-O|--)/).count)
    self.has_comments = !!movetext.match(/\{.*\}/)
    nil
  end

  def reposition
    if game_number = @game_number
      @game_number = nil
      insert_at game_number
    end
  end
end
