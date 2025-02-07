getParameterByName = (name) ->
  regex = new RegExp("[\\?&]" + name + "=([^&#]*)")
  results = regex.exec(location.search)
  results && decodeURIComponent(results[1].replace(/\+/g, " "))

$ ->
  $(window).keydown (e) ->
    if e.which == 120 #F9
      link = $('#prev-game')
      link[0].click() if link.length

    if e.which == 121 #F10
      link = $('#next-game')
      link[0].click() if link.length

  games = []
  $('div.game').each ->
    game = {}
    $('div', this).each ->
      game[@className] = $(this).text()
    games.push game

  $('#game-editor').each ->
    editorDiv = $ this
    field = $ '#game_movetext'
    fenField = $ '#game_fen'

    updateSize = ->
      width = $(window).width()
      if width >= 620
        editor.moveList true
        editor.size 620
      else if width >= 460
        editor.moveList true
        editor.size 450
      else
        editor.moveList false
        editor.size 290

    $(window).resize updateSize

    if field.length
      fen = fenField.val()
      fen = null if fen == ''

      $('form input, form select').keydown (e) -> e.stopPropagation()

      # Load game editor
      window.editor = editor = ST.GameEditor.GameView.create(
        fen:            fen
        movetext:       field.val()
        comments:       true
        annotations:    true
        size:           620
        engine:         $('meta[name=garbochess]').attr('content')
      )
      updateSize()
      editor.bind 'gameChanged', (editor, game) ->
        field.val game.toMovetext(annotations: true)
      editor.bind 'startingPositionChanged', (editor, fen) ->
        fenField.val(if fen is Board.STARTING_POSITION then '' else fen)
      editor.bind 'checkmate', (editor, color) ->
        if color == 'w'
          $('#game_result').val('1-0')
        else if color == 'b'
          $('#game_result').val('0-1')
      editor.takeKeyboardFocus()

    else
      # Load game viewer
      game = games[0]
      window.editor = editor = ST.GameEditor.GameView.create(
        pgn:            game.pgn
        readOnly:       true
        comments:       true
        size:           620
        engine:         $('meta[name=garbochess]').attr('content')
      )
      updateSize()
      editor.gotoStart(0)
      editor.takeKeyboardFocus()
      $('#pgn_field').val game.pgn

      diagramPath = ->
        state = editor._state
        fileName = state.endBoard.toFenPosition()
        if state.markup
          fileName += encodeURIComponent(',' + state.markup)
        '/diagrams/' + fileName + '.png'

      diagramURL = ->
        "#{origin()}#{diagramPath()}"

      origin = ->
        s = "#{document.location.protocol}//#{document.location.hostname}"
        s += ':' + document.location.port unless String(document.location.port) == "80"
        s

      $('#print_link').click ->
        editor.print 'Printed from a Chess Microbase &mdash; save, annotate, and share your games at http://chessmicrobase.com'

      $('#export_position').click ->
        document.location = diagramURL()

      $('#share_live_presentation').click ->
        return if window.presentation
        presentation = new LivePresentation()
        presentation.create ->
          presentation.connect()
          presentation.bindSource editor
        window.presentation = presentation
        element = $('<div class="live-presentation">')
        $('#game-editor').before element
        view = new LivePresentationView(presentation, element)
        view.render()

      $('#share_position_on_facebook').click ->
        document.location = 'https://www.facebook.com/dialog/feed?' + $.param(
          app_id:       document.querySelector('meta[name=facebook-app-id]').getAttribute('content')
          link:         $('#copy_link_dialog').data('url')
          picture:      diagramURL()
          redirect_uri: String(document.location)
          ref:          'shared_position'
        )

    $(this).empty().addView editor

    if presentationId = getParameterByName('live')
      window.presentation = presentation = new LivePresentation()
      presentation.id = presentationId
      presentation.bindTarget editor
      presentation.connect()

    editor.toggleTrainingMode() if editorDiv.data('training-mode')

  $('#game_date_formatted').calendricalDate()
