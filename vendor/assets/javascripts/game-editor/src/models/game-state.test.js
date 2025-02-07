import { GameState } from './game-state'
import { Board } from './board'

describe('GameState', () => {
  let gameState

  describe('constructor', () =>  
    describe('without move', function() {
      beforeEach(function() {
        gameState = new GameState()
      })
      
      it('should have a ply of 0', function() {
        expect(gameState.ply).toEqual(0)
      })
      
      it('should have no links', function() {
        expect(gameState.prev).toBe(null)
        expect(gameState.next).toBe(null)
      })
    
      it('should have no variations', function() {
        expect(gameState.variations.length).toEqual(0)
      })
      
      it('should have no move', function() {
        expect(gameState.move).toBe(null)
      })
      
      it('should have an end board', function() {
        expect(gameState.endBoard).toBeInstanceOf(Board)
      })
    })
  )
})
