jQuery ($) ->
  Dyalog.idePage = ->
    {socket} = Dyalog
    $('body').html '''
      <div class="ui-layout-center"></div>
      <div class="ui-layout-east"  style="display:none"></div>
      <div class="ui-layout-south" style="display:none"></div>
    '''

    wins =
      0: session = Dyalog.Session $('.ui-layout-center'),
        edit: (s, i) -> socket.emit 'Edit', win: 0, pos: i, text: s
        exec: (lines, trace) -> (for s in lines then socket.emit 'Execute', text: (s + '\n'), trace: trace); return
        autocomplete: (s, i) -> socket.emit 'Autocomplete', line: s, pos: i, token: 0

    socket.on 'UpdateDisplayName', ({displayName}) -> $('title').text displayName
    socket.on 'EchoInput', ({input}) -> session.add input
    socket.on 'AppendSessionOutput', ({result}) -> session.add result
    socket.on 'NotAtInputPrompt', -> session.prompt null
    socket.on 'AtInputPrompt', ({why}) -> session.prompt why
    socket.on 'FocusWindow', ({win}) -> wins[win].focus()

    socket.on 'open', (name, text, token, bugger, breakpoints) ->
      if bugger
        layout.open 'south'
        wins[token] = Dyalog.Editor '.ui-layout-south',
          debugger: true
          save:   (s, bs) -> socket.emit 'SaveChanges',    win: token, text: s, attributes: trace: bs
          close:          -> socket.emit 'CloseWindow',    win: token
          over:           -> socket.emit 'RunCurrentLine', win: token
          into:           -> socket.emit 'StepInto',       win: token
          back:           -> socket.emit 'TraceBackward',  win: token
          skip:           -> socket.emit 'TraceForward',   win: token
          continueTrace:  -> socket.emit 'ContinueTrace',  win: token
          continueExec:   -> socket.emit 'Continue',       win: token
          restartThreads: -> socket.emit 'RestartThreads', win: token
          interrupt:      -> socket.emit 'WeakInterrupt'
          cutback:        -> socket.emit 'Cutback',        win: token
        wins[token].open name, text, breakpoints
      else
        layout.open 'east'
        wins[token] = Dyalog.Editor '.ui-layout-east',
          save: (s, bs)   -> socket.emit 'SaveChanges', win: token, text: s, attributes: stop: bs
          close:          -> socket.emit 'CloseWindow', win: token
          autocomplete: (s, i) -> socket.emit 'autocomplete', s, i, token
        wins[token].open name, text, breakpoints
      session.scrollCursorIntoView()

    socket.on 'update', (name, text, token, bugger, breakpoints) ->
      wins[token].open name, text, breakpoints
      session.scrollCursorIntoView()

    socket.on 'CloseWindow', ({win}) ->
      $c = $ wins[win].getContainer()
      for d in ['east', 'south'] when $c.hasClass 'ui-layout-' + d then layout.close d
      delete wins[win]
      session.scrollCursorIntoView()

    socket.on 'autocomplete', (token, skip, options) -> wins[token].autocomplete skip, options
    socket.on 'highlight', (win, line) -> wins[win].highlight line
    socket.on 'end', -> alert 'Interpreter disconnected'

    # language bar
    $('body').prepend """
      <div id="lbar" class="ui-layout-north" style="display:none">
        <a id="lbar-close" title="Hide Language Bar" href="#"></a>
        #{Dyalog.lbarHTML}
      </div>
      <div id="tip" style="display:none"><div id="tip-desc"></div><pre id="tip-text"></pre></div>
      <div id="tip-triangle" style="display:none"></div>
    """
    timeout = (delay, f) -> setTimeout f, delay
    timeout 2000, ->
      $('#lbar').on 'mousedown', -> false
      $('b', '#lbar').on 'mousedown', (e) -> (for _, x of wins when x.hasFocus() then x.insert $(e.target).text()); false
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

    layout = $('body').layout
      defaults: enableCursorHotkey: 0
      north: resizable: 0, togglerLength_closed: '100%', togglerTip_closed: 'Show Language Bar', spacing_open: 0
      east:  spacing_closed: 0, size: '0%', resizable: 1, togglerLength_open: 0
      south: spacing_closed: 0, size: '0%', resizable: 1, togglerLength_open: 0
      center: onresize: -> (for _, x of wins then x.updateSize()); session.scrollCursorIntoView(); return
    layout.close 'east';  layout.sizePane 'east', '50%'
    layout.close 'south'; layout.sizePane 'south', '50%'
    session.updateSize()
