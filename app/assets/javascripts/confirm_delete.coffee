updateDeleteButton = ->
  $('.delete-button').attr 'disabled', !$('.confirm-delete').is(':checked')

$ ->
  $('.confirm-delete').change updateDeleteButton
  updateDeleteButton()