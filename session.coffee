DyalogSession = (e) ->

  # keep track of which lines have been modified and preserve the original content
  mod = {} # line number -> original content

  cm = CodeMirror ($e = $ e)[0],
    autofocus: true
    mode: ''
    extraKeys:
      'Enter': ->
        a = [] # pairs of [lineNumber, contentToExecute]
        for l, s of mod # l: line number, s: original content
          l = +l
          cm.removeLineClass l, 'background', 'modified'
          a.push [l, (e = cm.getLine l)]
          cm.replaceRange s, {line: l, ch: 0}, {line: l, ch: e.length}, 'Dyalog'
        if !a.length
          socket.emit 'exec', cm.getLine(cm.getCursor().line) + '\n'
        else
          a.sort (x, y) -> x[0] - y[0]
          for [l, e] in a then socket.emit 'exec', e + '\n'
        mod = {}
      'Shift-Enter': ->
        c = cm.getCursor()
        socket.emit 'edit', cm.getLine(c.line), c.ch

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
