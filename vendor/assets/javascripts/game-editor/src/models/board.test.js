import { Board } from './board'

describe('Board', () => {
  let board

  describe('#checkMate', function() {
    describe('with standard opening position', function() {
      beforeEach(function() {
        board = new Board()
      })
      
      it('should not be checkmate', function() {
        expect(board.checkMate()).toEqual(false)
      })
    })
    
    describe('with a four move checkmate', function() {
      beforeEach(function() {
        board = new Board({fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4'})
      })
      
      it('should be checkmate', function() {
        expect(board.checkMate()).toEqual(true)
      })
    })
    
    describe('with a double checkmate', function() {
      beforeEach(function() {
        board = new Board({fen: '4rnb1/4pkpp/3p2R1/2p1N3/p7/1Q6/5K2/8 b - - 0 1'})
      })
      
      it('should be checkmate', function() {
        expect(board.checkMate()).toEqual(true)
      })
    })
    
    describe('with check, that can be escaped by king move', function() {
      beforeEach(function() {
        board = new Board({fen: '8/4k3/8/2Q5/8/8/4K3/8 b - - 0 1'})
      })
      
      it('should not be checkmate', function() {
        expect(board.checkMate()).toEqual(false)
      })
    })

    describe('with check, that can be escaped by capture', function() {
      beforeEach(function() {
        board = new Board({fen: '7R/3bkp2/1p5R/2Q5/8/8/4K3/8 b - - 0 1'})
      })

      it('should not be checkmate', function() {
        expect(board.checkMate()).toEqual(false)
      })
    })
    
    describe('with check, that can be escaped by blocking', function() {
      beforeEach(function() {
        board = new Board({fen: '7R/3pkp2/7R/2Q5/8/8/4K3/8 b - - 0 1'})
      })

      it('should not be checkmate', function() {
        expect(board.checkMate()).toEqual(false)
      })
    })
    
    describe('with checkmate, where the only piece that could capture to escape is pinned', function() {
      beforeEach(function() {
        board = new Board({fen: 'r1b1kbnr/pppp1ppp/8/8/4q3/2Pn1NP1/PP1NPP1P/R1BQKB1R w KQkq - 1 7'})
      })
    
      it('should be checkmate', function() {
        expect(board.checkMate()).toEqual(true)
      })
    })
  })
})
