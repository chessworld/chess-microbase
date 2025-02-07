import jQuery from 'jquery'
import { Core, View, Util } from 'seaturtle'

import { BoardView } from './board-view'
import { makePieceElement } from '../util/make-piece-element'

export const PositionSetupView = Core.makeClass('PositionSetupView', View.BaseView, (def) => {
  def.PIECE_SIZE = 37;
  def.ICON_SIZE = 14;

  def.accessor('board');       // Direct access to starting board of @_game
  def.property('boardView');
  def.property('game');

  def.initializer(function(options) {
    if (options == null) { options = {}; }
    this.super();

    this._boardView = options.boardView;
    this._game = options.game;

    // Store DOM elements for each control
    this._castling  = {};
    this._enpassant = null;
    this._pieces    = {};
    return this._turn    = {};});

  def.method('getBoard', function() {
    return this._game.start.endBoard;
  });

  // Loads all configurable options from game into controls
  def.method('loadAll', function() {
    this.loadEnpassant();
    this.loadCastling();
    return this.loadTurn();
  });

  // Loads allowed castling from game into control
  def.method('loadCastling', function() {
    for (var code in this._castling) {
      const box = this._castling[code];
      box.attr('checked', false);
    }
    return (() => {
      const result = [];
      for (code of Array.from(this.board().castling)) {
        result.push(this._castling[code].attr('checked', true));
      }
      return result;
    })();
  });

  // Loads en passant target from game into control
  def.method('loadEnpassant', function() {
    return this._enpassant.val(this.board().enpassant ?
      Board.positionToText(this.board().enpassant)
    :
      ''
    );
  });

  // Loads turn from game into control
  def.method('loadTurn', function() {
    if (this.board().turn === 'b') {
      return this._turn.black.attr('checked', true);
    } else {
      return this._turn.white.attr('checked', true);
    }
  });
  
  // Makes input to allow or disallow types of castling
  def.method('makeCastlingCheckbox', function(code) {
    // Work out type and color from code
    const type = code.toLowerCase();
    const color = type === code ? 'b' : 'w';

    // Make a checkbox for castling type
    const input = jQuery('<input type="checkbox">');
    input.change(this.method('saveCastling'));
    this._castling[code] = input;

    // Make a label with graphical description of castling type
    const box = jQuery(`<label class=\"${type === 'k' ? 'castling-king' : 'castling-queen'}\"></label>`);
    box.append(input, ' ');
    const king = this.makeIcon('k', color);
    const rook = this.makeIcon('r', color);
    if (type === 'k') {
      box.append(king, '<img src="/assets/game_editor/castle-kingside.png" alt="">', rook);
    } else {
      box.append(rook, '<img src="/assets/game_editor/castle-queenside.png" alt="">', king);
    }

    // Add explanatory title
    if (!Util.detectTouch()) {
      box.hovertitle(`Allow ${color === 'w' ? 'white' : 'black'} to castle ${type === 'k' ? 'kingside' : 'queenside'}`); 
    }

    return box;
  });

  // Makes input to set en passant target
  def.method('makeEnpassantBox', function() {
    let input;
    this._enpassant = (input = jQuery('<input type="text" />'));
    
    // Prevent keystrokes within box from being handled by game view
    input.keydown(e => e.stopPropagation());

    // Blur input when return pressed, and prevent from submiting when
    // within a form 
    input.keypress(function(e) {
      if (e.which === View.BaseView.VK_RETURN) {
        e.preventDefault();
        input.blur();
        return false;
      }
    });

    // Disable placing pieces when input focussed
    input.focus(() => {
      jQuery('a.selected', this._element).removeClass('selected');
      this._boardView.mode(BoardView.MODE_SELECT);
      return this._boardView.bind('select', this, 'selectEnpassant');
    });

    // Reenable placing pieces when input blurred
    input.blur(() => {
      this._pieces[this._boardView.setupPiece()].addClass('selected');
      this._boardView.mode(BoardView.MODE_POSITION_SETUP);
      return this._boardView.unbind('select', this);
    });

    input.change(this.method('saveEnpassant'));

    // Make container box with "add-on" label
    const box = jQuery(`<div class="epbox input-prepend"> \
<span class="add-on">e.p.</span></div`);
    box.append(input);
    if (!Util.detectTouch()) { box.hovertitle('Allow en passant capture at'); }

    // Make "add-on" behave more like a label
    jQuery('.add-on', box).click(() => input.focus());

    return box;
  });

  // Makes a small piece icon to use in castling checkboxes
  def.method('makeIcon', function(type, color) {
    const icon = this.helper().tag('span');
    makePieceElement(icon, type, color, def.ICON_SIZE);
    return icon;
  });

  // Makes button to switch between pieces to place
  def.method('makePieceSelector', function(code) {
    // Find type and color from code
    const type = code.toLowerCase();
    const color = type === code ? 'b' : 'w';

    // Make and return button with piece
    const a = this.helper().linkTag('', () => this.switchCode(code));
    this._pieces[code] = a;
    makePieceElement(a, type, color, def.PIECE_SIZE);
    return a;
  });

  // Makes button to reset board
  def.method('makeResetButton', function() {
    const button = jQuery('<div class="btn">Reset <b class="caret"></b></div>')
    util.makePopup(button, [
      ['Starting',  () => this.resetBoard(null)],
      ['Empty',     () => this.resetBoard('8/8/8/8/8/8/8/8 w - - 0 1')],
      '-',
      ['Paste FEN', () => {
        const fen = this.board().toFen();
        const newFen = prompt('Paste FEN', fen);
        if ((newFen != null) && (newFen !== fen)) { return this.resetBoard(newFen); }
      }
      ]
    ]);
    return button
  });

  // Makes control to switch turn to white or black
  def.method('makeTurnRadio', function(color) {
    // Make radio input
    const radio = jQuery('<input name="turn" type="radio">');
    radio.change(this.method('saveTurn'));
    this._turn[color] = radio;

    // Make and return surrounding label
    const box = jQuery(`<label class=\"to-move\"><img src=\"/assets/game_editor/${color}-to-move.png\" alt=\"${color[0].toUpperCase()}\"></label>`).prepend(radio, ' ');
    if (!Util.detectTouch()) { box.hovertitle(`${Util.ucFirst(color)} to move`); }
    return box;
  });

  def.method('render', function() {
    // Add piece selectors
    for (var code of Array.from('PRprNQnqBKbk')) {
      this._element.append(this.makePieceSelector(code));
    }

    // Add turn and castling controls
    for (code of Array.from('mqkMQK')) {
      this._element.append(code === 'M' ?
        this.makeTurnRadio('white')
      : code === 'm' ?
        this.makeTurnRadio('black')
      :
        this.makeCastlingCheckbox(code)
      );
    }

    // Add en passant box and reset button
    this._element.append(this.makeEnpassantBox(), this.makeResetButton());

    // Initialize control values
    this._pieces['P'].addClass('selected');
    return this.loadAll();
  });

  // Resets board to given FEN position
  def.method('resetBoard', function(fen) {
    const board = new Board({fen});
    this.board(board);
    this._boardView.board(board);
    this._boardView.updatePieces();
    this.triggerChanged();
    return this.loadAll();
  });
  
  // Saves castling options to game
  def.method('saveCastling', function() {
    // Make a string combining values of all allowed castling types
    let castling = '';
    for (let code in this._castling) {
      const box = this._castling[code];
      if (box.is(':checked')) { castling += code; }
    }

    // Check if castling options have changed
    if (castling !== this.board().castling) {
      // Save castling to board
      this.board().castling = castling;
      return this.triggerChanged();
    }
  });

  // Saves en passant target to game
  def.method('saveEnpassant', function() {
    // Get position from control
    let pos = Board.textToPosition(this._enpassant.val());

    // Get validated position
    const validated = pos && Board.enpassantPosition(pos);

    // Replace specified position with validated version if needed
    if (!Board.positionsEqual(pos, validated)) {
      pos = validated;
      this._enpassant.val(pos ? Board.positionToText(pos) : ''); 
    }

    // Check if position has changed
    if (!Board.positionsEqual(pos, this.board().enpassant)) {
      // Save position to board
      this.board().enpassant = pos;
      return this.triggerChanged();
    }
  });

  // Saves turn to move to game
  def.method('saveTurn', function() {
    // Get turn from controls
    const turn = this._turn.black.is(':checked') ? 'b' : 'w';

    // Check if turn value has changed
    if (this.board().turn !== turn) {
      // Save turn to board
      this.board().turn = turn;
      this.board().findKing();
      return this.triggerChanged();
    }
  });

  // Respond to board view selectEnpassant trigger
  def.method('selectEnpassant', function(boardView, pos) {
    this._enpassant.val(Board.positionToText(pos));
    return this._enpassant.change().blur();
  });

  def.method('setBoard', function(value) {
    return this._game.start.endBoard = value;
  });

  // Switches selected piece
  def.method('switchCode', function(value) {
    for (let code in this._pieces) {
      const a = this._pieces[code];
      a.toggleClass('selected', code === value);
    }
    return this._boardView.setupPiece(value);
  });

  // Force triggers board view to report that starting position has changed
  def.method('triggerChanged', function() {
    return this._boardView.trigger('startingPositionChanged', this.board().toFen({
      ply: this.board().turn === 'w' ? 0 : 1
    })
    );
  });
});
