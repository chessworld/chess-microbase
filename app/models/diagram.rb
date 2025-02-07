require 'cairo'

class Diagram < StringIO
  include Cairo

  attr :fen

  def initialize(data)
    super()
    items = data.split(',', 2)
    @fen = items[0]
    @markup = Diagram::Markup.new(
      markup: items[1],
      square_size: square_size,
      board_offset: board_offset,
      mask_surface: mask_surface,
    )
    @markup.parse
    render
  end

  def board_offset
    4
  end

  def render
    surface = ImageSurface.from_png(Rails.root.join("app/assets/images/diagram-board.png").to_s)
    context = Context.new surface
    @markup.render_highlights(context)
    x = y = board_offset
    @fen.each_char do |char|
      case char
        when /[pnbrkqPNBRKQ]/
          draw_piece context, x, y, char
          x += square_size
        when '/'
          x = board_offset
          y += square_size
        when /[12345678]/
          x += char.to_i * square_size
        else
          break
      end
    end
    @markup.render_arrows(context)
    surface.write_to_png self
    rewind
  end

  private

  def draw_piece(context, x, y, piece)
    xoff = case piece.downcase
      when 'p'; 0
      when 'n'; square_size
      when 'b'; square_size * 2
      when 'r'; square_size * 3
      when 'q'; square_size * 4
      when 'k'; square_size * 5
    end
    yoff = piece.downcase == piece ? square_size : 0

    pattern = pieces_pattern
    pattern.matrix = Matrix.translate xoff-x, yoff-y
    context.set_source pattern
    context.rectangle x, y, square_size, square_size
    context.fill
  end

  def pieces_pattern
    @pieces_surface ||= ImageSurface.from_png(Rails.root.join("app/assets/images/game_editor/Chess-Pieces-#{square_size}.png").to_s)
    @pieces_pattern ||= SurfacePattern.new @pieces_surface
  end

  def mask_surface
    @mask_surface ||= ImageSurface.from_png(Rails.root.join("app/assets/images/diagram-board-mask.png").to_s)
  end

  def square_size
    80
  end
end
