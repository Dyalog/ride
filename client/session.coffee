Dyalog.Session = (e, opts = {}) ->

  # keep track of which lines have been modified and preserve the original content
  mod = {} # line number -> original content

  hist = [null]
  histLimit = 100
  histIndex = 0
  histAdd = (lines) -> hist = [null].concat lines, hist[1..]
  histMove = (d) ->
    i = histIndex + d
    if i < 0 then alert 'There is no next line'
    else if i >= hist.length then alert 'There is no previous line'
    else
      l = cm.getCursor().line
      if !histIndex then hist[0] = cm.getLine l
      cm.replaceRange hist[i], {line: l, ch: 0}, {line: l, ch: cm.getLine(l).length}, 'Dyalog'
      histIndex = i
    return

  cm = CodeMirror ($e = $ e)[0],
    autofocus: true, mode: '', matchBrackets: true, autoCloseBrackets: true, keyMap: 'dyalog', readOnly: true
    extraKeys:
      Tab: -> c = cm.getCursor(); opts.autocomplete? cm.getLine(c.line), c.ch
      'Shift-Enter': -> c = cm.getCursor(); opts.edit?(cm.getLine(c.line), c.ch)
      Enter: -> exec 0
      'Ctrl-Enter': -> exec 1
      "'\uf820'": -> histMove 1
      "'\uf81f'": -> histMove -1
      'Shift-Ctrl-Backspace': -> histMove 1
      'Shift-Ctrl-Enter': -> histMove -1
      Esc: revertLine = ->
        l = cm.getCursor().line
        if mod[l]?
          cm.replaceRange mod[l], {line: l, ch: 0}, {line: l, ch: cm.getLine(l).length}, 'Dyalog'
          delete mod[l]
          cm.removeLineClass l, 'background', 'modified'
        return
      'Shift-Esc': revertLine

  exec = (trace) ->
    a = [] # pairs of [lineNumber, contentToExecute]
    for l, s of mod # l: line number, s: original content
      l = +l
      cm.removeLineClass l, 'background', 'modified'
      a.push [l, (e = cm.getLine l)]
      cm.replaceRange s, {line: l, ch: 0}, {line: l, ch: e.length}, 'Dyalog'
    if !a.length then a = [[(l = cm.getCursor().line), cm.getLine l]]
    a.sort (x, y) -> x[0] - y[0]
    opts.exec? (es = for [l, e] in a then e), trace
    histAdd es
    mod = {}

  cm.on 'beforeChange', (_, c) ->
    if c.origin != 'Dyalog'
      if (l = c.from.line) != c.to.line
        c.cancel()
      else
        mod[l] ?= cm.getLine l
        cm.addLineClass l, 'background', 'modified'
    return

  add: (s) ->
    l = cm.lineCount() - 1
    cm.replaceRange s, {line: l, ch: 0}, {line: l, ch: cm.getLine(l).length}, 'Dyalog'
    cm.setCursor cm.lineCount() - 1, 0

  set: (s) ->
    l = cm.lineCount() - 1
    cm.replaceRange s, {line: 0, ch: 0}, {line: l, ch: cm.getLine(l).length}, 'Dyalog'
    cm.setCursor cm.lineCount() - 1, 0

  noPrompt: ->
    cm.setOption 'readOnly', true
    cm.setOption 'cursorHeight', 0
    return

  prompt: (why) -> # 0=Invalid 1=Descalc 2=QuadInput 3=LineEditor 4=QuoteQuadInput 5=Prompt
    cm.setOption 'readOnly', false
    cm.setOption 'cursorHeight', 1
    l = cm.lineCount() - 1
    cm.replaceRange (if why == 4 then '' else '      '), {line: l, ch: 0}, {line: l, ch: cm.getLine(l).length}, 'Dyalog'
    cm.setCursor l, 6
    return

  updateSize: -> cm.setSize $e.width(), $e.height()
  hasFocus: -> cm.hasFocus()
  focus: -> cm.focus()
  insert: (ch) -> c = cm.getCursor(); cm.replaceRange ch, c, c, 'Dyalog'
  autocomplete: (skip, options) ->
    c = cm.getCursor()
    cm.showHint completeOnSingleClick: true, hint: ->
      list: options, from: {line: c.line, ch: c.ch - skip}, to: c
  scrollCursorIntoView: -> setTimeout (-> cm.scrollIntoView cm.getCursor()), 1
