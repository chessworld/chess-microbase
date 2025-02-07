import { Game } from './game'
import { GameState } from './game-state'

describe('Game', function() {
  let game

  describe('constructor', () =>  
    describe('blank game', function() {
      beforeEach(function() {
        game = new Game()
      })
      
      it('should have a start state', function() {
        expect(game.start).toBeInstanceOf(GameState)
      })
      
      it('should have same state for start and end', function() {
        expect(game.start).toBe(game.end)
      })
    })
  )
  
  describe('loadMovetext/toMovetext', function() {
    const moveTextShouldMatch = (description, movetext) =>
      it(`should match movetext ${description}`, function() {
        game = new Game({movetext})
        expect(game.toMovetext()).toEqual(movetext)
      })
    
    
    moveTextShouldMatch('with no variations', '1.e4 d5 2.exd5 Qxd5 3.Nc3 Qc4 4.Ne4 Qxf1+ 5.Kxf1')
    moveTextShouldMatch('with single variation', '1.e4 d5 (1...e5 2.d4 exd4 3.Qxd4) 2.exd5 Qxd5 3.Nc3 Qc4 4.Ne4 Qxf1+ 5.Kxf1')
    moveTextShouldMatch('with nested variation', '1.e4 d5 (1...e5 2.d4 exd4 (2...d5 3.exd5 exd4) 3.Qxd4) 2.exd5 Qxd5 3.Nc3 Qc4 4.Ne4 Qxf1+ 5.Kxf1')
    
    moveTextShouldMatch('with comment', '1.e4 d5 2.exd5 {Test} Qxd5 3.Nc3')
    moveTextShouldMatch('with comment at start of variation', '1.d4 e5 2.d5 (2.{Test} dxe5) 2...e4')
    moveTextShouldMatch('with comment on starting position', '{Test} 1.e4 d5')
    
    moveTextShouldMatch('with various kinds of ambiguous moves', '1.Nc3 Nc6 2.Nf3 Nf6 3.Nb5 Nb4 4.Nfd4 Nbd5 5.Nf5 Nf4 6.Nbd4 N6d5 7.Nf3 Nd3+ 8.exd3 Ne3 9.N5d4 Nxd1 10.a4 Nc3 11.a5 Nd5 12.Ne5 b6 13.axb6 a6 14.b7 Nb4 15.b8=N h6 16.Nbc6 h5 17.Nxb4 h4 18.Nxf7 h3 19.Nxd8 e5 20.Nd4c6')
    moveTextShouldMatch('with ambiguous moves differentiated by check', '1.b3 e5 2.Bb2 Nc6 3.e3 d6 4.c4 Nf6 5.Nc3 d5 6.cxd5 Nxd5 7.Bb5 Ne7')
  })
})
