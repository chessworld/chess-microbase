import { VariationView } from './variation-view'
import { MoveListView } from './move-list-view'
import { Game } from '../models/game'

const MakeMoveList = (movetext) => {
  const game = new Game({movetext})
  const moveList = MoveListView.create({game})
  moveList.load()
  return moveList
}

describe('VariationView', function() {
  let moveList, view

  describe('#collapse', function() {
    describe('with a white variation', function() {
      beforeEach(() => {
        moveList = MakeMoveList('1. e4 e5 2. d4 (c4 d5 3. d4) d5 3. c4')
        view = moveList.mainline().children().at(4)
      })
      
      describe('when we collapse', function() {
        beforeEach(function() { view.collapse() })

        it('should add .collapsed class to element', function() {
          expect(view.element().is('.collapsed')).toBe(true)
        })

        it(() => should('beCollapsed'))

        it('should not hide first white move', function() {
          expect(view.children().at(0).visible()).toBe(true)
        })

        it('should not hide first black move', function() {
          expect(view.children().at(1).visible()).toBe(true)
        })

        it('should hide second white move', function() {
          expect(view.children().at(2).visible()).toBe(false)
        })
      })
      
      describe('when we collapse a masked variation', function() {
        beforeEach(() => {
          view.maskAt(view.children().first())
          view.collapse()
        })
        
        it(() => expect(view.collapsed()).toBe(false))
      })
    })

    describe('with a black variation', function() {    
      beforeEach(() => {
        moveList = MakeMoveList('1. e4 e5 2. d4 d5 (c5 3. dxc5) 3. c4')
        view = moveList.mainline().children().at(5)
        view.collapse()
      })
      
      it('should not hide move number', function() {
        expect(view.header().visible()).toBe(true)
      })

      it('should not hide first black move', function() {
        expect(view.children().at(0).visible()).toBe(true)
      })

      it('should hide first white move', function() {
        expect(view.children().at(1).visible()).toBe(false)
      })
    })
  
    describe('with a single-line variation', function() {
      beforeEach(() => {
        moveList = MakeMoveList('1. e4 e5 2. d4 d5 (c5) 3. c4')
        view = moveList.mainline().children().at(5)
        view.collapse()
      })
      
      it(() => expect(view.collapsed()).toBe(false))
    })
  
    describe('with mainline', function() {
      beforeEach(() => {
        moveList = MakeMoveList('1. e4 e5 2. d4 d5')
        view = moveList.mainline()
        view.collapse()
      })

      it(() => expect(view.collapsed()).toBe(false))
    })
  })

  describe('#collapseOutside', function() {
    describe('with two variations', function() {    
      let other
      beforeEach(() => {
        moveList = MakeMoveList('1. e4 e5 2. d4 (c4 d5 3. d4) (f4 f5 3. exf5) d5 3. c4')
        view = moveList.mainline().children().at(4)
        other = moveList.mainline().children().at(6)
      })
      
      it("should collapse other variation", function() {
        view.collapseOutside()
        expect(other.collapsed()).toBe(true)
      })

      it("should not collapse this variation", function() {
        const collapse = jest.spyOn(view, 'collapse')
        view.collapseOutside()
        expect(collapse).not.toBeCalled()
      })

      it("should uncollapse this variation", function() {
        view.collapse()
        const uncollapse = jest.spyOn(view, 'uncollapse')
        view.collapseOutside()
        expect(uncollapse).toBeCalled()
      })
    })

    describe('with nested variations', function() {    
      let parent

      beforeEach(() => {
        moveList = MakeMoveList('1. e4 e5 2. d4 (c4 d5 3. d4 (f4 f5 4. exf5) c5 )')
        parent = moveList.mainline().children().at(4)
        view = parent.children().at(4)
      })

      it("should call parent collapseOutside if able", function() {
        const collapseOutside = jest.spyOn(parent, 'collapseOutside')
        view.collapseOutside()
        expect(collapseOutside).toBeCalled()
      })
    })
  })
  
  describe('#collapseVariations', () =>
    describe('with nested variations', function() {    
      let subvariation
      beforeEach(() => {
        moveList = MakeMoveList('1. e4 e5 2. d4 (c4 d5 3. d4 (f4 f5 4. exf5) c5 )')
        view = moveList.mainline().children().at(4)
        subvariation = view.children().at(4)
      })
      
      it("should collapse sub-variation", function() {
        view.collapseVariations()
        expect(subvariation.collapsed()).toBe(true)
      })
    })
  )
  
  describe('#maskAt', function() {
    describe('with a variation', function() {
      beforeEach(() => {
        moveList = MakeMoveList('1. e4 e5 2. d4 (c4 d5 3. d4) d5 3. c4')
        view = moveList.mainline().children().at(4)
      })
      
      describe('with a move specified', function() {
        let move

        beforeEach(() => {
          move = view.children().at(1)
        })

        it('should uncollapse variation', function() {
          const uncollapse = jest.spyOn(view, 'uncollapse')
          view.maskAt(move)
          expect(uncollapse).toBeCalled()
        })

        it('should mask specified move', function() {
          view.maskAt(move)
          expect(move.masked()).toBe(true)
        })

        it('should unmask other moves', function() {
          view.children().at(0).masked(true)
          view.children().at(2).masked(true)
          view.maskAt(move)
          expect(view.children().at(0).masked()).toBe(false)
          expect(view.children().at(2).masked()).toBe(false)
        })

        it('should show earlier move', function() {
          view.maskAt(move)
          expect(view.children().at(0).visible()).toBe(true)
        })

        it('should hide following move', function() {
          view.maskAt(move)
          expect(view.children().at(2).visible()).toBe(false)
        })

        it('should set maskAt', function() {
          view.maskAt(move)
          expect(view.maskAt()).toBe(move)
        })
      })

      describe('with null specified', function() {
        beforeEach(function() {
          // Start with a masked state
          view.maskAt(view.children().at(1))
        })

        it('should uncollapse variation', function() {
          const uncollapse = jest.spyOn(view, 'uncollapse')
          view.maskAt(null)
          expect(uncollapse).toBeCalled()
        })
        
        it('should unmask all moves', function() {
          view.maskAt(null)
          ;[0, 1, 2].map((i) =>
            expect(view.children().at(i).masked()).toBe(false)
          )
        })

        it('should set maskAt', function() {
          view.maskAt(null)
          expect(view.maskAt()).toBe(null)
        })
      })
    })
          
    describe('with nested variations', function() {
      let clear, subvariation
      beforeEach(() => {
        moveList = MakeMoveList('1. e4 e5 2. d4 (c4 d5 3. d4 (f4 f5 4. exf5) c5 )')
        view = moveList.mainline().children().at(4)
        clear = view.children().at(3)
        subvariation = view.children().at(4)
      })

      describe('from first move', function() {
        beforeEach(() => {
          view.maskAt(view.children().at(0))
        })

        it('should not mask sub-variation', function() {
          expect(subvariation.maskAt()).toBe(null)
        })

        it('should hide clear', function() {
          expect(clear.visible()).toBe(false)
        })
        
        it('should hide sub-variation', function() {
          expect(subvariation.visible()).toBe(false)
        })
      })

      describe('from move before move with variations', function() {
        beforeEach(() => {
          view.maskAt(view.children().at(1))
        })

        it('should hide clear', function() {
          expect(clear.visible()).toBe(false)
        })

        it('should hide sub-variation', function() {
          expect(subvariation.visible()).toBe(false)
        })
      })
      
      describe('from move with variations', function() {
        beforeEach(() => {
          view.maskAt(view.children().at(2))
        })

        it('should show clear', function() {
          expect(clear.visible()).toBe(true)
        })

        it('should show sub-variation', function() {
          expect(subvariation.visible()).toBe(true)
        })

        it('should mask sub-variation', function() {
          expect(subvariation.maskAt()).toBe(subvariation.children().first())
        })
      })

      describe('with a later move specified', function() {
        let move

        beforeEach(() => {
          move = view.children().last()
        })

        it('should unmask sub-variation', function() {
          subvariation.maskAt(subvariation.children().first())
          view.maskAt(move)
          expect(subvariation.maskAt()).toBe(null)
        })
      })

      describe('with a null specified', function() {
        it('should unmask sub-variation', function() {
          subvariation.maskAt(subvariation.children().first())
          view.maskAt(null)
          expect(subvariation.maskAt()).toBe(null)
        })

        it('should not collapse variation', function() {
          const collapse = jest.spyOn(view, 'collapse')
          view.maskAt(null)
          expect(collapse).not.toBeCalled()
        })
      })
    })
  })
  
  describe('#moveAfter', () =>
    describe('with a white variation', function() {
      beforeEach(() => {
        moveList = MakeMoveList('1. e4 e5 2. d4 (c4 d5 3. d4) d5 3. c4')
        view = moveList.mainline().children().at(4)
      })

      it("should find move after first move", function() {
        expect(view.moveAfter(view.children().at(0))).toBe(view.children().at(1))
      })

      it("null for last move", function() {
        expect(view.moveAfter(view.children().at(2))).toBe(null)
      })
    })
  )

  describe('#setCollapsed', () =>
    describe('with a white variation', function() {
      beforeEach(() => {
        moveList = MakeMoveList('1. e4 e5 2. d4 (c4 d5 3. d4) d5 3. c4')
        view = moveList.mainline().children().at(4)
      })
      
      it('should collapse view when set to true', function() {
        const collapse = jest.spyOn(view, 'collapse')
        view.collapsed(true)
        expect(collapse).toBeCalled()
      })

      it('should uncollapse view when set to false', function() {
        const uncollapse = jest.spyOn(view, 'uncollapse')        
        view.collapsed(false)
        expect(uncollapse).toBeCalled()
      })
    })
  )
  
  describe('#uncollapse', () =>
    describe('with a white variation', function() {
      beforeEach(() => {
        moveList = MakeMoveList('1. e4 e5 2. d4 (c4 d5 3. d4) d5 3. c4')
        view = moveList.mainline().children().at(4)
        view.collapse()
        view.uncollapse()
      })

      it('should remove .collapsed class from element', function() {
        expect(view.element().is('.collapsed')).toBe(false)
      })

      it(() => expect(view.collapsed()).toBe(false))

      it('should show second white move', function() {
        expect(view.children().at(2).visible()).toBe(true)
      })
    })
  )
})
