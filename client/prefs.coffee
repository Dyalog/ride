# Preferences API -- localStorage should be accessed only through it
# Usage:
#   prefs.foo()                 # getter
#   prefs.foo(123)              # setter
#   prefs.foo (newValue) -> ... # add "on change" listener
#   prefs.foo.toggle()          # convenience function for booleans (numbers 0 and 1)
#   prefs.foo.getDefault()      # retrieve default value
prefs = @
[ # name                    default (type is determined from default value; setter enforces type and handles encoding)
  ['editorsOnTop',          0]
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
