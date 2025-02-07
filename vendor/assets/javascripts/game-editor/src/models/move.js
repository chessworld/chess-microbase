import { Board } from './board'
import { Piece } from './piece'

export class Move {
  static NAG_HTML = {
    1: '!',           2: '?',           3: '!!',          4: '??',
    5: '!?',          6: '?!',          10: '&#61;',      13: '&infin;',
    14: '&#10866;',   15: '&#10865;',   16: '&plusmn;',   17: '&#8723;',
    18: '+-',         19: '-+',         22: '&#10752;',   23: '&#10752;',
    32: '&#10227;',   33: '&#10227;',   36: '&#8594;',    37: '&#8594;',
    40: '&#8593;',    41: '&#8593;',    132: '&#8646;',   133: '&#8646;',
    140: '&#8710;',   142: '&#8979;',   145: 'RR',        146: 'N',
    239: '&harr;',    240: '&#8663;',   242: '&#10219;',  243: '&#10218;',
    244: '&times;',   245: '&perp;'
  };
  
  static NAG_NAMES = {
    1:    'Good move',
    2:    'Poor move or mistake',
    3:    'Very good or brilliant move',
    4:    'Very poor move or blunder',
    5:    'Speculative or interesting move',
    6:    'Questionable or dubious move',
    10:   'Drawish position or even',
    13:   'Unclear position',
    14:   'White has a slight advantage',
    15:   'Black has a slight advantage',
    16:   'White has a moderate advantage',
    17:   'Black has a moderate advantage',
    18:   'White has a decisive advantage',
    19:   'Black has a decisive advantage',
    22:   'White is in zugzwang',
    23:   'Black is in zugzwang',
    32:   'White has a moderate time (development) advantage',
    33:   'Black has a moderate time (development) advantage',
    36:   'White has the initiative',
    37:   'Black has the initiative',
    40:   'White has the attack',
    41:   'Black has the attack',
    132:  'White has moderate counterplay',
    133:  'Black has moderate counterplay',
    140:  'With the idea...',
    142:  'Better is...',
    145:  'Editorial comment',
    146:  'Novelty',
    239:  'File',
    240:  'Diagonal',
    242:  'King-side',
    243:  'Queen-side',
    244:  'Weak point',
    245:  'Ending'
  };
  
  constructor(data) {
    if (data == null) { data = {}; }
    this.board = data.board;
    
    if (data['short']) {
      this.fromShort(data['short']);
    } else {
      this.from       = data.from;
      this.to         = data.to;
      this.takes      = data.takes;
      this.special    = data.special;
      this.promotion  = data.promotion;
      this.annotation = data.annotation;
    }
  }
  
  annotationClass() {
    switch (this.annotation) {
      case 1: case 3: case 5: return 'good';
      case 2: case 4: case 6: return 'bad';
      default: return '';
    }
  }
  
  convertAnnotation(mode) {
    if (!this.annotation || !mode) {
      return '';
    } else if ((mode === 'HTML') || ((this.annotation <= 6) && (mode !== 'NAG'))) {
      return Move.NAG_HTML[this.annotation] || '';
    } else {
      return ` $${this.annotation}`;
    }
  }
  
  dup(options) {
    if (options == null) { options = {}; }
    return new Move($.extend({
      board:      this.board,
      from:       this.from,
      to:         this.to,
      takes:      this.takes,
      special:    this.special,
      promotion:  this.promotion,
      annotation: this.annotation
    }, options));
  }
  
  eq(other) {
    if ((this.special === 'null') || (other.special === 'null')) {
      return this.special === other.special;
    } else {
      return (this.from.x === other.from.x) &&
      (this.from.y === other.from.y) &&
      (this.to.x === other.to.x) &&
      (this.to.y === other.to.y) &&
      (this.special === other.special) &&
      (this.promotion === other.promotion);
    }
  }
  
