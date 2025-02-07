import { Piece } from './piece'

const DiagonalMoves = [
  {x: -1, y: -1, distance: 7}, {x: 1, y: -1, distance: 7},
  {x: -1, y:  1, distance: 7}, {x: 1, y:  1, distance: 7}
];
const OrthagonalMoves = [
  {x: -1, y: 0, distance: 7}, {x: 1, y: 0, distance: 7},
  {x: 0, y: -1, distance: 7}, {x: 0, y: 1, distance: 7}
];

export class Board {
  static NextId = 1;
  static KnightMoves = [
    {x: -2, y: 1}, {x: -2, y: -1}, {x: 2,  y: 1},  {x: 2, y: -1},
    {x: -1, y: 2}, {x: 1,  y: 2},  {x: -1, y: -2}, {x: 1, y: -2}
  ];
  static DiagonalMoves = DiagonalMoves
  static OrthagonalMoves = OrthagonalMoves
  static QueenMoves = [...DiagonalMoves, ...OrthagonalMoves]
  static KingMoves = [
    {x: -1, y: -1}, {x: 1, y: -1}, {x: -1, y:  1}, {x: 1, y:  1},
    {x: -1, y: 0},  {x: 1, y: 0},  {x: 0, y: -1},  {x: 0, y: 1},
    {castles: true}
  ];
  
  static STARTING_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  
  // Creates a new position object copying the given one
  static clonePosition(position) {
    return {x: position.x, y: position.y};
  }

  // Validates position on board as an enpassant target
  // If specified pawn position instead of target position, moves back one
  // square to find the relevant target position
  static enpassantPosition(position) {
    if ((position.y === 2) || (position.y === 3)) {
      return {x: position.x, y: 2};
    } else if ((position.y === 4) || (position.y === 5)) {
      return {x: position.x, y: 5};
    } else {
      return null;
    }
  }

  // Works out intervening squares between two squares in a line orthagonally
  // or diagonally 
  static interveningSquares(from, to) {
    const squares = [];

    // Calculate distance between from and to squares
    const xdist = to.x - from.x;
    const ydist = to.y - from.y;
    let travel = 0;

    // Middle squares exist only if from and to squares are at least 2 squares
    // apart 
    if ((xdist < -1) || (xdist > 1) || (ydist < -1) || (ydist > 1)) {
      // Work out direction to scan in
      const xo = xdist > 0 ? 1 : xdist < 0 ? -1 : 0;
      const yo = ydist > 0 ? 1 : ydist < 0 ? -1 : 0;
      
      // Set starting scan position to `from` point + offset
      const scan = {x: from.x + xo, y: from.y + yo};
      
      // Scan until we reach end point
      while (!this.positionsEqual(scan, to) && !(travel > 7)) {
        squares.push(this.clonePosition(scan));
        scan.x += xo;
        scan.y += yo;
        travel++;
      }

      if (travel > 7) {
        console.log(`Failed finding intervening squares between ${this.positionToText(from)} and ${this.positionToText(to)}!`);
      }
    }
    
    return squares;
  }
  
  static positionToText(point) {
    return String('abcdefgh').charAt(point.x) + String(8 - point.y);
  }

  // Is the given position inside the bounds of a chess board
  static positionOnBoard(position) {
    return (position.x >= 0) && (position.x <= 7) && (position.y >= 0) && (position.y <= 7);
  }
  
  // Are two given positions the same 
  static positionsEqual(a, b) {
    if (a && b) {
      return (a.x === b.x) && (a.y === b.y);
    } else {
      return a === b;
    }
  }
  
  static textToPosition(text, validate) {
    if (validate == null) { validate = true; }
    const square = {x: -1, y: -1};
    for (let letter of Array.from(text.split(''))) {
      if (letter.match(/[a-h]/)) {
        square.x = letter.charCodeAt(0) - String('a').charCodeAt(0);
      } else if (letter.match(/[A-H]/)) {
        square.x = letter.charCodeAt(0) - String('A').charCodeAt(0);
      } else if (letter.match(/[1-8]/)) {
        square.y = 8 - Number(letter);
      }
    }

    if (!validate || Board.positionOnBoard(square)) {
      return square;
    } else {
      return null;
    }
  }
  
