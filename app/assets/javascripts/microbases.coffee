$ ->
  $('.expandable-preamble').each ->
    preamble = $ '.preamble', this
    toggle = $ 'a.toggle', this
    scroll = preamble[0].scrollHeight
    if scroll > 60
      toggle.click ->
        unless preamble.is('.expanded')
          preamble.addClass 'expanded'
          preamble.animate {height: scroll}, 400
          toggle.text 'Show less'
        else
          preamble.removeClass 'expanded'
          preamble.animate {height: 55}, 400
          toggle.text 'Show more'
    else
      preamble.css 'height', 'auto'
      toggle.hide()
