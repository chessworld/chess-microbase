import { MoveListView } from './move-list-view'
import { Game } from '../models/game'

const MakeMoveList = (movetext) => {
  const game = new Game({movetext})
  const moveList = MoveListView.create({game})
  moveList.load()
  return moveList
}

describe('MoveListView', function() {
  let moveList
  beforeEach(() => {
    moveList = MakeMoveList('e4 e5')
  })
  
  describe('#updateMoveText', () =>
    it('should call updateText on move', function() {
      const child = moveList.mainline().children().first()
      const updateText = jest.spyOn(child, 'updateText')
      moveList.updateMoveText(moveList.game().start.next)
      expect(updateText).toBeCalled()
    })
  )
})
