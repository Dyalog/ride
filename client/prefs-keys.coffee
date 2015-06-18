prefs = require './prefs'
{esc, join} = require './util'

@name = 'Keys'

CMDS = [
  ['QT', 'Quit (and lose changes)' ]
  ['TB', 'Tab between windows'     ]
  ['BT', 'Back Tab between windows']
  ['EP', 'Exit (and save changes)' ]
  ['FD', 'Forward or Redo'         ]
  ['BK', 'Backward or Undo'        ]
  ['SC', 'Search (in editors)'     ]
  ['RP', 'Replace (in editors)'    ]
  ['ED', 'Edit'                    ]
  ['TC', 'Trace'                   ]
  ['TL', 'Toggle localisation'     ]
]

@init = ($e) ->
  $e.html "<table>#{join CMDS.map ([code, desc]) -> "<tr><td>#{desc}<td><input id=keys-#{code}>"}</table>"
    .on 'focus', 'input', -> $(@).addClass    'focused'; return
    .on 'blur',  'input', -> $(@).removeClass 'focused'; return
    .on 'keyup keypress', 'input', -> false
    .on 'keydown', 'input', (e) ->
      kn = CodeMirror.keyNames[e.which] || ''
      if kn in ['Shift', 'Ctrl', 'Alt'] then kn = ''
      $(@).val (e.shiftKey && 'Shift-' || '') +
               (e.ctrlKey  && 'Ctrl-'  || '') +
               (e.altKey   && 'Alt-'   || '') +
               kn
      false
  return

getCodeMirrorReverseKeyMap = (name) -> # returns a mapping from command codes to keys
  h = {}; m = CodeMirror.keyMap[name]
  while m
    for k, c of m when k[0] != "'" then h[c] ?= k # ignore commands mapped to characters (as opposed to keys)
    m = m.fallthrough && CodeMirror.keyMap[m.fallthrough] # follow the "fall through" chain
  h

@load = ->
  h = $.extend prefs.keys(), getCodeMirrorReverseKeyMap 'dyalog'
  for [code] in CMDS then $("#keys-#{code}").val h[code] || ''
  return

@save = ->
  h = {}; for [c] in CMDS then k = $("#keys-#{c}").val(); if CodeMirror.keyMap.dyalogDefault[k] != c then h[c] = k
  prefs.keys h; return
