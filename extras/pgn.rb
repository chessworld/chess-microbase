class Pgn < Array
  def initialize source=nil
    if source && source.is_a?(String)
      File.open(source, 'r'){ |file| read_from file }
    elsif source && source.respond_to?(:getc)
      read_from source
    end
  end
  
  private
    def tokenize source
      @text = ""
      @tag_name = ""
      @state = :default
      source.each_char{ |char| tokenize_char char }
      tokenize_char nil
    end
    
    def tokenize_char char
      send "tokenize_char_#{@state}", char
    end
    
    def tokenize_char_default char
      case char
        when "["
          @state = :tag
        when /\s/, nil
          unless @text == ""
            if %w(1-0 1/2-1/2 0-1 *).include? @text
              parse_token result: @text
            elsif @text.match /^[O0]-[O0]/
              # Fix castling move entered invalidly with '0's instead of 'O's
              parse_token move_text: @text.gsub(/0/, 'O')
            else
              parse_token move_text: @text
            end
            @text = ""
          end
        else
          @text << char
      end
    end
    
    def tokenize_char_tag char
      case char
        when '"'
          @state = :tag_value
          @tag_name = @text
          @text = ""
        when "]"
          @state = :default
          @text = ""
        when /\S/
          @text << char
      end
    end 
    
    def tokenize_char_tag_value char
      case char
        when '"'
          @state = :tag
          parse_token tag: @tag_name, value: @text
          @text = ""
        else
          @text << char
      end
    end
  
    def read_from source
      @game = {:moves => ''}
      tokenize source, &method(:parse_token)
    end
    
    def store_game
      self << @game
      @game = {:moves => ''}
    end
    
    def parse_token token
      if token.key? :move_text
        @game[:moves] << " " unless @game[:moves].empty?
        @game[:moves] << token[:move_text]
      elsif token.key? :result
        @game[:result] = token[:result]
        store_game
      elsif token.key? :tag
        @game[token[:tag]] = token[:value]
      end
    end
end
