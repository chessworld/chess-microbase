class Diagram::Highlight
  def initialize(coord:, color:, square_size:, board_offset:, mask_surface:)
    @coord = coord
    @color = color
    @square_size = square_size
    @board_offset = board_offset
    @mask_surface = mask_surface
  end
  
  attr :coord, :color, :square_size, :board_offset, :mask_surface

  def draw(context)
    if corner_square?
      draw_with_mask(context)
    else
      draw_without_mask(context)
    end
  end
  
  private

  def corner_square?
    coord.all? { |x| x == 0 || x == 7 }
  end

  def dark_square?
    coord.sum % 2 == 1
  end

  def draw_without_mask(context)
    context.set_source_rgb(*rgb_color)
    context.rectangle(*point, square_size, square_size)
    context.fill
  end

  def draw_with_mask(context)
    # Use mask image to add rounded corner to corner squares
    scratch = mask_surface.create_similar(Cairo::Content::COLOR_ALPHA, 688, 688)
    scratch_context = Cairo::Context.new(scratch)
    draw_without_mask(scratch_context)
    context.set_source(scratch, 0, 0)
    context.mask(mask_surface, 0, 0)
  end

  def rgb_color
    if dark_square?
      color[:dark]
    else
      color[:light]
    end
  end

  def point
    coord.map { |x| x * square_size + board_offset }
  end
end
