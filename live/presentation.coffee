_ = require('./underscore')

exports = module.exports = class Presentation
  @PRESENTATIONS: {}
  @nextId = 0

  # Run periodically to clear out presentations that haven't been used in a while
  @clean: ->
    for id, presentation of @PRESENTATIONS
      presentation.staleness++
      if presentation.staleness > 180
        delete @PRESENTATIONS[id]

  @add: (token) ->
    id = @nextId++
    presentation = new Presentation(id, token)
    @PRESENTATIONS[id] = presentation
    presentation

  @find: (id) ->
    @PRESENTATIONS[id]

  @unlistenAll: (socket) ->
    for id, presentation of @PRESENTATIONS
      presentation.unlisten socket

  constructor: (@id, @token) ->
    @listeners = []
    @staleness = 0
    @moves = null

  listen: (socket) ->
    @staleness = 0
    console.log "new listener for presentation #{@id}"
    @listeners = _.union(@listeners, [socket])
    socket.emit 'update', @details if @details
    @_sendViewerCount()

  unlisten: (socket) ->
    @listeners = _.without(@listeners, socket)

  update: (details) ->
    @staleness = 0
    @details = details
    console.log "Broadcasting update for presentation #{@id} to #{@listeners.length} listeners"
    for socket in @listeners
      socket.emit 'update', details

  _sendViewerCount: ->
    for socket in @listeners
      socket.emit 'viewerCount', @listeners.length - 1

  toJson: ->
    JSON.stringify
      presentation:
        id:     @id
        token:  @token