  constructor(data) {
    let i;
    if (data == null) { data = {}; }
    if (data.board) {
      // Copy data from another board
      const s = data.board.squares;
      this.squares = (() => {
        const result = [];
        for (i = 0; i <= 7; i++) {
          result.push([s[i][0], s[i][1], s[i][2], s[i][3], s[i][4], s[i][5], s[i][6], s[i][7]]);
        }
        return result;
      })();
      this.castling = data.board.castling;
      this.enpassant = data.board.enpassant;
      this.turn = data.board.turn;
      this.king = data.board.king;
      this.kingPosition = data.board.kingPosition;
    } else {
      // Setup data for a new board
      this.squares = (() => {
        const result1 = [];
        for (i = 0; i <= 7; i++) {
          result1.push([null, null, null, null, null, null, null, null]);
        }
        return result1;
      })();
      this.castling = '';
      this.enpassant = null;
      this.turn = data.turn || 'w';
      this.loadFen(data.fen || Board.STARTING_POSITION);
    }
  }
  
  changeSquare(position, piece) {
    this.square(position, piece);
    return this.findKing();
  }

  changeTurn(turn=null) {
    this.turn = turn || (this.turn === 'w' ? 'b' : 'w');
    return this.findKing();
  }
  
  check() {
    return !!this.checkingPieces().length;
  }
  
  checkingPieces() {
    return this.piecesCanMoveTo(this.kingPosition, this.turn === 'w' ? 'b' : 'w');
  }
  
  checkMate() {
    if (!this.check()) { return false; }
    
    // Test if king can move out of check
    for (let move of Array.from(this.king.moves(this, this.kingPosition))) {
      if (!move.then(true).check()) { 
        // console.log 'Escape by king move'
        return false;
      }
    }
    
    const oppColor = this.king.color === 'w' ? 'b' : 'w';
    
    // Find piece(s) that are threatening king
    const threats = this.piecesCanMoveTo(this.kingPosition, oppColor);
    
    // Can escape checkmate by capture or block if only one piece threatening
    if (threats.length === 1) {
      const position = threats[0];
      const threat = this.square(position);
      
      // Safe if can capture checking piece
      if (this.piecesCanSafelyMoveTo(position, this.king.color, 'pnrbq').length) {
        // console.log 'Escape by capture'
        return false;
      }
      
      // See if a piece that moves multiple spaces can be blocked
      if (threat.type.match(/[rbq]/)) {
        // Find spaces we could move to in order to block checking piece
        const blockingSpaces = Board.interveningSquares(position, this.kingPosition);
        
        // Safe if we can block checking piece
        for (let space of Array.from(blockingSpaces)) {
          const blockers = this.piecesCanSafelyMoveTo(space, this.king.color, 'pnrbq');
          if (blockers.length) {
            // console.log "Escape by block from #{Board.positionToText blockers[0]}"
            return false;
          }
        }
      }
      
      // Checkmate if unable to stop threat
      return true;
    } else if (threats.length > 1) {
      // console.log 'Mate by double check'
      return true;
    }
  }
  
  // Creates a new board object with the same position
  dup() {
    return new Board({board: this});
  }
  
  // Finds position of the active king
  findKing() {
    for (let x = 0; x <= 7; x++) {
      for (let y = 0; y <= 7; y++) {
        if (this.squares[x][y] && (this.squares[x][y].type === 'k') && (this.squares[x][y].color === this.turn)) {
          this.king = this.squares[x][y];
          this.kingPosition = {x, y};
          return;
        }
      }
    }
  }
  
  loadFen(fen) {
    let pieceId, section, y;
    const enpassant = null;

    // Remove excess whitespace
    fen = fen.replace(/\s+/g, ' ');
    fen = fen.replace(/(^\s+)|(\s+$)/g, '');
    
    const kings = {};
    const kingPositions = {};
    
    // Parse FEN data
    let x = (y = (section = (pieceId = 0)));
    let word = '';
    for (let letter of Array.from(fen.split(''))) {
      if (letter === ' ') {
        if (section === 3) { this.enpassant = Board.textToPosition(word); }
        // @clock = Number(word) if section is 4
        section++;
        word = '';
      } else if (section === 0) {    
        if (letter === '/') {
          x = 0;
          y++;
        } else if (letter.match(/\d/)) {
          x += Number(letter);
        } else if (letter.match(/[PRNBQKprnbqk]/)) {
          const piece = (this.squares[x][y] = new Piece({code: letter, id: Board.NextId++}));
          if (piece.type === 'k') {
            kings[piece.color] = piece;
            kingPositions[piece.color] = {x, y};
          }
          x++;
        }
      } else if (section === 1) {
        if (letter.match(/[wb]/)) { this.turn = letter; }
      } else if (section === 2) {
        if (letter.match(/[KQkq]/)) { this.castling += letter; }
      } else {
        word += letter;
      }
    }
    
    // Store position of current king
    this.king = kings[this.turn];
    return this.kingPosition = kingPositions[this.turn];
  }
    
