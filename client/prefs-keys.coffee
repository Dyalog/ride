prefs = require './prefs'
{esc, join} = require './util'

@name = 'Keys'

CMDS = @CMDS = [
#  code   description                 defaults                   important? (shown in kbd btn's tooltip)
  ['QT',  'Quit (and lose changes)',  ['Shift-Esc'],             1]
  ['TB',  'Tab between windows',      ['Ctrl-Tab'],              1]
  ['BT',  'Back Tab between windows', ['Shift-Ctrl-Tab'],        1]
  ['EP',  'Exit (and save changes)',  ['Esc'],                   1]
  ['FD',  'Forward or Redo',          ['Shift-Ctrl-Enter'],      1]
  ['BK',  'Backward or Undo',         ['Shift-Ctrl-Backspace'],  1]
  ['SC',  'Search (in editors)',      ['Ctrl-F'],                1]
  ['RP',  'Replace (in editors)',     ['Ctrl-G'],                1]
  ['ED',  'Edit',                     ['Shift-Enter', 'Ctrl-E'], 1]
  ['TC',  'Trace',                    ['Ctrl-Enter'],            1]
  ['TL',  'Toggle localisation',      ['Ctrl-Up'],               1]
  ['ER',  'Execute line',             ['Enter']]
  ['WI',  'Weak interrupt',           ['Ctrl-Pause']]
  ['SI',  'Strong interrupt',         []]
  ['PRF', 'Show preferences',         ['Ctrl-P']]
  ['NEW', 'New session',              ['Ctrl-N']]
  ['CNC', 'Connect',                  []]
  ['QIT', 'Quit',                     ['Ctrl-Q']]
  ['HLP', 'Help',                     ['F1']]
  ['ABT', 'About',                    ['Shift-F1']]
  ['BP',  'Toggle breakpoint',        ['Ctrl-B']]
  ['AO',  'Add comments',             []]
  ['DO',  'Delete comments',          []]
  ['AC',  'Align comments',           []]
  ['LN',  'Toggle line numbers',      []]
  ['DMR', 'Load demo file',           []]
  ['DMN', 'Next line in demo',        ['Ctrl-Shift-N']]
  ['DMP', 'Previous line in demo',    ['Ctrl-Shift-P']]
  ['DMK', 'Toggle key display mode',  ['Ctrl-Shift-K']]
]

keyHTML = (k) -> "<span><span class=keys-text>#{k}</span><a href=# class=keys-del>×</a></span> "

@init = ($e) ->
  $e.html """
    <div><input id=keys-search placeholder=Search></div>
    <div id=keys-table-wrapper>
      <table>#{join CMDS.map ([code, desc]) ->
        "<tr><td>#{desc}<td class=keys-code>#{code}<td id=keys-#{code}>"
      }</table>
    </div>
    <div id=keys-no-results style=display:none>No results</div>
  """
    .on 'mouseover', '.keys-del', -> $(@).parent().addClass    'keys-del-hover'; return
    .on 'mouseout',  '.keys-del', -> $(@).parent().removeClass 'keys-del-hover'; return
    .on 'click', '.keys-del', -> $(@).parent().remove(); updateDups(); false
    .on 'click', '.keys-add', ->
      $b = $ @; getKeystroke (k) -> k && $b.parent().append(keyHTML k).append $b; updateDups(); return
      false
  $('#keys-search').on 'keyup change', ->
    q = @value.toLowerCase()
    found = 0
    $('#keys-table-wrapper tr').each ->
      $(@).toggle x = 0 <= $(@).text().toLowerCase().indexOf q
      found ||= x; return
    $('#keys-no-results').toggle !found
    return
  return

getKeystroke = (callback) ->
  $d = $ '<p><input class=keys-input placeholder=...>'
    .dialog title: 'New Key', modal: 1, buttons: Cancel: -> $d.dialog 'close'; callback k; return
  $ 'input', $d
    .focus -> $(@).addClass    'keys-input'; return
    .blur  -> $(@).removeClass 'keys-input'; return
    .on 'keypress keyup', (e) ->
      kn = CodeMirror.keyNames[e.which] || ''
      if kn in ['Shift', 'Ctrl', 'Alt']
        $(@).val (e.shiftKey && 'Shift-' || '') +
                 (e.ctrlKey  && 'Ctrl-'  || '') +
                 (e.altKey   && 'Alt-'   || '')
      else
        $d.dialog 'close'; callback @value
      false
    .keydown (e) ->
      kn = CodeMirror.keyNames[e.which] || ''
      if kn in ['Shift', 'Ctrl', 'Alt'] then kn = ''
      $(@).val (e.shiftKey && 'Shift-' || '') +
               (e.ctrlKey  && 'Ctrl-'  || '') +
               (e.altKey   && 'Alt-'   || '') +
               kn
      false
  return

@load = ->
  h = prefs.keys()
  for [code, desc, defaults] in CMDS
    $ "#keys-#{code}"
      .html join (h[code] || defaults).map keyHTML
      .append '<a href=# class=keys-add>+</a>'
  updateDups()
  return

@save = ->
  h = {}
  for [c, _, d] in CMDS
    a = $("#keys-#{c} .keys-text").map(-> $(@).text()).toArray()
    if JSON.stringify(a) != JSON.stringify(d) then h[c] = a
  prefs.keys h; return

prefs.keys updateKeys = (x) ->
  h = CodeMirror.keyMap.dyalog = fallthrough: 'dyalogDefault'
  for [c, _, d] in CMDS then for k in x[c] || d then h[k] = c
  return
updateKeys prefs.keys()

updateDups = ->
  h = {} # maps keystrokes to DOM objects
  for [c, _, d] in CMDS then $("#keys-#{c} .keys-text").each ->
    k = $(@).text(); if h[k] then $(@).add(h[k]).addClass 'keys-dup' else $(@).removeClass 'keys-dup'; h[k] = @
  return
