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

require 'spec_helper'

describe Game do
  subject(:game) { Fabricate.build :game }
  let(:microbase) { game.microbase }
  
  describe '#metadata' do
    it "should include relevant metadata" do
      expect(subject.metadata).to eq([
          "F/S Return Match",
          "Belgrade, Serbia Yugoslavia",
          "4 Nov 1992",
          "Round 29"
        ])
    end
    
    it "should leave out missing data" do
      subject.location = ""
      subject.date = nil
      expect(subject.metadata).to eq([
          "F/S Return Match",
          "Round 29"
        ])
    end
  end

  describe '#valid_game_numbers' do
    context 'for a new game' do
      context 'with no other games in microbase' do
        it 'can only be 1' do
          expect(game.valid_game_numbers).to eq(1..1)
        end
      end

      context 'when microbase has another game' do
        let!(:other_game) { Fabricate :game, microbase: microbase }

        it 'can be from 1 to the highest game position + 1' do
          expect(game.valid_game_numbers).to eq(1..2)
        end
      end
    end

    context 'for an existing game' do
      before { game.save! }
      let!(:other_game) { Fabricate :game, microbase: microbase }

      it 'can be from 1 to the highest game position' do
        expect(game.valid_game_numbers).to eq(1..2)
      end
    end
  end
end
