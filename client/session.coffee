autocompletion = require './autocompletion.coffee'
module.exports = (e, opts = {}) ->

  # keep track of which lines have been modified and preserve the original content
  mod = {} # line number -> original content

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

  ED = -> c = cm.getCursor(); opts.edit?(cm.getLine(c.line), c.ch); return # Edit
  BK = -> histMove 1; return # Backward or Undo
  FD = -> histMove -1; return # Forward or Redo
  QT = EP = -> # QT: Quit (and lose changes), EP: Exit (and save changes)
    c = cm.getCursor(); l = c.line
    if mod[l]?
      cm.replaceRange mod[l], {line: l, ch: 0}, {line: l, ch: cm.getLine(l).length}, 'D'
      delete mod[l]; cm.removeLineClass l, 'background', 'modified'; cm.setCursor l + 1, c.ch
    return

  cm = CodeMirror ($e = $ e)[0],
    autofocus: true, mode: '', lineWrapping: true, matchBrackets: true, autoCloseBrackets: true, readOnly: true, keyMap: 'dyalog',
    extraKeys:
      Tab: -> c = cm.getCursor(); opts.autocomplete? cm.getLine(c.line), c.ch
      Enter: -> exec 0
      'Ctrl-Enter': -> exec 1
      "'\uf800'": QT,   'Shift-Esc':            QT
      "'\uf804'": EP,   Esc:                    EP
      "'\uf81f'": FD,   'Shift-Ctrl-Enter':     FD
      "'\uf820'": BK,   'Shift-Ctrl-Backspace': BK
      "'\uf828'": ED,   'Shift-Enter':          ED

  exec = (trace) ->
    a = [] # pairs of [lineNumber, contentToExecute]
    for l, s of mod # l: line number, s: original content
      l = +l; cm.removeLineClass l, 'background', 'modified'; a.push [l, (e = cm.getLine l)]
      cm.replaceRange s, {line: l, ch: 0}, {line: l, ch: e.length}, 'D'
    if !a.length then a = [[(l = cm.getCursor().line), cm.getLine l]]
    a.sort((x, y) -> x[0] - y[0]); es = (for [_, e] in a when e then e); opts.exec? es, trace; mod = {}; histAdd es; return

  cm.on 'beforeChange', (_, c) ->
    if c.origin != 'D'
      if (l = c.from.line) != c.to.line || c.text.length > 1
        c.cancel(); $.alert 'Cannot make changes across multiple lines in session', 'Error'
      else
        mod[l] ?= cm.getLine l; cm.addLineClass l, 'background', 'modified'
    return

  add: (s) ->
    l = cm.lineCount() - 1; s0 = cm.getLine l
    cm.replaceRange (if cm.getOption 'readOnly' then s0 + s else s), {line: l, ch: 0}, {line: l, ch: s0.length}, 'D'
    cm.setCursor cm.lineCount() - 1, 0
    return

  noPrompt: ->
    cm.setOption 'readOnly', true
    cm.setOption 'cursorHeight', 0
    return

  prompt: (why) -> # 0=Invalid 1=Descalc 2=QuadInput 3=LineEditor 4=QuoteQuadInput 5=Prompt
    cm.setOption 'readOnly', false
    cm.setOption 'cursorHeight', 1
    l = cm.lineCount() - 1
    if (why == 1 && !mod[l]) || why !in [1, 4]
      cm.replaceRange '      ', {line: l, ch: 0}, {line: l, ch: cm.getLine(l).length}, 'D'
    cm.setCursor l, cm.getLine(l).length
    return

  updateSize: -> cm.setSize $e.width(), $e.height()
  hasFocus: -> cm.hasFocus()
  focus: -> cm.focus()
  insert: (ch) -> (if !cm.getOption 'readOnly' then c = cm.getCursor(); cm.replaceRange ch, c, c, 'D'); return
  scrollCursorIntoView: -> setTimeout (-> cm.scrollIntoView cm.getCursor()), 1
  autocomplete: autocompletion cm, opts.autocomplete
  die: -> cm.setOption 'readOnly', true; return
