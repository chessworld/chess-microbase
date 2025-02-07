class window.LivePresentationView

  constructor: (presentation, element) ->
    @presentation = presentation
    @element = element
    $(presentation).on('connected disconnected viewersCountUpdated', => @render())

  render: ->
    @element.empty()
    @element.append '<div class="live-presentation__title">Live Presentation</div>'
    @element.append '<div class="live-presentation__status">' + @status() + '</div>'
    @element.append @_shareUrlHtml() if @presentation.ready
    $(@element).find('input').on 'focus click mouseup', ->
      this.select()

  _shareUrlHtml: ->
    '<div class="live-presentation__url-share">' +
      '<label class="live-presentation__url-share-label">Share URL:' +
      '<input class="live-presentation__url-share-input" value="' +
      @shareUrl() + '" /></label></div>'

  shareUrl: ->
    $('#copy_link_dialog').data('url') + '?live=' + @presentation.id

  status: ->
    if @presentation.ready
      @viewerCount()
    else
      'Connecting...'

  viewerCount: ->
    viewers = @presentation.viewers
    if viewers == 1
      '1 viewer'
    else
      "#{viewers} viewers"
