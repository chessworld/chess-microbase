import { Piece } from './piece'
import { Board } from './board'

describe('Piece', function() {
  let piece

  describe('constructor', function() {  
    describe('with code', function() {
      beforeEach(function() {
        piece = new Piece({code: 'K'})
      })
    
      it('should set color', function() {
        expect(piece.color).toEqual('w')
      })
    
      it('should set type', function() {
        expect(piece.type).toEqual('k')
      })
    })
  
    describe('with color and type', function() {
      beforeEach(function() {
        piece = new Piece({color: 'w', type: 'k'})
      })
    
      it('should set code', function() {
        expect(piece.code).toEqual('K')
      })
    })
  })
  
  describe('#findMoves', function() {
    const checkMovesForPosition = (description, expectedMoves, square, fen=null) =>
      describe(`for ${description}`, function() {
        let board, position

        beforeEach(function() {
          board = new Board({fen})
          position = Board.textToPosition(square)
          piece = board.square(position)
        })
    
        it(`should find ${expectedMoves} moves`, function() {
          const moves = piece.moves(board, position)
          expect (moves.length).toEqual(expectedMoves)
        })
      })      
    
    
    checkMovesForPosition('a pawn on home row', 2, 'd2')
    checkMovesForPosition('a pawn not on home row', 1, 'd4', 'r1bqkbnr/pppppppp/2n5/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 1 2')    
    checkMovesForPosition('a pawn that can capture', 2, 'd4', 'rnbqkbnr/pp1ppppp/8/2p5/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2')
    checkMovesForPosition('a pawn that can enpassant capture', 2, 'd5', 'rnbqkbnr/pp1p1ppp/8/2pPp3/8/8/PPP1PPPP/RNBQKBNR w KQkq e6 0 3')
    checkMovesForPosition('a pawn that must capture a checking piece, should ignore check', 2, 'b7', 'rnbqkbnr/pp1ppppp/8/2pN4/8/8/PPPPPPPP/R1BQKBNR b KQkq - 1 2')
    
    checkMovesForPosition('a knight in starting position', 2, 'b1')
    checkMovesForPosition('a knight in center of board', 8, 'd5', 'rnbqkbnr/pp1ppppp/8/2pN4/8/8/PPPPPPPP/R1BQKBNR b KQkq - 1 2')
  })
})
    