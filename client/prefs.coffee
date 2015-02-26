keymap = require './keymap'
$d = $pk = null 

ok = ->
  pk = $pk.val()
  # validate
  if pk.length != 1 then $.alert('Invalid prefix key', 'Error', -> $pk.focus(); return); return
  # apply changes
  keymap.setPrefixKey pk
  $d.dialog 'close'
  false

module.exports = ->
  if !$d # the dialogue, lazily initialized
    $d = $ '''
      <div id="prefs">
        <ul id="prefs-tabs-nav">
          <li><a href="#prefs-kbd">Keyboard</a></li>
        </ul>
        <div id="prefs-kbd">
          <label>Prefix key: <input class="prefs-pk text-field" size="1"></label>
        </div>
      </div>
    '''
      .tabs()
      .on 'keydown', 'input', 'return', ok
      .dialog modal: 1, autoOpen: 0, title: 'Preferences', minWidth: 200, minHeight: 200, buttons: [
        {text: 'OK', click: ok}
        {text: 'Cancel', click: -> $d.dialog 'close'; return}
      ]
    $pk = $d.find '.prefs-pk'

  $d.dialog 'open'

  # load current values
  $pk.val keymap.getPrefixKey()
  return
