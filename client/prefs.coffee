# Preferences UI

tabImpls = [
  do ->
    $pk = null
    name: 'Keyboard'
    init: ($e) -> $e.html '<label>Prefix key: <input class="text-field" size="1"></label>'; $pk = $ 'input', $e; return
    load: -> $pk.val prefs.prefixKey(); return
    validate: -> if $pk.val().length != 1 then message: 'Invalid prefix key', element: $pk
    save: -> prefs.prefixKey $pk.val(); return
  do ->
    $wt = null
    name: 'Title'
    init: ($e) ->
      $e.html """
        Window title:
        <input class="text-field">
        <pre>
        <a href='#'>{WSID}</a>            workspace name
        <a href='#'>{HOST}</a>:<a href='#'>{PORT}</a>     interpreter's TCP endpoint
        <a href='#'>{PID}</a>             PID of the interpreter process
        <a href='#'>{CHARS}</a>           Unicode or Classic
        <a href='#'>{BITS}</a>            64 or 32
        <a href='#'>{VER}</a>             interpreter version
          <a href='#'>{VER_A}</a>           major
          <a href='#'>{VER_B}</a>           minor
          <a href='#'>{VER_C}</a>           svn revision
        <a href='#'>{RIDE_VER}</a>        RIDE version
          <a href='#'>{RIDE_VER_A}</a>      major
          <a href='#'>{RIDE_VER_B}</a>      minor
          <a href='#'>{RIDE_VER_C}</a>      git commit number
        </pre>
      """
      $e.on 'click', 'pre a', (e) ->
        s = $wt.val(); p = $wt[0].selectionStart; u = $(e.target).text(); $wt.val s[...p] + u + s[p..]
        $wt[0].selectionStart = $wt[0].selectionEnd = p + u.length; return
      $('pre a', $e).attr 'title', 'Insert'; $wt = $ 'input', $e; return
    load: -> $wt.val prefs.windowTitle(); return
    save: -> prefs.windowTitle $wt.val(); return
]

safe = (s) -> s.toLowerCase().replace /[^a-z\-]/g, '-' # make a string suitable for a DOM id
join = (a) -> a.join ''

$d = null # dialogue instance, lazily initialized

ok = ->
  for t in tabImpls when v = t.validate?()
    $.alert v.message, 'Error', if v.element then do (v = v) -> v.element.focus()
    return
  $d.dialog 'close'; false

D.prefs = prefs = module.exports = (tabName) ->
  if !$d # the dialogue, lazily initialized
    $d = $ """
      <div id="prefs">
        <ul id="prefs-tabs-nav">
          #{join tabImpls.map (t) -> "<li><a href='#prefs-tab-#{safe t.name}'>#{t.name}</a></li>"}
        </ul>
        #{join tabImpls.map (t) -> "<div id='prefs-tab-#{safe t.name}'></div>"}
      </div>
    """
      .tabs()
      .on 'keydown', 'input', 'return', ok
      .dialog modal: 1, autoOpen: 0, title: 'Preferences', width: 600, height: 450, buttons: [
        {text: 'OK', click: ok}
        {text: 'Cancel', click: -> $d.dialog 'close'; return}
      ]
    for t in tabImpls then t.init $ "#prefs-tab-#{safe t.name}"
  $d.dialog('option', 'position', at: 'center').dialog 'open'
  if tabName then $d.tabs active: $("#prefs-tabs-nav a[href='#prefs-tab-#{tabName}']").parent().index()
  for t in tabImpls then t.load?()
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
  ['zoom',                  0]
]
.forEach ([k, d]) ->       # k: preference name, d: default value
  t = typeof d; l = []     # t: type, l: listeners
  str = if t == 'object' then JSON.stringify else (x) -> '' + x
  sd = str d               # sd: default value "d" converted to a string
  prefs[k] = p = (x) ->
    if typeof x == 'function'
      l.push x; return
    else if arguments.length
      if t == 'number' then x = +x else if t == 'string' then x = '' + x # coerce to type "t"
      sx = str x # sx: "x" converted to a string; localStorage values can only be strings
      if l.length then old = prefs[k]()
      if sx == sd then delete localStorage[k] else localStorage[k] = sx # avoid recording if it's at its default
      for f in l then f x, old # notify listeners
      x
    else
      if !(r = localStorage[k])? then d
      else if t == 'number' then +r
      else if t == 'object' then JSON.parse r
      else r
  p.getDefault = -> d
  p.toggle = -> p !p()
  return
