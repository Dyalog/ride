DyalogSession = (e, opts = {}) ->

  # keep track of which lines have been modified and preserve the original content
  mod = {} # line number -> original content

  cm = CodeMirror ($e = $ e)[0],
    autofocus: true
    mode: ''
    extraKeys:
      'Ctrl-Space': -> c = cm.getCursor(); opts.autocomplete? cm.getLine(c.line), c.ch
      'Shift-Enter': -> c = cm.getCursor(); opts.edit?(cm.getLine(c.line), c.ch)
      'Enter': ->
        a = [] # pairs of [lineNumber, contentToExecute]
        for l, s of mod # l: line number, s: original content
          l = +l
          cm.removeLineClass l, 'background', 'modified'
          a.push [l, (e = cm.getLine l)]
          cm.replaceRange s, {line: l, ch: 0}, {line: l, ch: e.length}, 'Dyalog'
        if !a.length
          opts.exec?([cm.getLine cm.getCursor().line])
        else
          a.sort (x, y) -> x[0] - y[0]
          opts.exec?(for [l, e] in a then e)
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

  prompt: ->
    l = cm.lineCount() - 1
    cm.replaceRange '      ', {line: l, ch: 0}, {line: l, ch: cm.getLine(l).length}, 'Dyalog'
    cm.setCursor l, 6

  updateSize: -> cm.setSize $e.width(), $e.height()
  hasFocus: -> cm.hasFocus()
  focus: -> cm.focus()
  insert: (ch) -> c = cm.getCursor(); cm.replaceRange ch, c, c, 'Dyalog'
  autocomplete: (skip, options) -> c = cm.getCursor(); cm.showHint hint: -> list: options, from: {line: c.line, ch: c.ch - skip}, to: c
