keymap = require './keymap.coffee'
module.exports = ->
  ok = ->
    pk = $pk.val()
    if pk.length == 1 then keymap.setPrefixKey pk; $d.dialog 'close'
    else $('<p>Invalid prefix key</p>').dialog modal: 1, title: 'Error', buttons: [text: 'OK', click: -> $(@).dialog 'close'; $pk.focus()]
    false
  $d = $('<div class="kbd-prefs"><label>Prefix key: <input class="prefs-pk text-field" size="1"></label></div>').dialog
    modal: 1, title: 'Keyboard Preferences', buttons: [{text: 'OK', click: ok}, {text: 'Cancel', click: -> $(@).dialog 'close'; return}]
  $pk = $d.find('.prefs-pk').focus().val keymap.getPrefixKey()
  $d.on 'keydown', 'input', 'return', ok
  return
