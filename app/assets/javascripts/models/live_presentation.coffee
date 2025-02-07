
class window.LivePresentation
  @LIVE_SERVER_URL: "http://#{document.location.hostname}:8041/"

  constructor: ->
    @ready = false
    @id = null
    @token = null
    @observer = null
    @updater = null
    @viewers = 0
    @data = {}

  create: (callback) ->
    $.ajax
      type:   'POST'
      url:    '/live_presentations'
      success: (data) =>
        @ready  = true
        @id     = data.id
        @token  = data.token
        callback()
        $(this).trigger 'connected'
      error: ->
        alert "Sorry, unable to create a live presentation at this time"

  connect: ->
    @socket = io.connect LivePresentation.LIVE_SERVER_URL

    @socket.on 'connect', =>
      @listen()

    @socket.on 'disconnect', =>
      @ready = false
      $(this).trigger('disconnected')

    @socket.on 'update', (data) =>
      @data = JSON.parse(data)
      @updater.update @data if @updater

    @socket.on 'viewerCount', (data) =>
      @viewers = data
      $(this).trigger 'viewersCountUpdated'

  listen: ->
    @socket.emit 'listen', @id

  bindSource: (gameView) ->
    @observer = new LivePresentation.GameViewObserver(gameView, this)

  bindTarget: (gameView) ->
    @updater = new LivePresentation.GameViewUpdater(gameView)
    @updater.update @data

  writeAttributes: (attributes) ->
    changed = false
    for name of attributes
      if @_writeAttribute(name, attributes[name])
        changed = true
    @_sendData() if changed

  _writeAttribute: (name, value) ->
    if @data[name] != value
      @data[name] = value
      true
    else
      false

  _sendData: ->
    @socket.emit 'update', @id, @token, JSON.stringify(@data)

class window.LivePresentation.GameViewObserver
  constructor: (gameView, presentation) ->
    @gameView = gameView
    @presentation = presentation
    @bind()

  bind: ->
    @gameView.bind 'switchedState', this, '_gameViewSwitchedState'
    @gameView.boardView().bind 'markupChanged', this, '_boardViewMarkupChanged'
    @gameView.boardView().bind 'moves', this, '_boardViewMoves'
    @gameView.boardView().bind 'flipped', this, '_updateModes'
    @gameView.moveListView().bind 'trainingModeChanged', this, '_updateModes'

  _gameViewSwitchedState: (gameView, state) ->
    @presentation.writeAttributes
      stateLoadId:      state.loadId
      boardFen:         null
      markupText:       null
      modes:            @_getModes()

  _boardViewMarkupChanged: (boardView) ->
    @presentation.writeAttributes
      markupText: boardView.markupText()

  _boardViewMoves: (boardView) ->
    @presentation.writeAttributes
      boardFen: boardView.board().toFen()

  _updateModes: ->
    @presentation.writeAttributes
      modes: @_getModes()

  _getModes: ->
    training: !!@gameView.moveListView().trainingMode()
    flipped:  !!@gameView.boardView().flipped()

class window.LivePresentation.GameViewUpdater
  constructor: (gameView) ->
    @gameView = gameView

  update: (data) ->
    @_updateState data.stateLoadId
    @_updateMarkup data.markupText
    @_updateBoard data.boardFen
    @_updateModes data.modes if data.modes?

  _updateState: (stateLoadId) ->
    if stateLoadId? && @gameView._state.loadId != stateLoadId
      state = @gameView.game().loadedStates[stateLoadId]
      @gameView.gotoState state

  _updateMarkup: (markupText) ->
    if boardView = @gameView.boardView()
      boardView.markupText(markupText || '')

  _updateBoard: (boardFen) ->
    return unless boardFen

    if boardView = @gameView.boardView()
      if boardView.board().toFen() != boardFen
        board = new Board(fen: boardFen)
        boardView.board(board)
        boardView.updatePieces()

  _updateModes: (modes) ->
    @gameView.moveListView().trainingMode(modes.training)
    @gameView.boardView().flipped(modes.flipped)
