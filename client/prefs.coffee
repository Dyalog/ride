Dyalog.showPrefs = ->
  ok = ->
    pk = $pk.val()
    if pk.length == 1 then Dyalog.setPrefixKey pk; $d.dialog 'close'
    else $('<p>Invalid prefix key</p>').dialog modal: 1, title: 'Error', buttons: [text: 'OK', click: -> $(@).dialog 'close'; $pk.focus()]
    false
  $d = $('<label>Prefix key: <input class="prefs-pk text-field" size="1"></label>').dialog
    modal: 1, title: 'Keyboard Preferences', buttons: [{text: 'OK', click: ok}, {text: 'Cancel', click: -> $(@).dialog 'close'; return}]
  $pk = $d.find('.prefs-pk').focus().val Dyalog.getPrefixKey()
  $d.keydown (e) -> if e.which == 13 then ok()
  return
