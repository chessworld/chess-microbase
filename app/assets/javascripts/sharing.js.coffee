$('.copy-dialog, .paste-dialog').on 'shown', ->
  $('input[type=text], textarea', this).focus().click()

$('.copy-field').on('click', ->
  instructions = $('#' + $(this).attr('data-instructions'))
  $(this).select()
  instructions.hide()
  if navigator.platform.indexOf('Mac') >= 0
    instructions.html 'Press &#x2318;C to copy'
  else
    instructions.html 'Press Control + C to copy'
  instructions.fadeIn 200
).blur(->
  instructions = $('#' + $(this).attr('data-instructions'))
  instructions.fadeOut(200)
)

$('.paste-field').on('click', ->
  instructions = $('#' + $(this).attr('data-instructions'))
  $(this).select()
  instructions.hide()
  if navigator.platform.indexOf('Mac') >= 0
    instructions.html 'Press &#x2318;V to paste'
  else
    instructions.html 'Press Control + V to paste'
  instructions.fadeIn 200
).blur(->
  instructions = $('#' + $(this).attr('data-instructions'))
  instructions.fadeOut(200)
)

$('#paste_dialog .submit').hide()

submitting = false

$('#game_pgn').on('change keyup', ->
  return if submitting
  
  game = new Game(pgn: $(this).val())
  
  if game.result
    unless $(this).is(':disabled')
      submitting = true
      $(this).val game.toPgn()
      form = $('#new_game')
      form.submit()
      $(this).attr('disabled', true)
      $('.clipboard-instructions', form).text 'Saving...'
  else if game.error
    $('#new_game .error').text game.error
  else
    $('#new_game .error').text ''
  
)