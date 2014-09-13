socket = io()

debug = 1
if debug
  t0 = +new Date
  log = (s, a...) -> console.info (new Date - t0).toFixed(3) + ' ' + s, a...
  {emit, onevent} = socket
  socket.emit = (a...) -> log 'send:' + JSON.stringify(a)[..1000]; emit.apply socket, a
  socket.onevent = (packet) -> log ' recv:' + JSON.stringify(packet.data)[..1000]; onevent.apply socket, [packet]

timeout = (delay, f) -> setTimeout f, delay

jQuery ($) ->
  winInfos = {}
  editorWin = null
  debuggerWin = null

  ed = DyalogEditor '#editor',
    save: (s, bs) -> socket.emit 'save', editorWin, (winInfos[editorWin].text = s), bs
    close: -> socket.emit 'close', editorWin

  db = DyalogEditor '#debugger',
    debugger: true
    save:   (s, bs) -> socket.emit 'save',           debuggerWin, (winInfos[debuggerWin].text = s), bs
    close:          -> socket.emit 'close',          debuggerWin
    over:           -> socket.emit 'over',           debuggerWin
    into:           -> socket.emit 'into',           debuggerWin
    back:           -> socket.emit 'back',           debuggerWin
    skip:           -> socket.emit 'skip',           debuggerWin
    continueTrace:  -> socket.emit 'continueTrace',  debuggerWin
    continueExec:   -> socket.emit 'continueExec',   debuggerWin
    restartThreads: -> socket.emit 'restartThreads', debuggerWin
    interrupt:      -> socket.emit 'interrupt'
    cutback:        -> socket.emit 'cutback',        debuggerWin

  session = DyalogSession '#session',
    edit: (s, i) -> socket.emit 'edit', s, i
    exec: (lines, trace) -> (for s in lines then socket.emit 'exec', s + '\n', +!!trace); return
    autocomplete: (s, i) -> socket.emit 'autocomplete', s, i, 0

  socket.on 'title', (s) -> $('title').text s
  socket.on 'add', (s) -> session.add s
  socket.on 'prompt', -> session.prompt()
  socket.on 'focus', (win) -> if win == debuggerWin then db.focus() else if win then ed.focus() else session.focus()

  socket.on 'open', (name, text, token, bugger, breakpoints) ->
    winInfos[token] = {name, text}
    if bugger
      layout.open 'south'
      if debuggerWin? then winInfos[debuggerWin].text = db.getValue()
      debuggerWin = token
      db.open name, text, breakpoints
      winInfos[token] = db
    else
      layout.open 'east'
      if editorWin? then winInfos[editorWin].text = ed.getValue()
      editorWin = token
      ed.open name, text, breakpoints
      winInfos[token] = ed
    session.scrollCursorIntoView()

  socket.on 'close', (win) ->
    delete winInfos[win]
    if win == debuggerWin
      debuggerWin = null
      layout.close 'south'
    for win, v of winInfos then break
    if v
      editorWin = win
      ed.open v.name, v.text
    else
      editorWin = null
      layout.close 'east'
    session.scrollCursorIntoView()

  socket.on 'autocomplete', (token, skip, options) -> if token == 0 then session.autocomplete skip, options
  socket.on 'highlight', (win, line) ->
    if win == editorWin then ed.highlight line
    else if win == debuggerWin then db.highlight line

  layout = $('body').layout
    defaults: enableCursorHotkey: 0
    north: resizable: 0, togglerLength_closed: '100%', togglerTip_closed: 'Show Language Bar', spacing_open: 0
    east:  spacing_closed: 0, size: '50%', resizable: 1, togglerClass: 'hidden', initClosed: true, togglerLength_open: 0
    south: spacing_closed: 0, size: '50%', resizable: 1, togglerClass: 'hidden', initClosed: true, togglerLength_open: 0
    center: onresize: -> (for x in [session, ed, db] then x.updateSize()); return

  session.updateSize()

  # language bar
  timeout 2000, ->
    $('#lbar').on 'mousedown', -> false
    $('b', '#lbar').on 'mousedown', (e) -> for x in [session, ed] when x.hasFocus() then x.insert $(e.target).text(); false
    $('#lbar-close').on 'click', -> layout.close 'north'; false
    ttid = null # tooltip timeout id
    $tip = $ '#tip'; $tipDesc = $ '#tip-desc'; $tipText = $ '#tip-text'; $tipTriangle = $ '#tip-triangle'
    $('b', '#lbar').on
      mouseout: -> clearTimeout ttid; ttid = null; $tip.hide(); $tipTriangle.hide(); return
      mouseover: (e) ->
        clearTimeout ttid
        ttid = timeout 200, ->
          ttid = null
          $t = $ e.target; p = $t.position(); x = $t.text()
          h = lbarTips[x] or [x, '']; $tipDesc.text h[0]; $tipText.text h[1]
          $tipTriangle.css(left: 3 + p.left + ($t.width() - $tipTriangle.width()) / 2, top: p.top + $t.height() + 2).show()
          x0 = p.left - 21
          x1 = x0 + $tip.width()
          y0 = p.top + $t.height()
          if x1 > $(document).width()
            $tip.css(left: '', right: 0, top: y0).show()
          else
            $tip.css(left: Math.max(0, x0), right: '', top: y0).show()
        return
