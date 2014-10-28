do ->
  socket = io()

  if localStorage?.d
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

    ed = Dyalog.Editor '#editor',
      save: (s, bs) -> socket.emit 'SaveChanges', win: editorWin, text: (winInfos[editorWin].text = s), attributes: stop: bs
      close: -> socket.emit 'CloseWindow', win: editorWin
      autocomplete: (s, i) -> socket.emit 'autocomplete', s, i, editorWin

    db = Dyalog.Editor '#debugger',
      debugger: true
      save:   (s, bs) -> socket.emit 'SaveChanges',    win: debuggerWin, text: (winInfos[debuggerWin].text = s), attributes: trace: bs
      close:          -> socket.emit 'CloseWindow',    win: debuggerWin
      over:           -> socket.emit 'RunCurrentLine', win: debuggerWin
      into:           -> socket.emit 'StepInto',       win: debuggerWin
      back:           -> socket.emit 'TraceBackward',  win: debuggerWin
      skip:           -> socket.emit 'TraceForward',   win: debuggerWin
      continueTrace:  -> socket.emit 'ContinueTrace',  win: debuggerWin
      continueExec:   -> socket.emit 'Continue',       win: debuggerWin
      restartThreads: -> socket.emit 'RestartThreads', win: debuggerWin
      interrupt:      -> socket.emit 'WeakInterrupt'
      cutback:        -> socket.emit 'Cutback',        win: debuggerWin

    session = Dyalog.Session '#session',
      edit: (s, i) -> socket.emit 'Edit', win: 0, pos: i, text: s
      exec: (lines, trace) -> (for s in lines then socket.emit 'Execute', text: (s + '\n'), trace: trace); return
      autocomplete: (s, i) -> socket.emit 'Autocomplete', line: s, pos: i, token: 0

    socket.on 'UpdateDisplayName', ({displayName}) -> $('title').text displayName
    socket.on 'EchoInput', ({input}) -> session.add input
    socket.on 'AppendSessionOutput', ({result}) -> session.add result
    socket.on 'NotAtInputPrompt', -> session.prompt null
    socket.on 'AtInputPrompt', (why) -> session.prompt why
    socket.on 'FocusWindow', ({win}) -> if win == debuggerWin then db.focus() else if win then ed.focus() else session.focus()

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

    socket.on 'update', (name, text, token, bugger, breakpoints) ->
      winInfos[token].name = name
      winInfos[token].text = text
      if bugger
        db.open name, text, breakpoints
      else
        ed.open name, text, breakpoints
      session.scrollCursorIntoView()

    socket.on 'CloseWindow', ({win}) ->
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

    socket.on 'autocomplete', (token, skip, options) -> (if token then ed else session).autocomplete skip, options
    socket.on 'highlight', (win, line) ->
      if win == editorWin then ed.highlight line
      else if win == debuggerWin then db.highlight line

    socket.on 'end', -> alert 'Interpreter disconnected'

    layout = $('body').layout
      defaults: enableCursorHotkey: 0
      north: resizable: 0, togglerLength_closed: '100%', togglerTip_closed: 'Show Language Bar', spacing_open: 0
      east:  spacing_closed: 0, size: '0%', resizable: 1, togglerLength_open: 0
      south: spacing_closed: 0, size: '0%', resizable: 1, togglerLength_open: 0
      center: onresize: -> (for x in [session, ed, db] then x.updateSize()); session.scrollCursorIntoView(); return
    layout.close 'east';  layout.sizePane 'east', '50%'
    layout.close 'south'; layout.sizePane 'south', '50%'
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
            key = Dyalog.reverseKeyMap[x] || ''
            keyText = key && "Keyboard: `#{key}\n\n"
            h = Dyalog.lbarTips[x] or [x, '']; $tipDesc.text h[0]; $tipText.text keyText + h[1]
            $tipTriangle.css(left: 3 + p.left + ($t.width() - $tipTriangle.width()) / 2, top: p.top + $t.height() + 2).show()
            x0 = p.left - 21
            x1 = x0 + $tip.width()
            y0 = p.top + $t.height()
            if x1 > $(document).width()
              $tip.css(left: '', right: 0, top: y0).show()
            else
              $tip.css(left: Math.max(0, x0), right: '', top: y0).show()
          return
