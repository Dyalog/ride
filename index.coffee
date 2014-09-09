jQuery ($) ->
  debug = 1

  socket = io()

  if debug
    {emit, onevent} = socket
    socket.emit = (a...) -> console.info 'send:' + JSON.stringify(a)[..1000]; emit.apply socket, a
    socket.onevent = (packet) -> console.info 'recv:' + JSON.stringify(packet.data)[..1000]; onevent.apply socket, [packet]

  winInfos = {}
  editorWin = null

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
    if editorWin? then winInfos[editorWin].text = cme.getValue()
    editorWin = token
    cme.setValue text
    cme.setCursor 0, cme.getLine(0).length
    cme.focus()

  socket.on 'close', (win) ->
    delete winInfos[win]
    for win, v of winInfos then break
    if v
      editorWin = win
      cme.setValue v.text
    else
      editorWin = null
      layout.close 'east'

  socket.on 'focus', (win) ->
    if win then cme.focus() else cm.focus()

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

  cme = CodeMirror document.getElementById('editor'),
    lineNumbers: true
    firstLineNumber: 0
    lineNumberFormatter: (i) -> "[#{i}]"
    extraKeys:
      'Esc': saveAndCloseEditor = ->
        s = winInfos[editorWin].text = cme.getValue()
        socket.emit 'save', editorWin, s
        socket.emit 'close', editorWin
      'Shift-Esc': closeEditor = ->
        socket.emit 'close', editorWin
      'Ctrl-Up': ->
        c = cme.getCursor()
        s = cme.getLine c.line
        r = '[A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ0-9]*' # regex fragment to match identifiers
        name = ((///⎕?#{r}$///.exec(s[...c.ch])?[0] ? '') +
                (///^#{r}///.exec(s[c.ch..])?[0] ? ''))
                  .replace /^\d+/, ''
        if name and name[0] != '⎕'
          h = cme.getLine 0 # header line
          h1 = h.replace ///;#{name}(;|$)///, '$1'
          cme.replaceRange (if h == h1 then h1 += ';' + name else h1),
            {line: 0, ch: 0}, {line: 0, ch: h.length}, 'Dyalog'

  # language bar
  $('#lbar').append(
    '← +-×÷*⍟⌹○!? |⌈⌊⊥⊤⊣⊢ =≠≤<>≥≡≢ ∨∧⍱⍲ ↑↓⊂⊃⌷⍋⍒ ⍳⍷∪∩∊~ /\\⌿⍀ ,⍪⍴⌽⊖⍉ ¨⍨⍣.∘⍤ ⍞⎕⍠⌸⍎⍕ ⋄⍝→⍵⍺∇& ¯⍬'
      .replace /\S+/g, (g) ->
        """<span class="group">#{g.replace /(.)/g, '<span class="glyph">$1</span>'}</span>"""
  )
  $('#lbar').on 'mousedown', -> false
  $('.glyph', '#lbar').on 'mousedown', (e) ->
    for cmi in [cm, cme] when cmi.hasFocus()
      c = cmi.getCursor()
      cmi.replaceRange $(e.target).text(), c, c, 'Dyalog'
      break
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
      cme.setSize $('#editor').width(), $('#editor').height()
  layout.close 'east' # "east:{initOpen:false}" doesn't work---the resizer doesn't get rendered

  $('#editor-container').layout
    defaults: enableCursorHotkey: 0
    north: resizable: 0, spacing_open: 0

  $('.button', '#editor-toolbar')
    .on('mousedown', (e) -> $(e.target).addClass 'armed'; e.preventDefault(); return)
    .on('mouseup mouseout', (e) -> $(e.target).removeClass 'armed'; e.preventDefault(); return)

  $('#b-line-numbers').click -> cme.setOption 'lineNumbers', b = !cme.getOption 'lineNumbers'; $(@).toggleClass 'pressed', !b; false
  $('#b-save').click -> saveAndCloseEditor(); false

  $('#b-comment').click ->
    a = cme.listSelections()
    cme.replaceSelections cme.getSelections().map (s) -> s.replace(/^/gm, '⍝').replace /\n⍝$/, '\n'
    cme.setSelections a
    false

  $('#b-uncomment').click ->
    a = cme.listSelections()
    cme.replaceSelections cme.getSelections().map (s) -> s.replace /^⍝/gm, ''
    cme.setSelections a
    false

  $('#b-hid, #b-case').click -> $(@).toggleClass 'pressed'; false
  $('#b-next').click -> search(); false
  $('#b-prev').click -> search true; false
  $('#search').keydown (e) -> if e.which == 13 then search(); false

  $('#b-refac-m').click ->
    l = cme.getCursor().line
    s = cme.getLine l
    if !/^\s*$/.test s
      cme.replaceRange "∇ #{s}\n\n∇", {line: l, ch: 0}, {line: l, ch: s.length}, 'Dyalog'
      cme.setCursor line: l + 1, ch: 0

  $('#b-refac-f').click ->
    l = cme.getCursor().line
    s = cme.getLine l
    if !/^\s*$/.test s
      cme.replaceRange ":field public #{s}", {line: l, ch: 0}, {line: l, ch: s.length}, 'Dyalog'
      cme.setCursor line: l + 1, ch: 0

  $('#b-refac-p').click ->
    l = cme.getCursor().line
    s = cme.getLine l
    if !/^\s*$/.test s
      cme.replaceRange ":Property #{s}\n\n∇r←get\nr←0\n∇\n\n∇set args\n∇\n:EndProperty", {line: l, ch: 0}, {line: l, ch: s.length}, 'Dyalog'
      cme.setCursor line: l + 1, ch: 0

  search = (backwards) ->
    if q = $('#search').val()
      v = cme.getValue()
      if !$('#b-case').hasClass 'pressed' then q = q.toLowerCase(); v = v.toLowerCase()
      i = cme.indexFromPos cme.getCursor()
      if backwards
        if (j = v[...i - 1].lastIndexOf q) < 0 then j = v.lastIndexOf q; wrapped = true
      else
        if (j = v[i..].indexOf q) >= 0 then j += i else j = v.indexOf q; wrapped = true
      if j < 0
        alert 'No Match'
      else
        if wrapped then alert 'Search wrapping'
        cme.setSelections [anchor: cme.posFromIndex(j), head: cme.posFromIndex j + q.length]
    false

  if debug then $.extend window, {socket, cm, cme, layout}
