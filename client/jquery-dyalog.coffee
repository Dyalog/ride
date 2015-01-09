# jQuery utility plugins

$.alert = (s, t) -> $("<p>#{s}</p>").dialog modal: 1, title: t, buttons: [text: 'OK', click: -> $(@).dialog 'close']; return
