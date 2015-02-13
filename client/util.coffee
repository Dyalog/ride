# jQuery utility plugins
$.alert = (message, title, callback) ->
  $('<p>').text(message).dialog modal: 1, title: title, buttons: [
    text: 'OK', click: -> $(@).dialog 'close'; callback?(); return
  ]
  return
