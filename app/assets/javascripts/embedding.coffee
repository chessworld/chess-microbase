class Embed
  @SCHEMES: {
    H: 'high-contrast'
    B: 'blueberry'
    D: 'dragon-fruit'
    G: 'grape'
    L: 'lime'
    M: 'mango'
    O: 'orange'
    S: 'strawberry'
  }

  constructor: ->
    @pages = []
    @fetchSettings()
    @loadGameViewer()
    @loadMicrobase()
    @updateSettings()
    @loadPages()
    @makePageSwitcher() if @pages.length > 1
    @bindWindowEvents()
    @switchToDefaultPage()
    @gotoDefaultPosition()
    @updateSize()

  fetchSettings: ->
    hash = document.location.hash
    @settings = {
      header:       !!hash.match(/h/)
      moveList:     !!hash.match(/m/)
      comments:     !!hash.match(/c/)
      flipped:      !!hash.match(/f/)
      trainingMode: !!hash.match(/t/)
      scheme:       if found = hash.match(/s([A-Z])/) then Embed.SCHEMES[found[1]] else 'default'
      position:     if found = hash.match(/p(\-|\+|\d+)/) then found[1] else '-'
      game:         (found = hash.match(/g(\d+)/)) && found[1]
    }

  loadMicrobase: ->
    self = this
    @microbase = {}
    $('.microbase').each ->
      for key in ['url', 'more']
        self.microbase[key] = $(this).attr "data-#{key}"

  loadGameViewer: ->
    @gameViewer = ST.GameEditor.GameView.create(
      readOnly:       true
      beforeComments: false
      size:           $(document.body).width()
      engine:         $('meta[name=garbochess]').attr('content')
    )
    @gameViewer.takeKeyboardFocus()
    @gameViewer.hide()
    $('#game-editor').empty().addView @gameViewer

  gotoDefaultPosition: ->
    if @settings.position is '-'
      @gameViewer.gotoStart 0
    else if @settings.position is '+'
      @gameViewer.gotoEnd 0
    else
      @gameViewer.gotoPly @settings.position, 0

  loadPages: ->
    @loadPreamblePage()
    @loadGamePages()

  loadPreamblePage: ->
    preamble = $ '#preamble'
    if preamble.length
      @pages.push new PreamblePage(preamble) 

  loadGamePages: ->
    self = this
    $('.game').each ->
      game = {}
      $('div', this).each ->
        game[@className] = $(this).text()
      game.commented = !!game.pgn.match(/\{[^\}]+\}/)
      self.pages.push new GamePage(game, self.gameViewer)

  makeButton: ->
    button = $('<a href="' + (@microbase.url || @page.url) + '" target="_top" class="game-button" id="permalink">Chess Microbase</a>')
    button.hovertitle 'View on Chess Microbase' unless ST.touch()
    button

  makeHeader: ->
    html = '<div class="game-header">'
    if @pages.length > 1
      html += '<a class="details" href="javascript:;"></a>'
    else
      html += '<div class="details"></div>'
    html += '<a class="banner" href="' + (@microbase.url || @page.url) +
      '" target="_top">Chess Microbase</a></div>'
    @header = $ html
    $('a.details', @header).popup @switcher, =>
      # Update selected item in list when showing popup
      $('li', @switcher).removeClass('selected')
        .eq(@pages.indexOf(@page)).addClass('selected')
    , null, detach: true
    $(document.body).prepend @header

  makePageSwitcher: ->
    @switcher = $ '<ul class="dropdown-menu page-switcher"></ul>'

    for page in @pages
      do (page) =>
        li = $ '<li></li>'
        li.addClass 'commented' if page.commented
        a = $ '<a href="javascript:;"></a>'
        a.text page.title
        a.click => @switchPage page
        li.append(a).appendTo @switcher

    if @microbase.more && @microbase.more > 0
      @switcher.append '<li><a href="' + @microbase.url +
        '" target="_top"><em>' + @microbase.more + ' more games...</em></a></li>'

    @switcher.hide().appendTo(document.body)

  switchPage: (newPage) ->
    Popup.close()    
    @page.hide() if @page
    @page = newPage
    @page.show()
    @updateHeader()

  switchToDefaultPage: ->
    switchTo = @pages[0]
    for page in @pages
      if page.id is @settings.game
        switchTo = page
    @switchPage switchTo

  bindWindowEvents: ->
    $(window).on 'resize', => @updateSize()
    $(window).on 'hashchange', =>
      @fetchSettings()
      @switchToDefaultPage()
      @updateSettings()
      @updateHeader()

  updateSettings: ->
    $('#game-editor').attr 'class', 'scheme-' + @settings.scheme
    @gameViewer.comments @settings.comments
    @gameViewer.moveList @settings.moveList
    @gameViewer.moveListView().trainingMode @settings.trainingMode
    @gameViewer.boardView().flipped @settings.flipped
    @gameViewer.boardView().fileNotation(if @settings.header then 'outside' else 'inside')
    @gameViewer.boardView().rankNotation(if @settings.moveList then 'right' else 'inside')
    @gotoDefaultPosition()
    @gameViewer.updateToggleButtons()

  updateHeader: ->
    $('.game-button').remove()
    
    if @settings.header
      @makeHeader() unless @header
      @header.show()
      @updateHeaderDetails()
    else if @gameViewer
      @header.hide() if @header
      @makeButton().appendTo($(
        if @settings.moveList
          '.toolbar-edit .btn-toolbar'
        else
          '.toolbar-board .btn-toolbar'
      , @gameViewer.element()))
    else
      setTimeout =>
        @updateHeader
      , 100

  updateHeaderDetails: ->
    $('.game-header .details').html(
      '<span class="player-names">' + @page.title +
      '</span><span class="game-data">' + @page.subtitle +
      '</span><b class="caret"></b>')

  updateSize: ->
    @gameViewer.size $(document.body).width() if @gameViewer

class PreamblePage
  id:         "0"
  commented:  false
  subtitle:   'Preamble'

  constructor: (@element) ->
    @title = @element.attr 'data-title'

  show: ->
    @element.show()

  hide: ->
    @element.hide()


class GamePage
  constructor: (@game, @gameViewer) ->
    @id         = @game.id
    @commented  = @game.commented
    @title      = @game.name
    @subtitle   = @game.metadata
    @url        = @game.url

  show: ->
    @gameViewer.show()
    @gameViewer.loadGame new Game(@game)
  
  hide: ->
    @gameViewer.hide()

$ ->
  window.embed = new Embed
