keymap = require './keymap'

# Preferences UI
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

  $d.dialog('option', 'position', at: 'center').dialog 'open'

  # load current values
  $pk.val keymap.getPrefixKey()
  return

# Preferences API -- localStorage should be accessed only through it
# Usage:
#   prefs.foo()                 # getter
#   prefs.foo(123)              # setter
#   prefs.foo (newValue) -> ... # add "on change" listener
#   prefs.foo.toggle()          # convenience function for booleans (numbers 0 and 1)
#   prefs.foo.getDefault()      # retrieve default value
prefs = module.exports
[ # name                    default
  ['favs',                  [host: '127.0.0.1', port: 4502]]
  ['floatingWindowInfos',   {}]
  ['floatNewEditors',       0]
  ['lineNumbersInDebugger', 0]
  ['lineNumbersInEditor',   1]
  ['prefixKey',             '`']
  ['sessionLineWrapping',   0]
  ['showLanguageBar',       1]
  ['theme',                 '']
  ['windowTitle',           '{WSID} - {HOST}:{PORT} (PID: {PID})']
]
.forEach ([k, d]) ->       # k: preference name, d: default value
  t = typeof d; l = []     # t: type, l: listeners
  str = if t == 'object' then JSON.stringify else (x) -> '' + x
  sd = str d               # sd: default value "d" converted to a string
  prefs[k] = p = (x) ->
    if typeof x == 'function'
      l.push f; return
    else if arguments.length
      if t == 'number' then x = +x else if t == 'string' then x = '' + x # coerce to type "t"
      sx = str x # sx: "x" converted to a string; localStorage values can only be strings
      if sx == sd then delete localStorage[k] else localStorage[k] = sx # avoid recording if it's at its default
      for f in l then f value # notify listeners
      x
    else
      if !(r = localStorage[k])? then d
      else if t == 'number' then +r
      else if t == 'object' then JSON.parse r
      else r
  p.getDefault = -> d
  p.toggle = -> p !p()
  return
