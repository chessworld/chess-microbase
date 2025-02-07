class Diagram::Arrow
  ARROW_HEAD_MIN_SIZE = 24
  ARROW_HEAD_MAX_SIZE = 90
  ARROW_HEAD_WIDTH = 0.5
  ARROW_NECK_WIDTH = 0.15
  
  def initialize(from_coord:, to_coord:, color:, square_size:, board_offset:)
    @from_coord = from_coord
    @to_coord = to_coord
    @color = color
    @square_size = square_size
    @board_offset = board_offset
  end
  
  attr :from_coord, :to_coord, :color, :square_size, :board_offset
  
  def self.calc_point(point, direction, distance)
    [
      point[0] + Math.cos(direction) * distance,
      point[1] + Math.sin(direction) * distance
    ]
  end

  def draw(context)
    context.set_source_rgb(*color[:light])
    apply_path(context)
    context.fill
    context.set_source_rgb(*color[:dark])
    context.set_line_width(2)
    apply_path(context)
    context.stroke
  end

  private

  def offset
    @offset ||= [
      to_point[0] - from_point[0],
      to_point[1] - from_point[1],
    ]
  end

  def arrow_direction
    @arrow_direction ||= Math.atan2(*offset.reverse)
  end

  def arrow_length
    @arrow_length ||= Math.sqrt(offset.map { |x| x * x }.sum)
  end

  def head_length
    @head_length ||= begin
      scale = (arrow_length / (square_size * 8)).clamp(0, 1)
      ARROW_HEAD_MIN_SIZE + (ARROW_HEAD_MAX_SIZE - ARROW_HEAD_MIN_SIZE) * scale
    end
  end

  def head_width
    @head_width ||= head_length * ARROW_HEAD_WIDTH
  end

  def neck_width
    @neck_width ||= head_length * ARROW_NECK_WIDTH
  end
  
  def left_direction
    @left_direction ||= arrow_direction - Math::PI / 2
  end

  def right_direction
    @right_direction ||= arrow_direction + Math::PI / 2
  end

  def head
    Diagram::Arrow.calc_point(to_point, arrow_direction, head_length * -1)
  end

  def left_neck
    Diagram::Arrow.calc_point(head, left_direction, neck_width)
  end

  def right_neck
    Diagram::Arrow.calc_point(head, right_direction, neck_width)
  end

  def left_corner
    Diagram::Arrow.calc_point(head, left_direction, head_width)
  end

  def right_corner
    Diagram::Arrow.calc_point(head, right_direction, head_width)
  end

  def apply_path(context)
    context.move_to(*from_point)
    context.line_to(*left_neck)
    context.line_to(*left_corner)
    context.line_to(*to_point)
    context.line_to(*right_corner)
    context.line_to(*right_neck)
    context.line_to(*from_point)
  end

  def coord_to_point(coord)
    coord.map { |x| (x.to_f + 0.5) * square_size + board_offset }
  end

  def from_point
    coord_to_point(from_coord)
  end

  def to_point
    coord_to_point(to_coord)
  end
end
