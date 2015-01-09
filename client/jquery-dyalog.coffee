# jQuery utility plugins

$.alert = (s, t) -> $('<p>').text(s).dialog modal: 1, title: t, buttons: [text: 'OK', click: -> $(@).dialog 'close']; return
