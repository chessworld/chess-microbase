import { Board } from './board'
import { Move } from './move'

export class Piece {
  constructor(data) {
    if (data == null) { data = {}; }
    if (data.code) {
      this.code = data.code;
      this.type = data.code.toLowerCase();
      this.color = data.code.toLowerCase() === data.code ? 'b' : 'w';
    } else {
      this.type = data.type;
      this.color = data.color;
      this.code = data.color === 'w' ? this.type.toUpperCase() : this.type;
    }
    this.id = data.id;
  }
  
  // Finds all possible legal moves for this piece with the given board and
  // piece position, does not test if moves would be illegal due to putting
  // king into check (or failing to get out of check)
  moves(board, position) {
    const definitions = (() => { switch (this.type) {
      case 'p': // Pawn
        // Work out which direction is forward
        const direction = this.color === 'w' ? -1 : 1;
        
        // Allow double move if on starting rank
        const startingY = this.color === 'w' ? 6 : 1;
        const distance = position.y === startingY ? 2 : 1;
        
        return [
          {x: 0,  y: direction, move: true, distance},
          {x: -1, y: direction, capture: true, enpassant: true},
          {x: 1,  y: direction, capture: true, enpassant: true}
        ];
      case 'n': // Knight
        return Board.KnightMoves;
      case 'b': // Bishop
        return Board.DiagonalMoves;
      case 'r': // Rook
        return Board.OrthagonalMoves;
      case 'q': // Queen
        return Board.QueenMoves;
      case 'k': // King
        return Board.KingMoves;
    } })();
    
    return this.findMoves(board, position, definitions);
  }
  
  // Find possible moves for piece given move definitions
  findMoves(board, position, definitions) {
    const moves = [];
    for (var def of Array.from(definitions)) {
      if (def.castles) {
        const oppColor = this.color === 'w' ? 'b' : 'w';
        
        // Check conditions for queenside castle
        if (
          // Both King and Rook have never moved and rook not captured
          board.castling.match(this.color === 'w' ? 'Q' : 'q') &&
          // Intervening squares are empty
          !board.squares[1][position.y] &&
          !board.squares[2][position.y] &&
          !board.squares[3][position.y] &&
          // King is not in check
          !board.check() &&
          // No enemy pieces could capture king on intervening square
          !board.piecesCanMoveTo({x: 3, y: position.y}, oppColor).length
        ) {
          moves.push(new Move({
            board,
            from:     position,
            to:       {x: 2, y: position.y},
            special:  'queenside'
          })
          );
        }
        
        // Check conditions for kingside castle
        if (
          // Both King and Rook have never moved and rook not captured
          board.castling.match(this.color === 'w' ? 'K' : 'k') &&
          // Intervening squares are empty
          !board.squares[5][position.y] &&
          !board.squares[6][position.y] &&
          // King is not in check
          !board.check() &&
          // No enemy pieces could capture king on intervening square
          !board.piecesCanMoveTo({x: 5, y: position.y}, oppColor).length
        ) {
          moves.push(new Move({
            board,
            from:     position,
            to:       {x: 6, y: position.y},
            special:  'kingside'
          })
          );
        }
        
      } else {
        // Scan for legal moves in direction
        let distance = def.distance || 1;
        
        // Set initial scanning point at piece position
        var scan = Board.clonePosition(position);
        while (distance > 0) {
          // Move scanning point in defined direction
          scan.x += def.x;
          scan.y += def.y;
          
          // Check if scanning inside the board
          if (Board.positionOnBoard(scan)) {
            var data = {board, from: position};
            
            var found = board.square(scan);
            
            // Look for conditions of valid moves
            const valid = (() => {
              if (found && (found.color !== this.color) && !def.move) { // Capture
              // Record captured piece position
              data.takes = Board.clonePosition(scan);
              return true;
            } else if (!found && !def.capture) { // Normal move
              return true;
              // Enpassant capture
            } else if (def.enpassant && board.enpassant && Board.positionsEqual(scan, board.enpassant)) {
              // Record enpassant captured piece position
              data.takes = {x: scan.x, y: scan.y === 2 ? 3 : 4};
              data.special = 'enpassant';
              return true;
            } else {
              return false;
            }
            })();
              
            if (valid) {
              // Add valid move to list
              data.to = Board.clonePosition(scan);
              
              // Mark pawn promotion
              if (this.type === 'p') {
                const promotionRank = this.color === 'w' ? 0 : 7;
                if (scan.y === promotionRank) {
                  data.special = 'promotion';
                  data.promotion = 'q';
                }
              }
              
              moves.push(new Move(data));
            }
            // Stop scanning if invalid move or occupied square
            distance = valid && !found ? distance - 1 : 0;
          } else {
            // Stop scanning
            distance = 0;
          }
        }
      }
    }
    return moves;
  }
  
  findMove(board, from, to) {
    for (let move of Array.from(this.moves(board, from))) {
      if (Board.positionsEqual(move.to, to)) { return move; }
    }
  }
  
  // Tests if piece is unable to move
  stuck(board, position) {
    let result = 'blocked';
    for (let move of Array.from(this.moves(board, position))) {
      result = move.then(true).checkingPieces();
      if (!result.length) { return false; }
    }
    return result;
  }
};
