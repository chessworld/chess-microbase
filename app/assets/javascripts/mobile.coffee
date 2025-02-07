#= require stay_standalone

$ ->
  # Bind navbar click to scroll to top
  $('.nav-bar .title').click ->
    window.scrollTo 0, 0

  # Automatically scroll past Mobile Safari address bar
  setTimeout ->
    window.scrollTo 0, 0 unless window.pageYOffset
  , 600

  # Upgrade images to HiDPI
  if window.devicePixelRatio > 1
    $('img.replace-2x').each ->
      src = @src
      
      # Remove Rails asset fingerprint
      src = src.replace /\-[\da-f]{32}/, ''

      # Add _2x to filename
      src = src.replace '.png', '_2x.png'

      # Update image
      @src = src

  # Bind togglable popup actions menu
  actionsToggle = $('.actions-toggle')
  if actionsToggle.length
    actionsToggle.popup $('.actions'), ->
      actionsToggle.addClass 'open'
    , ->
      actionsToggle.removeClass 'open'

  # Hide footer in standalone mode
  if window.navigator.standalone
    $('footer').hide()