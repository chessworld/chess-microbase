$('#embed-form').each ->
  form = $ this

  updateEmbed = ->
    url = form.attr('data-url')
    token = form.attr('data-token')
    kind = form.attr('data-kind')

    # Get toggle options
    settings = ''
    $('input[name=option]:checked', form).each ->
      settings += $(this).val()

    # Get default game
    game = $('select[name=game]', form).val()
    settings += "g#{game}" if game

    # Get default position
    positionMode = $('input[name=position]:checked', form).val()
    if positionMode is 'start'
      settings += 'p-'
    else if positionMode is 'end'
      settings += 'p+'
    else
      custom = $('input[name=custom-position]', form).val()
      ply = Number(custom.replace(/\D/g, '')) * 2
      ply -= 1 unless custom.match '...'
      settings += 'p' + ply

    # Get scheme
    scheme = $('select.color-scheme').val()
    if scheme != 'Default'
      settings += 's' + scheme[0]

    # Get size
    widthMode = $('input[name=width]:checked', form).val()
    width = if widthMode == 'auto'
      $('#preview').parent().width()
    else
      Number $('input[name=custom-width]', form).val()
    width = 300 if width < 300
    width = 450 if width < 450 && settings.match(/m/)
    board = width
    board -= 220 if settings.match(/m/)
    board -= board % 8
    height = board + 42
    height += 67 if settings.match(/h/)
    height += 80 if settings.match(/c/)

    preview = $('#preview').css(
      width:  width
      height: height
    )[0]

    preview.contentWindow.document.location.hash = '#' + settings if preview.contentWindow

    code = if widthMode == 'auto'
      "<div id=\"embedded_#{kind}_#{token}\"><div style=\"background:#eee;color:#333;padding:15px;text-align:center;border-radius:4px;margin:10px\">Loading embedded chess #{kind}...</div></div>" +
      "<script>(function(f){window.addEventListener?addEventListener('load',f,false):attachEvent('onload',f)})(function(){var s=document.createElement('script');s.src='https:#{url}.js?embedded=1&token=#{token}&hash=#{settings}';document.body.appendChild(s)})</script>"
    else
      "<iframe width=\"#{width}\" height=\"#{height}\" src=\"https:#{url}?token=#{token}&embedded=1##{settings}\" frameborder=\"0\"></iframe>"

    $('#embed-code').val code

  $('input, select', form).on 'click change', updateEmbed
  $(window).resize updateEmbed
  updateEmbed()
