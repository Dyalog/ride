autocompletion = require './autocompletion'
module.exports = (e, opts = {}) ->

  dirty = {} # modified lines: line number -> original content
             # inserted lines: line number -> 0

  # history management ("session log"):
  hist = ['']
  histIndex = 0
  histAdd = (lines) -> hist[0] = ''; hist[1...1] = lines; histIndex = 0; return
  histMove = (d) ->
    i = histIndex + d
    if i < 0 then $.alert 'There is no next line', 'Dyalog APL Error'
    else if i >= hist.length then $.alert 'There is no previous line', 'Dyalog APL Error'
    else
      l = cm.getCursor().line
      if !histIndex then hist[0] = cm.getLine l
      cm.replaceRange hist[i], {line: l, ch: 0}, {line: l, ch: cm.getLine(l).length}, 'D'
      histIndex = i
    return

  cm = CodeMirror ($e = $ e)[0],
    autofocus: true, mode: '', matchBrackets: true, autoCloseBrackets: {pairs: '()[]{}', explode: '{}'}
    readOnly: true, keyMap: 'dyalog', lineWrapping: !!localStorage.sessionLineWrapping
    extraKeys: Tab: -> (if promptWhy != 4 then c = cm.getCursor(); opts.autocomplete? cm.getLine(c.line), c.ch); return # don't autocomplete in ⍞ input

  cm.dyalogCommands =
    ED: -> c = cm.getCursor(); opts.edit?(cm.getLine(c.line), c.ch); return # Edit
    BK: -> histMove 1; return # Backward or Undo
    FD: -> histMove -1; return # Forward or Redo
    QT: QT = -> # Quit (and lose changes)
      c = cm.getCursor(); l = c.line
      if dirty[l] == 0
        if l == cm.lineCount() - 1
          cm.replaceRange '', {line: l - 1, ch: cm.getLine(l - 1).length}, {line: l, ch: cm.getLine(l).length}, 'D'
        else
          cm.replaceRange '', {line: l, ch: 0}, {line: l + 1, ch: 0}, 'D'
        delete dirty[l]; h = dirty; dirty = {}; for x, y of h then dirty[x - (x > l)] = y
      else if dirty[l]?
        cm.replaceRange dirty[l], {line: l, ch: 0}, {line: l, ch: cm.getLine(l).length}, 'D'
        delete dirty[l]; cm.removeLineClass l, 'background', 'modified'; cm.setCursor l + 1, c.ch
      return
    EP: QT # Exit (and save changes); in this case we are deliberately making QT and EP the same; Esc is an easier shortcut to discover than Shift-Esc
    ER: -> exec 0 # Enter
    TC: -> exec 1 # Trace

  exec = (trace) ->
    ls = for l of dirty then +l
    if ls.length
      ls.sort (x, y) -> x - y
      es = ls.map (l) -> cm.getLine l # strings to execute
      ls.reverse().forEach (l) ->
        cm.removeLineClass l, 'background', 'modified'
        if dirty[l] == 0
          cm.replaceRange '', {line: l, ch: 0}, {line: l + 1, ch: 0}, 'D'
        else
          cm.replaceRange dirty[l], {line: l, ch: 0}, {line: l, ch: cm.getLine(l).length}, 'D'
        return
    else
      es = [cm.getLine cm.getCursor().line]
    opts.exec es, trace; dirty = {}; histAdd es; return

  # CodeMirror supports 'dblclick' events but they are unreliable and seem to require rather a short time between the two clicks
  # So, let's track clicks manually:
  lct = lcx = lcy = 0 # last click's timestamp, x, and y
  cm.on 'mousedown', (cm, e) ->
    if e.timeStamp - lct < 400 && Math.abs(lcx - e.x) + Math.abs(lcy - e.y) < 10 then cm.execCommand 'ED'
    lct = e.timeStamp; lcx = e.x; lcy = e.y; return

  cm.on 'beforeChange', (_, c) ->
    if c.origin != 'D'
      l0 = c.from.line; l1 = c.to.line; m = l1 - l0 + 1; n = c.text.length
      if n < m then c.update c.from, c.to, c.text.concat(for [0...m - n] then ''); n = m # pad shrinking changes with empty lines
      if m < n then h = dirty; dirty = {}; for x, y of h then dirty[x + (n - m) * (x > l1)] = y
      l = l0
      while l <= l1    then dirty[l] ?= cm.getLine l; l++
      while l < l0 + n then dirty[l] = 0;             l++
    return

  cm.on 'change', (_, c) ->
    if c.origin != 'D'
      l0 = c.from.line; l1 = c.to.line; m = l1 - l0 + 1; n = c.text.length
      for l of dirty then cm.addLineClass +l, 'background', 'modified'
    return

  promptWhy = 0 # 0=Invalid 1=Descalc 2=QuadInput 3=LineEditor 4=QuoteQuadInput 5=Prompt

  add: (s) ->
    l = cm.lineCount() - 1; s0 = cm.getLine l
    cm.replaceRange (if cm.getOption 'readOnly' then s0 + s else s), {line: l, ch: 0}, {line: l, ch: s0.length}, 'D'
    cm.setCursor cm.lineCount() - 1, 0; return

  prompt: (why) ->
    promptWhy = why; cm.setOption 'readOnly', false; cm.setOption 'cursorHeight', 1; l = cm.lineCount() - 1
    if (why == 1 && !dirty[l]?) || why !in [1, 4]
      cm.replaceRange '      ', {line: l, ch: 0}, {line: l, ch: cm.getLine(l).length}, 'D'
    cm.setCursor l, cm.getLine(l).length; return

  noPrompt: -> promptWhy = 0; cm.setOption 'readOnly', true; cm.setOption 'cursorHeight', 0; return
  updateSize: -> cm.setSize $e.width(), $e.height()
  hasFocus: -> cm.hasFocus()
  focus: -> cm.focus()
  insert: (ch) -> (if !cm.getOption 'readOnly' then c = cm.getCursor(); cm.replaceRange ch, c, c); return
  scrollCursorIntoView: scrollCursorIntoView = -> setTimeout (-> cm.scrollIntoView cm.getCursor()), 1
  autocomplete: autocompletion cm, (s, i) -> (if promptWhy != 4 then opts.autocomplete s, i); return # don't autocomplete in ⍞ input
  die: -> cm.setOption 'readOnly', true; return
  getLineWrapping: -> cm.getOption 'lineWrapping'
  setLineWrapping: (x) ->
    if x then localStorage.sessionLineWrapping = '1' else delete localStorage.sessionLineWrapping
    cm.setOption 'lineWrapping', !!x; scrollCursorIntoView(); return
