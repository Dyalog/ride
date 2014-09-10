jQuery ($) ->
  debug = 1

  socket = io()

  if debug
    {emit, onevent} = socket
    socket.emit = (a...) -> console.info 'send:' + JSON.stringify(a)[..1000]; emit.apply socket, a
    socket.onevent = (packet) -> console.info 'recv:' + JSON.stringify(packet.data)[..1000]; onevent.apply socket, [packet]

  winInfos = {}
  editorWin = null
  ed = DyalogEditor '#editor',
    close: -> socket.emit 'close', editorWin
    save: (s) -> socket.emit 'save', editorWin, (winInfos[editorWin].text = s)

  socket.on 'title', (s) ->
    $('title').text s

  socket.on 'add', (s) ->
    l = cm.lineCount() - 1
    cm.replaceRange s, {line: l, ch: 0}, {line: l, ch: cm.getLine(l).length}, 'Dyalog'
    cm.setCursor cm.lineCount() - 1, 0

  socket.on 'prompt', ->
    l = cm.lineCount() - 1
    cm.replaceRange '      ', {line: l, ch: 0}, {line: l, ch: cm.getLine(l).length}, 'Dyalog'
    cm.setCursor l, 6

  socket.on 'open', (name, text, token) ->
    layout.open 'east'
    winInfos[token] = {name, text}
    if editorWin? then winInfos[editorWin].text = ed.getValue()
    editorWin = token
    ed.open name, text

  socket.on 'close', (win) ->
    delete winInfos[win]
    for win, v of winInfos then break
    if v
      editorWin = win
      ed.open v.name, v.text
    else
      editorWin = null
      layout.close 'east'

  socket.on 'focus', (win) ->
    if win then ed.focus() else cm.focus()

  # keep track of which lines have been modified and preserve the original content
  mod = {} # line number -> original content

  cm = CodeMirror document.getElementById('session'),
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

  # language bar
  $('#lbar').append(
    '← +-×÷*⍟⌹○!? |⌈⌊⊥⊤⊣⊢ =≠≤<>≥≡≢ ∨∧⍱⍲ ↑↓⊂⊃⌷⍋⍒ ⍳⍷∪∩∊~ /\\⌿⍀ ,⍪⍴⌽⊖⍉ ¨⍨⍣.∘⍤ ⍞⎕⍠⌸⍎⍕ ⋄⍝→⍵⍺∇& ¯⍬'
      .replace /\S+/g, (g) ->
        """<span class="group">#{g.replace /(.)/g, '<span class="glyph">$1</span>'}</span>"""
  )
  $('#lbar').on 'mousedown', -> false
  $('.glyph', '#lbar').on 'mousedown', (e) ->
    ch = $(e.target).text()
    if cm.hasFocus() then c = cm.getCursor(); cm.replaceRange ch, c, c, 'Dyalog'
    else if ed.hasFocus() then ed.insert ch
    false
  $('#lbar-close').on 'click', -> layout.close 'north'; false

  # tooltips
  ttid = null # tooltip timeout id
  $('.glyph', '#lbar').on 'mouseover focus', (e) ->
    clearTimeout ttid
    ttid = setTimeout(
      ->
        ttid = null
        $t = $ e.target; p = $t.position(); x = $t.text()
        h = help[x] or [x, '']
        $('#tip-desc').text h[0]
        $('#tip-text').text h[1]
        $('#tip').css(left: p.left - 21, top: p.top + $t.height() + 2).show()
      500
    )
  $('.glyph', '#lbar').on 'mouseout blur', ->
    clearTimeout ttid; ttid = null; $('#tip').hide()

  layout = $('body').layout
    defaults: enableCursorHotkey: 0
    north: resizable: 0, togglerLength_closed: '100%', togglerTip_closed: 'Show Language Bar', spacing_open: 0
    east: spacing_closed: 0, size: '50%', resizable: 1, togglerClass: 'hidden'
    center: onresize: ->
      console.info 'resized'
      cm.setSize $('#session').width(), $('#session').height()
      ed.updateSize()
  layout.close 'east' # "east:{initOpen:false}" doesn't work---the resizer doesn't get rendered

  if debug then $.extend window, {socket, cm, layout}