  fromShort(san) {
    let a, found;
    const promotesTo = null;
    
    // Extract annotation
    if (found = san.match(/[!\?]+$/)) {
      this.annotation = (() => { switch (found[0]) {
        case '!': return 1;
        case '?': return 2;
        case '!!': return 3;
        case '??': return 4;
        case '!?': return 5;
        case '?!': return 6;
      } })();
    }
    
    // Strip unimportant characters
    san = san.replace(/[\+#=!\?]/g, '');
    san = san.replace(/0/, 'O');
  
    if (san === 'O-O-O') {
      // Queenside castle
      this.from = this.board.kingPosition;
      this.to = {x: 2, y: this.board.kingPosition.y};
      return this.special = 'queenside';
    } else if (san === 'O-O') {
      // Kingside castle
      this.piece = this.board.king;
      this.from = this.board.kingPosition;
      this.to = {x: 6, y: this.board.kingPosition.y};
      return this.special = 'kingside';
    } else if (san === '--') {
      // Null move
      return this.special = 'null';
    } else if (a = san.match(/^([RNBKQ]?)([a-h]?[1-8]?)x?([a-h][1-8])([RNBQ]?)$/)) {
      // Match piece type
      let type;
      if (a[1] === '') {
        type = 'p';
      } else {
        type = a[1].toLowerCase();
      }
      
      // Load available start and end position information
      this.from = Board.textToPosition(a[2], false);
      this.to = Board.textToPosition(a[3]);
      
      // Look for valid moves that match given information
      found = false;
      let piece = null;
      for (let point of Array.from(this.board.piecesCanSafelyMoveTo(this.to, this.board.turn))) {
        var move;
        piece = this.board.square(point);
        if (piece.type !== type) { continue; }
        if ((this.from.x >= 0) && (point.x !== this.from.x)) { continue; }
        if ((this.from.y >= 0) && (point.y !== this.from.y)) { continue; }
        if (move = piece.findMove(this.board, point, this.to)) {
          found = true;
          this.from = move.from;
          this.to = move.to;
          this.takes = move.takes;
          this.special = move.special;
          break;
        }
      }
      
      if (found) {
        // Check for pawn promotion        
        if (piece.type === 'p') {
          const promoRank = piece.color === 'w' ? 0 : 7;
          if (this.to.y === promoRank) {
            this.special = 'promotion';
            return this.promotion = (a[4] || 'q').toLowerCase();
          }
        }
      } else {
        this.from = (this.to = (this.takes = null));
        return this.special = 'null';
      }
    
    } else if (a = san.match(/^~[PRNBKQ]?([a-h][1-8])[x-]?([a-h][1-8])[RNBQ]?$/)) {
      // Illegal move
      this.from = Board.textToPosition(a[1]);
      this.to = Board.textToPosition(a[2]);
      if (this.board.square(this.to)) { this.takes = this.to; }
      return this.special = 'illegal';
    } else {
      return this.special = 'null';
    }
  }

  movingPieceColor() {
    if (this.from) {
      const piece = this.board.square(this.from);
      return piece && piece.color;
    }
  }
  
  // Returns board after move
  then(sameturn) {
    // Look for cached normal after board
    let piece;
    if (sameturn == null) { sameturn = false; }
    if (this.after && !sameturn) { return this.after; }
    
    const workboard = this.board.dup();
    if (!sameturn) { workboard.changeTurn(); }      
    
    // Move piece
    if (this.from && this.to) {
      piece = workboard.square(this.from);
      if (this.special === 'promotion') {
        workboard.square(this.to, new Piece({
          type:   this.promotion,
          color:  piece.color,
          id:     Board.NextId++
        })
        );
      } else {
        workboard.square(this.to, piece);
      }
      workboard.square(this.from, null);
    }
    
    // Handle side effects from special moves
    switch (this.special) {
      case 'kingside':
        // Move rook
        workboard.squares[5][this.to.y] = workboard.squares[7][this.to.y];
        workboard.squares[7][this.to.y] = null;
        break;
      case 'queenside':
        // Move rook
        workboard.squares[3][this.to.y] = workboard.squares[0][this.to.y];
        workboard.squares[0][this.to.y] = null;
        break;
      case 'enpassant':
        // Remove captured pawn
        workboard.square(this.takes, null);
        break;
    }
    
    if (piece && (piece.type === 'k') && (piece.color === workboard.turn)) {
      workboard.king = piece;
      workboard.kingPosition = this.to;
    }
    
    // Disable castling if king or rook moved
    if (piece) {
      if (piece.color === 'w') {
        if (piece.type === 'k') {
          workboard.castling = workboard.castling.replace(/[KQ]/g, '');
        } else if (piece.type === 'r') {
          if (this.from.x === 7) { workboard.castling = workboard.castling.replace('K'); }
          if (this.from.x === 0) { workboard.castling = workboard.castling.replace('Q'); }
        }
      } else {
        if (piece.type === 'k') {
          workboard.castling = workboard.castling.replace(/[kq]/g, '');
        } else if (piece.type === 'r') {
          if (this.from.x === 7) { workboard.castling = workboard.castling.replace('k'); }
          if (this.from.x === 0) { workboard.castling = workboard.castling.replace('q'); }
        }
      }
    }
    
    // Disable castling if rook captured
    if (this.to) {
      if ((this.to.x === 7) && (this.to.y === 7)) { workboard.castling = workboard.castling.replace('K'); }
      if ((this.to.x === 0) && (this.to.y === 7)) { workboard.castling = workboard.castling.replace('Q'); }
      if ((this.to.x === 7) && (this.to.y === 0)) { workboard.castling = workboard.castling.replace('j'); }
      if ((this.to.x === 0) && (this.to.y === 0)) { workboard.castling = workboard.castling.replace('q'); }
    }
    
    // Set enpassant target if move is a double pawn move
    if (piece) {
      workboard.enpassant = (piece.type === 'p') && (this.from.y === 1) && (this.to.y === 3) ?
        {x: this.from.x, y: 2}
      : (piece.type === 'p') && (this.from.y === 6) && (this.to.y === 4) ?
        {x: this.from.x, y: 5}
      :
        null;
    }
    
    // Store cached copy of normal after board
    if (!sameturn) { this.after = workboard; }
    return workboard;
  }
  
  specialNotation() {
    switch (this.special) {
      case 'kingside': return 'O-O';
      case 'queenside': return 'O-O-O';
      case 'null': return '--';
      default: return null;
    }
  }
  
  // Renders move as Short Algebraic Notation
  toShort(options) {
    if (options == null) { options = {}; }
    let notation = (() => {
      let special;
      if (special = this.specialNotation()) {
      return special;
    } else if (this.special === 'illegal') {
      return `~${Board.positionToText(this.from)}` +
        (this.takes ? 'x' : '-') + Board.positionToText(this.to);
    } else {
      let piece = this.board.square(this.from);
      
      let s = '';
      if (piece.type === 'p') {
        if (this.from.x !== this.to.x) { s += String('abcdefgh').charAt(this.from.x); }
      } else {
        s += piece.type.toUpperCase();
        
        // Check for ambiguity
        const pieces = this.board.piecesCanSafelyMoveTo(this.to, piece.color, piece.type);
        if (pieces.length > 1) {
          // Work out which axis are ambiguous
          const ambiguous = {x: false, y: false};
          for (piece of Array.from(pieces)) {
            if ((piece.y === this.from.y) && (piece.x !== this.from.x)) { ambiguous.x = true; }
            if ((piece.x === this.from.x) && (piece.y !== this.from.y)) { ambiguous.y = true; }
          }
        
          if (ambiguous.x && ambiguous.y) {
            s += Board.positionToText(this.from);
          } else if (ambiguous.y) {
            s += String(8 - this.from.y);
          } else {
            s += String('abcdefgh').charAt(this.from.x);
          }
        }
      }
      
      // Add takes
      if (this.takes) { s += 'x'; }
      
      // Add @to coordinates
      s += Board.positionToText(this.to);
      
      // Add pawn promotion
      if (this.promotion) { s += `=${this.promotion.toUpperCase()}`; }
      
      return s;
    }
    })();
    
    // Add check or checkmate
    if (this.then().check()) {
      if (this.then().checkMate()) {
        notation += '#';
      } else {
        notation += '+';
      }
    }
    
    return notation + this.convertAnnotation(options.annotations);
  }
  
  // Renders move as Long Algebraic Notation
  toLong(options) {
    let special;
    if (options == null) { options = {}; }
    const notation = (special = this.specialNotation()) ?
      special
    :
      this.piece.code + Board.positionToText(this.from) +
      (this.takes ? 'x' : '-') +
      Board.positionToText(this.to);
    
    return notation + this.convertAnnotation(options.annotations);
  }
}
