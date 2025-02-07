#= require select2.min

$ ->
  format = (state) ->
    state.text + '<span class="scheme-preview scheme-' +
      state.text.toLowerCase() + '"><span class="black square"></span></span>'

  $('select.color-scheme').select2(
    width: 'element'
    formatResult: format
    formatSelection: format
  )