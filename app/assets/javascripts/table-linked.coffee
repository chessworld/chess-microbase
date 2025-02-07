$ ->
  $('.table-linked').each ->
    table = this
    tbody = $('tbody', this)
    tbody.children().each ->
      row = $(this)
      href = row.attr('data-href')
      $('<a href="' + href + '" style="display: table-row-group" />')
        .append(row).appendTo(table)
    tbody.remove()