class Diagram::Markup
  def initialize(markup:, square_size:, board_offset:, mask_surface:)
    @markup = markup
    @square_size = square_size
    @board_offset = board_offset
    @mask_surface = mask_surface
    @highlights = []
    @arrows = []
  end

  attr :markup, :square_size, :board_offset, :mask_surface

  def render_highlights(context)
    @highlights.each { |highlight| highlight.draw(context) }
  end

  def render_arrows(context)
    @arrows.each { |arrow| arrow.draw(context) }
  end

  def parse
    return unless markup.present?

    markup.split(',').each do |item|
      if match = item.match(/^\s*([a-h])([1-8])([\?!]?)\s*$/)
        parse_highlight(*match)
      elsif match = item.match(/^\s*([a-h])([1-8])-([1-8])([\?!]?)\s*$/)
        parse_highlight_range(*match)
      elsif match = item.match(/^\s*([a-h])([1-8])->([a-h])([1-8])([\?!]?)\s*$/)
        parse_arrow(*match)
      else
        Rails.logger.warn "unmatched diagram markup: #{item}"
      end
    end
  end

  private

  def parse_color(color_code)
    base = case color_code
      when '!'
        [0.65, 1, 0.58]
      when '?'
        [0.94, 0.56, 0.55]
      else
        [1, 1, 0.6]
    end
    {
      light: base,
      dark: base.map { |x| x * 0.75 }
    }
  end

  def parse_file(file)
    file.ord - 'a'.ord
  end

  def parse_rank(rank)
    7 - (rank.ord - '1'.ord)
  end

  def parse_highlight(_, file, rank, color_code)
    @highlights << Diagram::Highlight.new(
      coord: [parse_file(file), parse_rank(rank)],
      color: parse_color(color_code),
      square_size: square_size,
      board_offset: board_offset,
      mask_surface: mask_surface,
    )
  end

  def parse_highlight_range(_, file, from_rank, to_rank, color_code)
    x = parse_file(file)
    y_from = parse_rank(from_rank)
    y_to = parse_rank(to_rank)
    (y_to..y_from).each do |y|
      @highlights << Diagram::Highlight.new(
        coord: [x, y],
        color: parse_color(color_code),
        square_size: square_size,
        board_offset: board_offset,
        mask_surface: mask_surface,        
      )
    end
  end

  def parse_arrow(_, from_file, from_rank, to_file, to_rank, color_code)
    @arrows << Diagram::Arrow.new(
      from_coord: [parse_file(from_file), parse_rank(from_rank)],
      to_coord: [parse_file(to_file), parse_rank(to_rank)],
      color: parse_color(color_code),
      square_size: square_size,
      board_offset: board_offset,
    )
  end
end
