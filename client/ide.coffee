jQuery ($) ->
  Dyalog.idePage = ->
    {socket} = Dyalog
    $('body').html """
      <div class="lbar ui-layout-north" style="display:none"><a class="lbar-close" title="Hide Language Bar" href="#"></a>#{Dyalog.lbarHTML}</div>
      <div class="lbar-tip" style="display:none"><div class="lbar-tip-desc"></div><pre class="lbar-tip-text"></pre></div>
      <div class="lbar-tip-triangle" style="display:none"></div>
      <div class="ui-layout-center"></div>
      <div class="ui-layout-east"  style="display:none"></div>
      <div class="ui-layout-south" style="display:none"></div>
    """

    wins = # mapping between window ids and widget instances (Dyalog.Session or Dyalog.Editor)
      0: session = Dyalog.Session $('.ui-layout-center'),
        edit: (s, i) -> socket.emit 'Edit', win: 0, pos: i, text: s
        exec: (lines, trace) -> (for s in lines then socket.emit 'Execute', text: (s + '\n'), trace: trace); return
        autocomplete: (s, i) -> socket.emit 'Autocomplete', line: s, pos: i, token: 0

    socket
      .on 'UpdateDisplayName', ({displayName}) -> $('title').text displayName
      .on 'EchoInput', ({input}) -> session.add input
      .on 'AppendSessionOutput', ({result}) -> session.add result
      .on 'NotAtInputPrompt', -> session.prompt null
      .on 'AtInputPrompt', ({why}) -> session.prompt why
      .on 'FocusWindow', ({win}) -> wins[win].focus()
      .on 'WindowTypeChanged', ({win, tracer}) -> wins[win].setDebugger tracer
      .on 'autocomplete', (token, skip, options) -> wins[token].autocomplete skip, options
      .on 'highlight', (win, line) -> wins[win].highlight line
      .on 'end', -> alert 'Interpreter disconnected'
      .on 'update', (name, text, token, bugger, breakpoints) -> wins[token].open name, text, breakpoints; session.scrollCursorIntoView()
      .on 'CloseWindow', ({win}) ->
        $c = $ wins[win].getContainer(); delete wins[win]
        for d in ['east', 'south'] when $c.hasClass 'ui-layout-' + d then layout.close d
        session.scrollCursorIntoView()
      .on 'open', (name, text, token, bugger, breakpoints) ->
        layout.open dir = if bugger then 'south' else 'east'
        wins[token] = Dyalog.Editor '.ui-layout-' + dir,
          debugger: bugger
          save: (s, bs)   -> socket.emit 'SaveChanges',    win: token, text: s, attributes: stop: bs
          close:          -> socket.emit 'CloseWindow',    win: token
          over:           -> socket.emit 'RunCurrentLine', win: token
          into:           -> socket.emit 'StepInto',       win: token
          back:           -> socket.emit 'TraceBackward',  win: token
          skip:           -> socket.emit 'TraceForward',   win: token
          continueTrace:  -> socket.emit 'ContinueTrace',  win: token
          continueExec:   -> socket.emit 'Continue',       win: token
          restartThreads: -> socket.emit 'RestartThreads', win: token
          edit:    (s, p) -> socket.emit 'Edit',           win: token, text: s, pos: p
          interrupt:      -> socket.emit 'WeakInterrupt'
          cutback:        -> socket.emit 'Cutback',        win: token
          autocomplete: (s, i) -> socket.emit 'autocomplete', s, i, token
        wins[token].open name, text, breakpoints
        session.scrollCursorIntoView()

    # language bar
    $('.lbar-close').on 'click', -> layout.close 'north'; false
    $tip = $ '.lbar-tip'; $tipDesc = $ '.lbar-tip-desc'; $tipText = $ '.lbar-tip-text'; $tipTriangle = $ '.lbar-tip-triangle'
    ttid = null # tooltip timeout id
    $('.lbar')
      .on 'mousedown', -> false
      .on 'mousedown', 'b', (e) -> (for _, x of wins when x.hasFocus() then x.insert $(e.target).text()); false
      .on 'mouseout', 'b', -> clearTimeout ttid; ttid = null; $tip.add($tipTriangle).hide(); return
      .on 'mouseover', 'b', (e) ->
        clearTimeout ttid; $t = $ e.target; p = $t.position(); x = $t.text()
        ttid = setTimeout(
          ->
            ttid = null; key = Dyalog.reverseKeyMap[x] || ''; keyText = key && "Keyboard: `#{key}\n\n"
            h = Dyalog.lbarTips[x] or [x, '']; $tipDesc.text h[0]; $tipText.text keyText + h[1]
            $tipTriangle.css(left: 3 + p.left + ($t.width() - $tipTriangle.width()) / 2, top: p.top + $t.height() + 2).show()
            x0 = p.left - 21; x1 = x0 + $tip.width(); y0 = p.top + $t.height()
            if x1 > $(document).width() then $tip.css(left: '', right: 0, top: y0).show()
            else $tip.css(left: Math.max(0, x0), right: '', top: y0).show()
            return
          200
        )
        return

    layout = $('body').layout
      defaults: enableCursorHotkey: 0
      north: resizable: 0, togglerLength_closed: '100%', togglerTip_closed: 'Show Language Bar', spacing_open: 0
      east:  spacing_closed: 0, size: '0%', resizable: 1, togglerLength_open: 0
      south: spacing_closed: 0, size: '0%', resizable: 1, togglerLength_open: 0
      center: onresize: -> (for _, x of wins then x.updateSize()); session.scrollCursorIntoView(); return
    for d in ['east', 'south'] then layout.close d; layout.sizePane d, '50%'
    session.updateSize()