    // @move = Number(word) if section is 5
  
  piecesCanMoveTo(position, color, types) {
    if (types == null) { types = 'pnrbqk'; }
    const pieces = [];

    if (position) {
      for (let type of Array.from(types)) {
        switch (type) {
          case 'p': // Check for pawns
            const occupied = this.square(position);
            const enpassant = (this.enpassant && Board.positionsEqual(this.enpassant, position));
            if (color === 'b') {
              if (occupied || enpassant) {
                this.scanForPieces(pieces, position, 'b', 'p', [{x: -1, y: -1}, {x: 1, y: -1}]);
              }
              if (!occupied) {
                this.scanForPieces(pieces, position, 'b', 'p', [{x: 0, y: -1, distance: position.y === 3 ? 2 : 1}]);
              }
            } else if (color === 'w') {
              if (occupied || enpassant) {
                this.scanForPieces(pieces, position, 'w', 'p', [{x: -1, y: 1}, {x: 1, y: 1}]);
              }
              if (!occupied) {
                this.scanForPieces(pieces, position, 'w', 'p', [{x: 0, y: 1, distance: position.y === 4 ? 2 : 1}]);
              }
            }
            break;
          case 'n': // Check for knights
            this.scanForPieces(pieces, position, color, 'n', Board.KnightMoves);
            break;
          case 'r': // Check for rooks
            this.scanForPieces(pieces, position, color, 'r', Board.OrthagonalMoves);
            break;
          case 'b': // Check for bishops
            this.scanForPieces(pieces, position, color, 'b', Board.DiagonalMoves);
            break;
          case 'q': // Check for queens
            this.scanForPieces(pieces, position, color, 'q', Board.QueenMoves);
            break;
          case 'k': // Check for king
            this.scanForPieces(pieces, position, color, 'k', Board.KingMoves);
            break;
        }
      }
    }
    
    return pieces;
  }
    
  piecesCanSafelyMoveTo(position, color, types) {
    if (types == null) { types = 'pnrbqk'; }
    const pieces = this.piecesCanMoveTo(position, color, types);
    const safe = [];
    for (let piece of Array.from(pieces)) {
      if (this.validMove(piece, position)) { safe.push(piece); }
    }
    return safe;
  }
  
  // Scans for any pieces of given color and type using move definitions
  scanForPieces(pieces, position, color, type, definitions) {
    return (() => {
      const result = [];
      for (var def of Array.from(definitions)) {
      // Scan for pieces in direction
        var distance = def.distance || 1;

        // Set initial scanning point at piece position
        var scan = Board.clonePosition(position);
        result.push((() => {
          const result1 = [];
          while (distance > 0) {
          // Move scanning point in defined direction
            scan.x += def.x;
            scan.y += def.y;

            // Check if scanning inside the board
            if (Board.positionOnBoard(scan)) {
              const found = this.square(scan);
              if (found && (found.color === color) && (found.type === type)) {
                pieces.push(Board.clonePosition(scan));
              }
          
              // Stop scanning if square occupied
              result1.push(distance = found ? 0 : distance - 1);
            } else {
              // Stop scanning
              result1.push(distance = 0);
            }
          }
          return result1;
        })());
      }
      return result;
    })();
  }
    
  // Gets or sets square at given position
  square(position, value) {
    if (value !== undefined) {
      if (this.squares && this.squares[position.x]) { return this.squares[position.x][position.y] = value; }
    } else {
      return this.squares && this.squares[position.x] && this.squares[position.x][position.y];
    }
  }
  
  toFenPosition() {
    let s = '';
    let c = 0;
    for (let y = 0; y <= 7; y++) {
      if (y !== 0) { s += '/'; }
      for (let x = 0; x <= 7; x++) {
        var piece;
        if (piece = this.squares[x][y]) {
          if (c > 0) {
            s += c;
            c = 0;
          }
          s += piece.code;
        } else {
          c++;
        }
      }
      if (c > 0) {
        s += c;
        c = 0;
      }
    }
    return s;
  }

  toFen(options) {
    if (options == null) { options = {}; }
    let s = this.toFenPosition();
    const castling = this.castling === '' ? '-' : this.castling;
    const enpassant = this.enpassant ?
      Board.positionToText(this.enpassant)
    :
      '-';
    return s += ` ${this.turn} ${castling} ${enpassant} ${options.clock || 0} ${options.ply || 0}`;
  }

  validMove(from, to) {
    let piece;
    if (piece = this.square(from)) {
      let move;
      if (move = piece.findMove(this, from, to)) {
        if (!move.then(true).check()) { return move; }
      }
    }
  }
}
