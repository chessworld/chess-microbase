require 'spec_helper'

describe GamesHelper do
  let(:game) { Fabricate :game }
  
  describe '#black_name_and_rating_for' do
    it "should call #display_name_and_rating" do
      expect(helper).to receive(:display_name_and_rating).with(game.black, game.black_rating)
      helper.black_name_and_rating_for game
    end
  end
  
  describe '#display_name_and_rating' do
    it "should display unknown when no name" do
      expect(helper.display_name_and_rating('', nil)).to eq('Unknown')
    end
    
    it "should display name by itself" do
      expect(helper.display_name_and_rating('Safran, John', nil)).to eq('Safran, John')
    end
    
    it "should add rating in a span tag" do
      expect(helper.display_name_and_rating('Safran, John', 1275)).to eq('Safran, John <span class="rating-inline">1275</span>')
    end
    
    it "should return raw html" do
      expect(helper.display_name_and_rating('Safran, John', 1275)).to be_html_safe
    end
    
    it "should escape html in name" do
      expect(helper.display_name_and_rating('J<B', nil)).to eq("J&lt;B")
    end
  end
  
  describe '#white_name_and_rating_for' do
    it "should call #display_name_and_rating" do
      expect(helper).to receive(:display_name_and_rating).with(game.white, game.white_rating)
      helper.white_name_and_rating_for game
    end
  end
end
