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
  ['keyboardLocale',        ''] # e.g. "US", "GB"
  ['lineNumbersInDebugger', 0]
  ['lineNumbersInEditor',   1]
  ['menu',                  '''
    # _x   access key, alt+x
    # =CMD command code; some are special:
    #        LBR FLT WRP TOP render as checkboxes
    #        THM ("Theme") renders its own submenu
    # =http://example.com/  open a URL
    # {}   conditional display, a boolean expression
    #        operators: && || ! ( )
    #        variables: browser mac
    # -    separator (when alone)
    # #    comment
    Dyalog                          {mac}
      _About Dyalog            =ABT
      -
      Preferences              =PRF
    _File                           {!browser}
      _Connect...              =CNC
      New _Session             =NEW
      -                             {!mac}
      _Quit                    =QIT {!mac}
    _Edit                           {!mac}
      Preferences              =PRF {!mac}
    _View
      Show Language Bar        =LBR
      Float New Editors        =FLT
      Line Wrapping in Session =WRP
      Editors on Top           =TOP {!browser}
      -                             {!browser}
      Zoom _In                 =ZMI {!browser}
      Zoom _Out                =ZMO {!browser}
      _Reset Zoom              =ZMR {!browser}
      -
      Theme                    =THM
    _Actions
      Presentation                  {!browser}
        Run Demo Script...     =DMR {!browser}
        Next Line of Demo      =DMN {!browser}
        Previous Line of Demo  =DMP {!browser}
      -                             {!browser}
      Weak Interrupt           =WI
      Strong Interrupt         =SI
    _Help
      _About                   =ABT {!mac}
      -                             {!mac}
      Dyalog Help              =http://help.dyalog.com/
      Documentation Centre     =http://dyalog.com/documentation.htm
      -
      Dyalog Website           =http://dyalog.com/
      MyDyalog                 =http://my.dyalog.com/
      -
      Dyalog Forum             =http://www.dyalog.com/forum
  ''']
  ['prefixKey',             '`']
  ['prefixMap',             ''] # pairs of characters; only differences from the default ` map are stored
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
