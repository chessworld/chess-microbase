# Live game server
#
# Provides a communication channel to broadcast new game moves to clients
# watching a game live

SOCKET_IO_PORT = 8041
HTTP_PORT      = 8040

io = require('socket.io').listen(SOCKET_IO_PORT)
#io.server.removeListener('request', io.server.listeners('request')[0])
console.log "Socket.io server started on port #{SOCKET_IO_PORT}"

qs = require 'querystring'
Presentation = require './presentation'

# Automatically clear out stale presentations
setInterval((-> Presentation.clean()), 60000)

# Accept incoming sockets and allow them to listen to presentations
io.sockets.on 'connection', (socket) ->
  console.log "New socket.io connection"
  
  socket.on 'listen', (id) ->
    if presentation = Presentation.find(id)
      presentation.listen socket

  socket.on 'update', (id, token, details) ->
    if presentation = Presentation.find(id)
      if presentation.token == token
        console.log "Update to presentation ##{id}"
        presentation.update details
      else
        console.log "Failed attempt to update presentation ##{id} with invalid token"

  socket.on 'disconnect', ->
    Presentation.unlistenAll socket

# Start a simple HTTP server to receive data from Rails
require('http').createServer((request, response) ->
  body = ''
  request.on 'data', (data) -> body += data
  request.on 'end', ->
    # Parse POST data
    data = qs.parse body

    if data.token
      presentation = Presentation.add(data.token)
      console.log "New presentation created ##{presentation.id} with token #{presentation.token}"

      # Return HTTP success
      response.statusCode = 201
      response.write presentation.toJson()
      response.end()
    else
      response.statusCode = 422
      response.end()
).listen(HTTP_PORT, '127.0.0.1')
console.log "HTTP admin server started on port 8040"
