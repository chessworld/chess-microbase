import jQuery from 'jquery'
import { Core, View, Util } from 'seaturtle'

import { PieceView } from './piece-view'

export const BoardView = Core.makeClass('BoardView', View.BaseView, (def) => {
  def.LEGAL_COLOR    = "#0C0";
  def.ILLEGAL_COLOR  = "#C00";
  def.CHECKING_COLOR = "rgba(255,200,200,0.6)";

  def.ARROW_BORDER = {
    green:  "#0C0",
    yellow: "#CC0",
    red:    "#C00"
  };
  def.ARROW_FILL = {
    green:  "#8E8",
    yellow: "#EE8",
    red:    "#E88"
  };

  def.ARROW_HEAD_MIN_SIZE = 12;
  def.ARROW_HEAD_MAX_SIZE = 45;
  def.ARROW_HEAD_WIDTH = 0.5;
  def.ARROW_NECK_WIDTH = 0.15;

  def.MODE_MOVE                  = 0;
  def.MODE_MARKUP_SQUARE_GREEN   = 1;
  def.MODE_MARKUP_SQUARE_YELLOW  = 2;
  def.MODE_MARKUP_SQUARE_RED     = 3;
  def.MODE_MARKUP_ARROW_GREEN    = 4;
  def.MODE_MARKUP_ARROW_YELLOW   = 5;
  def.MODE_MARKUP_ARROW_RED      = 6;
  def.MODE_MARKUP_ERASE          = 7;
  def.MODE_POSITION_SETUP        = 8;
  def.MODE_SELECT                = 9;

  def.property('board');
  def.property('pieceViews');
  def.property('flipped');
  def.accessor('markupText');
  def.property('mode');
  def.property('recordIllegalMove');
  def.property('readOnly');
  def.property('presentationMode');
  def.property('size');
  def.property('squareSize');
  def.property('rankNotation');
  def.property('fileNotation');
  def.property('setupPiece');

  def.initializer(function(options) {
    if (options == null) { options = {}; }
    this.super();
    this._readOnly = !!options.readOnly;
    this._presentationMode = false;
    this._board = options.board;
    this._recordIllegalMove = false;
    this._mode = def.MODE_MOVE;
    this._pieceViews = {};
    this._touches = {};
    this._arrows = Core.List.create();
    this._flipped = false;
    this._rankNotation = options.rankNotation || 'outside';
    this._fileNotation = options.fileNotation || 'outside';
    this.size(options.size || 320);
    this._squares = null;
    this.bindEvents();
    return this.updatePieces();
  });

  def.method('_flippedChanged', function(oldValue, newValue) {
    if (oldValue !== newValue) {
      // Flip pieces
      for (let id in this._pieceViews) {
        const pieceView = this._pieceViews[id];
        pieceView.flipped(newValue);
      }

      // Flip markup
      this._flipped = oldValue;
      const markupText = this.markupText();
      this._flipped = newValue;
      this.markupText(markupText);

      // Flip board notation
      this.updateNotation();

      return this.trigger('flipped');
    }
  });

  def.method('_presentationModeChanged', function() {
    return this._element.toggleClass('presentation-mode', this._presentationMode);
  });

  def.method('addArrow', function(options) {
    options.arrow.attr('path', this.pathForArrow(
      this.positionToScreen(options.from.x) + (this._squareSize / 2),
      this.positionToScreen(options.from.y) + (this._squareSize / 2),
      this.positionToScreen(options.to.x) + (this._squareSize / 2),
      this.positionToScreen(options.to.y) + (this._squareSize / 2)
    )
    );
    options.arrow.from = options.from;
    options.arrow.to = options.to;
    return this._arrows.add(options.arrow);
  });

  def.method('bindEvents', function() {
    if (Util.detectTouch()) {
      // Only bind touch events after element is in the dom to workaround
      // iOS 5 bug
      if (this._element.closest('html').length) {
        // Handle touch events
        let result, touch;
        this._element.on('touchstart', e => {
          return (() => {
            result = [];
            for (touch of Array.from(e.originalEvent.changedTouches)) {
              if (this.touchStart(touch.identifier, this.translatePoint(touch))) { result.push(e.preventDefault()); } else {
                result.push(undefined);
              }
            }
            return result;
          })();
        });
        this._element.on('touchmove', e => {
          return (() => {
            result = [];
            for (touch of Array.from(e.originalEvent.targetTouches)) {
              if (this.touchMove(touch.identifier, this.translatePoint(touch))) { result.push(e.preventDefault()); } else {
                result.push(undefined);
              }
            }
            return result;
          })();
        });
        this._element.on('touchend', e => {
          return (() => {
            result = [];
            for (touch of Array.from(e.originalEvent.changedTouches)) {
              if (this.touchEnd(touch.identifier, this.translatePoint(touch))) { result.push(e.preventDefault()); } else {
                result.push(undefined);
              }
            }
            return result;
          })();
        });
        return this._element.on('touchcancel', e => {
          return (() => {
            result = [];
            for (touch of Array.from(e.originalEvent.changedTouches)) {
              if (this.touchCancel(touch.identifier, this.translatePoint(touch))) { result.push(e.preventDefault()); } else {
                result.push(undefined);
              }
            }
            return result;
          })();
        });
      } else {
        return setTimeout(this.method('bindEvents'), 100);
      }
    } else {
      // Handle mouse events
      const mouseDown = e => {
        if (this.touchStart(-1, this.translatePoint(e))) { e.preventDefault(); }

        // Capture mouse
        return jQuery(window.document).mousemove(mouseMove).mouseup(mouseUp);
      };

      var mouseMove = e => {
        if (this.touchMove(-1, this.translatePoint(e))) { return e.preventDefault(); }
      };

      var mouseUp = e => {
        if (this.touchEnd(-1, this.translatePoint(e))) { e.preventDefault(); }

        // Release mouse
        return jQuery(window.document).unbind('mousemove', mouseMove).unbind('mouseup', mouseUp);
      };

      this._element.mousedown(mouseDown);
      this._element.mousemove(mouseMove);
      return this._element.mouseup(mouseUp);
    }
  });

  def.method('clearMarkup', function(suppress) {
    if (suppress == null) { suppress = false; }
    this._arrows.each('remove');
    this._arrows.empty();
    jQuery('.square', this._element).removeClass('green yellow red');
    this._printDiagram = false;
    this.updatePrintDiagram();
    if (!suppress) { return this.trigger('markupChanged'); }
  });

  def.method('clearMarkupAtSquare', function(pos) {
    // Erase any arrows pointing at square
    let arrow;
    let square;
    while ((arrow = this._arrows.find(arrow => Board.positionsEqual(arrow.to, pos)))) {
      arrow.remove();
      this._arrows.remove(arrow);
    }

    // Clear square colors
    if (square = this.square(pos)) {
      return square.removeClass('red yellow green');
    }
  });

  def.method('clearPieces', function() {
    this._children.empty();
    return this._pieceViews = {};
  });

  def.method('findArrow', function(from, to) {
    const pe = Board.positionsEqual;
    return this._arrows.find(arrow => (pe(from, arrow.from) && pe(to, arrow.to)) || (pe(from, arrow.to) && pe(to, arrow.from)));
  });

  def.method('flip', function() {
    return this.flipped(!this.flipped());
  });

  def.method('flipPosition', position => ({x: 7 - position.x, y: 7 - position.y}));

  def.method('convertPosition', function(position) {
    if (this._flipped) {
      return this.flipPosition(position);
    } else {
      return position;
    }
  });

  def.method('getMarkupText', function() {
    let end;
    const markup = [];

    const colorCode = function(color) {
      switch (color) {
        case 'green': return '!';
        case 'yellow': return '';
        case 'red': return '?';
      }
    };

    // Scan and compress square hilights
    let color = false;
    let start = (end = false);

    const saveItem = () =>
      markup.push(start !== end ?
        Board.positionToText({x, y: end}) + '-' + String(8 - start) + colorCode(color)
      :
        Board.positionToText({x, y: start}) + colorCode(color)
      )
    ;

    for (var x = 0; x <= 7; x++) {
      const xs = this._flipped ? 7 - x : x;
      for (let y = 0; y <= 7; y++) {
        var result;
        const ys = this._flipped ? 7 - y : y;
        const square = this._squares[xs][ys];
        const sqclass = square.attr('class');
        const sqc = (result = sqclass.match(/(green|yellow|red)/)) ?
          result[1]
        :
          false;
        if (sqc !== color) {
          if (color) {
            end = y - 1;
            saveItem();
          }
          color = sqc;
          start = y;
        }
      }
      if (color) {
        end = 7;
        saveItem();
      }
      color = false;
    }

    // Add arrows
    this._arrows.each(arrow => {
      const from = this.convertPosition(arrow.from);
      const to   = this.convertPosition(arrow.to);
      return markup.push(Board.positionToText(from) + '->' + Board.positionToText(to) + colorCode(arrow.color));
    });

    if (this._printDiagram) { markup.push('DIAGRAM'); }

    return markup.join(',');
  });

  def.method('hilight', function(options) {
    if (options == null) { options = {}; }
    const element = jQuery('<div class="hilight" />');
    if (options.border) { element.css('border-color', options.border); }
    if (options.background) { element.css('background', options.background); }
    element.css({
      left:   this.positionToScreen(options.position.x),
      top:    this.positionToScreen(options.position.y),
      width:  this._squareSize - 5,
      height: this._squareSize - 5
    });
    this._squares[7][7].after(element);
    const hilight = {
      hide() {
        return element.fadeOut(300, () => element.remove());
      }
    };
    if (options.duration) { setTimeout(hilight.hide, options.duration); }
    return hilight;
  });

  // Manages rolling hilighting of hovered over squares for a touch
  def.method('hoverHilight', function(touch, color) {
    if (!touch.hover || !Board.positionsEqual(touch.hover, touch.at)) {
      if (touch.hoverHilight) { touch.hoverHilight.hide(); }
      touch.hover = touch.at;
      if (!Board.positionsEqual(touch.from, touch.hover) && Board.positionOnBoard(touch.hover)) {
        if (typeof color === 'function') { color = color(); }
        return touch.hoverHilight = this.hilight({position: touch.hover, border: color});
      }
    }
  });

  def.method('makeArrow', function(color) {
    const arrow = this.paper().path();
    arrow.color = color;
    arrow.attr({
      stroke: def.ARROW_BORDER[color],
      fill:   def.ARROW_FILL[color]
    });
    return arrow;
  });

  def.method('markupArrowEnd', function(touch) {
    let arrow;
    touch.to = this.screenToPosition(touch.point);

    if (Board.positionOnBoard(touch.to) && !Board.positionsEqual(touch.from, touch.to)) {
      if (arrow = this.findArrow(touch.from, touch.to)) {
        const different = !Board.positionsEqual(touch.from, arrow.from) || (touch.color !== arrow.color);
        this._arrows.remove(arrow);
        arrow.remove();
        if (different) {
          this.addArrow(touch);
        } else {
          touch.arrow.remove();
        }
      } else {
        this.addArrow(touch);
      }

      return this.trigger('markupChanged');
    } else if (touch.arrow) {
      return touch.arrow.remove();
    }
  });

  def.method('markupArrowMove', function(touch) {
    if (Board.positionsEqual(touch.from, touch.at)) {
      if (touch.arrow) {
        touch.arrow.remove();
        touch.arrow = null;
      }
    } else {
      const path = this.pathForArrow(
        this.positionToScreen(touch.from.x) + (this._squareSize / 2),
        this.positionToScreen(touch.from.y) + (this._squareSize / 2),
        touch.point.x,
        touch.point.y
      );

      // Display arrow
      if (!touch.arrow) { touch.arrow = this.makeArrow(touch.color); }
      touch.arrow.attr('path', path);
    }

    return this.hoverHilight(touch, def.ARROW_BORDER[touch.color]);
  });

  def.method('markupArrowStart', function(touch, color) {
    touch.kind = 'markupArrow';
    touch.color = color;
    touch.hilights = [this.hilight({position: touch.from, border: def.ARROW_BORDER[color]})];
    return true;
  });

  def.method('markupEraseMove', function(touch) {
    this.clearMarkupAtSquare(touch.at);
    return this.trigger('markupChanged');
  });

  def.method('markupEraseStart', function(touch) {
    touch.kind = 'markupErase';
    this.clearMarkupAtSquare(touch.from);
    this.trigger('markupChanged');
    return true;
  });

  def.method('markupSquareMove', function(touch) {
    let square;
    const pos = this.convertPosition(touch.at);

    if (square = this.square(pos)) {
      if (touch.color) {
        if (!square.is(`.${touch.color}`)) {
          square.removeClass('red yellow green').addClass(touch.color);
        }
      } else {
        square.removeClass('red yellow green');
      }
      return this.trigger('markupChanged');
    }
  });

  def.method('markupSquareStart', function(touch, color) {
    let square;
    touch.kind = 'markupSquare';
    const pos = this.convertPosition(touch.from);

    if (square = this.square(pos)) {
      if (square.is(`.${color}`)) {
        touch.color = null;
      } else {
        touch.color = color;
      }

      square.removeClass('red yellow green');
      if (touch.color) { square.addClass(touch.color); }
      this.trigger('markupChanged');
      return true;
    } else {
      return false;
    }
  });

  def.method('move', function(from, to, view) {
    let piece, validMove;
    if (!(piece = this._board.square(from))) { return; }

    if (this._presentationMode) {
      return this.trigger('moves', [new Move({board: this._board, special: 'illegal', from, to})], view);
    } else if ((piece.color !== this._board.turn) && this.recordIllegalMove()) {
      this.recordIllegalMove(false);
      const nullMove = new Move({board: this._board, special: 'null'});
      return this.trigger('moves', [
        nullMove,
        new Move({board: nullMove.then(), special: 'illegal', from, to})
      ], view);
    } else if (validMove = this._board.validMove(from, to)) {
      return this.trigger('moves', [validMove], view);
    } else if (this.recordIllegalMove()) {
      this.recordIllegalMove(false);
      return this.trigger('moves', [new Move({board: this._board, special: 'illegal', from, to})], view);
    } else {
      return view.updatePosition();
    }
  });

  def.method('moveEnd', function(touch) {
    if (touch.piece) {
      touch.view.moving(false);
      touch.to = {
        x: this.screenToNearestSquare(touch.point.x - touch.offset.x),
        y: this.screenToNearestSquare(touch.point.y - touch.offset.y)
      };
      if (Board.positionsEqual(touch.from, touch.to)) {
        return touch.view.updatePosition();
      } else {
        return this.move(touch.from, touch.to, touch.view);
      }
    }
  });

  def.method('moveMove', function(touch) {
    if (touch.piece) {
      touch.at = {
        x: this.screenToNearestSquare(touch.point.x - touch.offset.x),
        y: this.screenToNearestSquare(touch.point.y - touch.offset.y)
      };
      const view = this._pieceViews[touch.piece.id];
      view.element().css({
        left: touch.point.x - touch.offset.x,
        top:  touch.point.y - touch.offset.y
      });

      return this.hoverHilight(touch, () => {
        if (this._board.validMove(touch.from, touch.at)) {
          return def.LEGAL_COLOR;
        } else {
          return def.ILLEGAL_COLOR;
        }
      });
    }
  });

  def.method('moveStart', function(touch) {
    let piece;
    touch.kind = 'move';
    if (piece = this._board.square(touch.from)) {
      let reason;
      if (!this._presentationMode && (this._readOnly || (!this._recordIllegalMove && (piece.color !== this._board.turn)))) {
        touch.hilights = [this.hilight({position: touch.from, border: def.ILLEGAL_COLOR})];
      } else if (!this._presentationMode && (!this._recordIllegalMove && (reason = piece.stuck(this._board, touch.from)))) {
        touch.hilights = [this.hilight({position: touch.from, border: def.ILLEGAL_COLOR})];
        // Check if this piece can't be moved because king is in check
        if (reason !== 'blocked') {
          // Hilight king
          touch.hilights.push(this.hilight({
            position: this._board.kingPosition,
            border: def.ILLEGAL_COLOR,
            background: def.CHECKING_COLOR
          })
          );

          // Hilight checking pieces
          for (let checking of Array.from(reason)) {
            touch.hilights.push(this.hilight({
              position: checking,
              border: def.ILLEGAL_COLOR,
              background: def.CHECKING_COLOR
            })
            );
          }
        }
      } else {
        touch.piece = piece;
        touch.view = this._pieceViews[touch.piece.id];
        touch.offset = {
          x: touch.point.x - this.positionToScreen(touch.from.x),
          y: touch.point.y - this.positionToScreen(touch.from.y)
        };
        touch.hilights = [this.hilight({position: touch.from, border: def.LEGAL_COLOR})];
        touch.view.moving(true);
      }
      return true;
    } else {
      return false;
    }
  });

  def.method('paper', function() {
    if (!this._paper) {
      const div = document.createElement('div');
      this._element.append(jQuery(div).addClass('paper'));
      this._paper = Raphael(div, this._size, this._size);
    }
    return this._paper;
  });

  def.method('pathForArrow', function(x1, y1, x2, y2) {
    // Get direction and distance components of arrow
    const xo = x2 - x1;
    const yo = y2 - y1;
    const direction = Math.atan2(yo, xo);
    const distance = Math.sqrt((xo*xo) + (yo*yo));

    // Determine size of arrow
    let scaled = distance / this._size;
    if (scaled < 0) { scaled = 0; }
    if (scaled > 1) { scaled = 1; }
    const length = def.ARROW_HEAD_MIN_SIZE + ((def.ARROW_HEAD_MAX_SIZE - def.ARROW_HEAD_MIN_SIZE) * scaled);
    const width = length * def.ARROW_HEAD_WIDTH;
    const neckWidth = length * def.ARROW_NECK_WIDTH;

    // Find point specified distance from arrow head
    const hx = x2 - (Math.cos(direction) * length);
    const hy = y2 - (Math.sin(direction) * length);

    // Find points on either side of neck
    const ldirection = direction - (Math.PI / 2);
    const rdirection = direction + (Math.PI / 2);
    const leftNeck = `${hx + (Math.cos(ldirection) * neckWidth)},${hy + (Math.sin(ldirection) * neckWidth)}`;
    const rightNeck = `${hx + (Math.cos(rdirection) * neckWidth)},${hy + (Math.sin(rdirection) * neckWidth)}`;

    // Find corners
    const leftCorner = `${hx + (Math.cos(ldirection) * width)},${hy + (Math.sin(ldirection) * width)}`;
    const rightCorner = `${hx + (Math.cos(rdirection) * width)},${hy + (Math.sin(rdirection) * width)}`;

    // Build path
    return `M${x1},${y1}L${leftNeck}L${leftCorner}` +
      `L${x2},${y2}L${rightCorner}L${rightNeck}L${x1},${y1}`;
  });

  // Changes a square in the opening position
  def.method('positionSetup', function(pos, code) {
    const type = code.toLowerCase();
    pos = this.convertPosition(pos);
    const piece = this._board.square(pos);
    const newPiece = piece && (piece.code === code) ?
      // Square with same color and type piece changes to opposite color
      new Piece({
        type,
        color:  type === code ? 'w' : 'b',
        id:     Board.NextId++
      })
    : piece && (piece.type === type) ?
      // Square with same type but opposite color piece gets removed
      null
    :
      // Empty square or diffent type of piece gets a new piece
      new Piece({
        code,
        id:   Board.NextId++
      });
    this._board.changeSquare(pos, newPiece);
    this.updatePieces();
    return this.trigger('startingPositionChanged',  this._board.toFen());
  });

  def.method('positionSquares', function() {
    return [0, 1, 2, 3, 4, 5, 6, 7].map((x) =>
      [0, 1, 2, 3, 4, 5, 6, 7].map((y) =>
        this._squares[x][y].css({
          left:   x * this._squareSize,
          top:    y * this._squareSize,
          width:  this._squareSize - 1,
          height: this._squareSize - 1
        })));
  });

  // Screen point at top-left corner of square
  def.method('positionToScreen', function(x) {
    if (this._flipped) { x = 7 - x; }
    return x * this._squareSize;
  });

  def.method('render', function() {
    this.renderSquares();
    this.positionSquares();
    this.renderNotation();
    return this.updateNotation();
  });

  def.method('renderNotation', function() {
    let div, i;
    if (!this._rankNotationDivs) {
      this._rankNotationDivs = [];
      for (i = 0; i <= 7; i++) {
        div = this.helper().tag('div');
        div.addClass('rank-notation');
        this._rankNotationDivs.push(div);
        this._element.append(div);
      }
    }

    if (!this._fileNotationDivs) {
      this._fileNotationDivs = [];
      return (() => {
        const result = [];
        for (i = 0; i <= 7; i++) {
          div = this.helper().tag('div');
          div.addClass('file-notation');
          this._fileNotationDivs.push(div);
          result.push(this._element.append(div));
        }
        return result;
      })();
    }
  });

  def.method('renderSquares', function() {
    this._squares = [];
    return (() => {
      const result = [];
      for (let x = 0; x <= 7; x++) {
        const column = [];
        for (let y = 0; y <= 7; y++) {
          const div = jQuery('<div class="square" />');
          if (((x + y) % 2) === 0) {
            div.addClass('white');
          } else {
            div.addClass('black');
          }
          if (x === 0) { div.addClass('left-edge'); }
          if (x === 7) { div.addClass('right-edge'); }
          if (y === 0) { div.addClass('top-edge'); }
          if (y === 7) { div.addClass('bottom-edge'); }
          this._element.append(div);
          column.push(div);
        }
        result.push(this._squares.push(column));
      }
      return result;
    })();
  });

  // Finds square number that screen point lies within
  def.method('screenToPosition', function(x) {
    if (x.x && x.y) {
      return {x: this.screenToPosition(x.x), y: this.screenToPosition(x.y)};
    } else {
      x = Math.floor(x / this._squareSize);
      if (this._flipped) { return 7 - x; } else { return x; }
    }
  });

  // Finds square number that screen point is closest to
  def.method('screenToNearestSquare', function(x) {
    x = Math.round(x / this._squareSize);
    if (this._flipped) { return 7 - x; } else { return x; }
  });

  def.method('setFileNotation', function(value) {
    this._fileNotation = value;
    return this.updateNotation();
  });

  def.method('setMarkupText', function(value) {
    this.clearMarkup(true);

    const colorFromCode = function(code) {
      if (code === '!') {
        return 'green';
      } else if (code === '?') {
        return 'red';
      } else {
        return 'yellow';
      }
    };

    const markup = value.split(',');
    return (() => {
      const result1 = [];
      for (let item of Array.from(markup)) {
        var from, result, to;
        if (result = item.match(/^\s*([a-h][1-8])([\?!]?)\s*$/)) {
          const pos = this.convertPosition(Board.textToPosition(result[1]));
          result1.push(this.square(pos).addClass(colorFromCode(result[2])));
        } else if (result = item.match(/^\s*([a-h][1-8])-([1-8])([\?!]?)\s*$/)) {
          from = this.convertPosition(Board.textToPosition(result[1]));
          to   = this.convertPosition(Board.textToPosition(result[2], false));
          if (from.y > to.y) {
            const a = from.y;
            from.y = to.y;
            to.y = a;
          }
          result1.push((() => {
            const result2 = [];
            for (let { y } = from, end = to.y, asc = from.y <= end; asc ? y <= end : y >= end; asc ? y++ : y--) {
              result2.push(this.square({x: from.x, y}).addClass(colorFromCode(result[3])));
            }
            return result2;
          })());
        } else if (result = item.match(/^\s*([a-h][1-8])->([a-h][1-8])([\?!]?)\s*$/)) {
          result1.push(this.addArrow({
            arrow: this.makeArrow(colorFromCode(result[3])),
            from:  Board.textToPosition(result[1]),
            to:    Board.textToPosition(result[2])
          }));
        } else if (item === 'DIAGRAM') {
          this._printDiagram = true;
          result1.push(this.updatePrintDiagram());
        } else {
          result1.push(undefined);
        }
      }
      return result1;
    })();
  });

  def.method('setRankNotation', function(value) {
    this._rankNotation = value;
    return this.updateNotation();
  });

  def.method('setSize', function(size) {
    this._squareSize = Math.floor((size - 1) / 8);
    this._size = this._squareSize * 8;
    this._element.css({
      width:  this._size - 1,
      height: this._size - 1
    });
    if (this._squares) { this.positionSquares(); }
    this.updatePieceSizes();
    return this.updateNotation();
  });

  def.method('square', function(point) {
    return Board.positionOnBoard(point) && this._squares[point.x][point.y];
  });

  def.method('togglePrintDiagram', function() {
    this._printDiagram = !this._printDiagram;
    this.updatePrintDiagram();
    return this.trigger('markupChanged');
  });

  def.method('touchStart', function(id, point) {
    const touch = {point, from: this.screenToPosition(point)};

    const result = (() => { switch (this._mode) {
      case def.MODE_MOVE:
        return this.moveStart(touch);
      case def.MODE_MARKUP_SQUARE_GREEN:
        return this.markupSquareStart(touch, 'green');
      case def.MODE_MARKUP_SQUARE_YELLOW:
        return this.markupSquareStart(touch, 'yellow');
      case def.MODE_MARKUP_SQUARE_RED:
        return this.markupSquareStart(touch, 'red');
      case def.MODE_MARKUP_ARROW_GREEN:
        return this.markupArrowStart(touch, 'green');
      case def.MODE_MARKUP_ARROW_YELLOW:
        return this.markupArrowStart(touch, 'yellow');
      case def.MODE_MARKUP_ARROW_RED:
        return this.markupArrowStart(touch, 'red');
      case def.MODE_MARKUP_ERASE:
        return this.markupEraseStart(touch);
      case def.MODE_POSITION_SETUP:
        this.positionSetup(touch.from, this._setupPiece);
        return true;
      case def.MODE_SELECT:
        this.trigger('select', touch.from);
        return true;
    } })();

    if (result) { this._touches[id] = touch; }
    return result;
  });

  def.method('touchMove', function(id, point) {
    let touch;
    if (touch = this._touches[id]) {
      touch.point = point;
      touch.at = this.screenToPosition(point);

      switch (touch.kind) {
        case 'move':
          this.moveMove(touch);
          break;
        case 'markupSquare':
          this.markupSquareMove(touch);
          break;
        case 'markupArrow':
          this.markupArrowMove(touch);
          break;
        case 'markupErase':
          this.markupEraseMove(touch);
          break;
      }
      return true;
    } else {
      return false;
    }
  });

  def.method('touchEnd', function(id, point) {
    let touch;
    if (touch = this._touches[id]) {
      touch.point = point;

      if (touch.hoverHilight) {
        touch.hoverHilight.hide();
      }
      if (touch.hilights) {
        for (let hilight of Array.from(touch.hilights)) {
          hilight.hide();
        }
      }

      switch (touch.kind) {
        case 'move':
          this.moveEnd(touch);
          break;
        case 'markupArrow':
          this.markupArrowEnd(touch);
          break;
      }

      delete this._touches[id];
      return true;
    } else {
      return false;
    }
  });

  def.method('touchCancel', function(id, point) {
    let touch;
    if (touch = this._touches[id]) {
      if (touch.hilights) {
        for (let hilight of Array.from(touch.hilights)) {
          hilight.hide();
        }
      }
      if (touch.hoverHilight) { touch.hoverHilight.hide(); }

      if (touch.piece) {
        touch.view.moving(false);
        touch.view.updatePosition();
      }

      delete this._touches[id];
    }

    return !!(touch && touch.piece);
  });

  // Translates event pageX/pageY to "screen" coordinates, accounting for
  // board element offset
  def.method('translatePoint', function(event) {
    const offset = this._element.offset();
    const point = {
      x: event.pageX - offset.left,
      y: event.pageY - offset.top
    };
    return point;
  });

  def.method('updateNotation', function() {
    let i, position;
    if (this._rankNotationDivs) {
      for (i = 0; i <= 7; i++) {
        let rank = this._flipped ? i + 1 : 8 - i;
        if (this._notations === 'none') { rank = ''; }
        position = Math.floor((i + 0.5) * this._squareSize);
        if (this._rankNotation === 'inside') { position += Math.round(this._squareSize / 2) - 8; }
        this._rankNotationDivs[i].text(rank).css({
          left:
            this._rankNotation === 'right' ?
              this._size + 5
            : this._rankNotation === 'inside' ?
              2
            :
              -10,
          top:  position
        });
      }
    }

    if (this._fileNotationDivs) {
      return (() => {
        const result = [];
        for (i = 0; i <= 7; i++) {
          const n = this._flipped ? 7 - i : i;
          let file = String.fromCharCode('a'.charCodeAt(0) + n);
          if (this._fileNotation === 'none') { file = ''; }
          position = Math.floor((i + 0.5) * this._squareSize);
          if (this._fileNotation === 'inside') { position += Math.round(this._squareSize / 2) - 5; }
          result.push(this._fileNotationDivs[i].text(file).css({
            left: position,
            top:
              this._fileNotation === 'inside' ?
                -4
              :
                -18
          }));
        }
        return result;
      })();
    }
  });

  // Updates position and taken status for each piece from board
  def.method('updatePieces', function(animate) {
    let view;
    if (animate == null) { animate = 0; }
    const views = jQuery.extend({}, this._pieceViews);
    // Update pieces from board
    for (let x = 0; x <= 7; x++) {
      for (let y = 0; y <= 7; y++) {
        var piece;
        if (piece = this._board.squares[x][y]) {
          var position;
          if (view = views[piece.id]) {
            position = view.position();
            if (view.taken()) {
              view.taken(false);
              view.position({x, y});
              view.updatePosition();
              view.updateTaken(animate);
            } else if ((position.x !== x) || (position.y !== y)) {
              view.position({x, y});
              view.updatePosition(animate);
            }
            delete views[piece.id];
          } else {
            view = PieceView.create({
              piece,
              position: {x, y},
              taken:    !!animate,
              size:     this._squareSize,
              flipped:  this._flipped
            });
            this.addChild(view);
            this._pieceViews[piece.id] = view;
            view.release();
            if (animate) {
              view.taken(false);
              view.updateTaken(animate);
            }
          }
        }
      }
    }

    // Display missing pieces as taken
    return (() => {
      const result = [];
      for (let id in views) {
        view = views[id];
        if (!view.taken()) {
          view.taken(true);
          result.push(view.updateTaken(animate));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  });

  def.method('updatePieceSizes', function() {
    return (() => {
      const result = [];
      for (let id in this._pieceViews) {
        const view = this._pieceViews[id];
        result.push(view.size(this._squareSize));
      }
      return result;
    })();
  });

  def.method('updatePrintDiagram', function() {
    const found = jQuery('.print-diagram', this._element);
    if (this._printDiagram) {
      if (!found.length) {
        return this._element.append('<div class="print-diagram"><i class="icon-print-diagram"></i></div>');
      }
    } else {
      return found.remove();
    }
  });

  def.method('_modeChanged', function(oldValue, newValue) {
    return this.trigger('modeChanged', newValue);
  });

  def.method('_recordIllegalMoveChanged', function() {
    if (this._recordIllegalMove) {
      return this._element.addClass('illegal');
    } else {
      return this._element.removeClass('illegal');
    }
  });
});
