jQuery ($) ->

  # about dialog
  about = ->
    $("<p>Version: #{Dyalog.version}<br/>Build date: #{Dyalog.buildDate}</p>").dialog
      modal: 1, title: 'About', buttons: [text: 'Close', click: -> $(@).dialog 'close']
  $(document)
    .on 'menu-select', '.m-about', about
    .on 'keydown', (e) -> if e.which == 112 && !e.ctrlKey && e.shiftKey && !e.altKey then about(); false # <S-F1>

  # keyboard preferences
  $(document)
    .on 'menu-select', '.m-prefs', -> Dyalog.showPrefs(); return
    .on 'click', '.lbar-prefs', -> Dyalog.showPrefs(); false

  # quit
  $(document)
    .on 'menu-select', '.m-quit', Dyalog.quit
    .on 'keydown', (e) -> if e.which == 81 && e.ctrlKey && !e.shiftKey && !e.altKey then Dyalog.quit(); false # <C-q>

  Dyalog.idePage = ->
    {socket} = Dyalog
    $('body').html """
      <ul class="menu">
        <li>File<ul><li class="m-quit">Quit <span class="shortcut">Ctrl+Q</span></li></ul></li>
        <li>Edit<ul><li class="m-prefs">Keyboard Preferences</li></ul></li>
        <li>Help<ul><li class="m-about">About <span class="shortcut">Shift+F1</span></li></ul></li>
      </ul>
      <div class="ide" style="position:absolute;top:20px;bottom:0;left:0;right:0">
        <div class="lbar ui-layout-north" style="display:none">
          <a class="lbar-close" title="Hide Language Bar" href="#"></a>
          <a class="lbar-prefs" title="Preferences" href="#"></a>
          #{Dyalog.lbarHTML}
        </div>
        <div class="lbar-tip" style="display:none"><div class="lbar-tip-desc"></div><pre class="lbar-tip-text"></pre></div>
        <div class="lbar-tip-triangle" style="display:none"></div>
        <div class="ui-layout-center"></div>
        <div class="ui-layout-east" ><ul></ul></div>
        <div class="ui-layout-south"><ul></ul></div>
      </div>
    """

    $(document).keydown (e) ->
      if e.which == 9 && e.ctrlKey && !e.altKey # <C-Tab> and <C-S-Tab>
        for w, c of wins when c.hasFocus() then w = +w; break # w: id of old focused window
        wo = [0].concat $('li[role=tab]').map(-> +$(@).attr('id').replace /\D+/, '').toArray() # wo: window order
        u = wo[(wo.indexOf(w) + if e.shiftKey then wo.length - 1 else 1) % wo.length] # u: id of new focused window
        $("#wintab#{u} a").click(); wins[u]?.focus()
        false

    tabOpts = activate: (_, ui) -> (w = wins[+ui.newTab.attr('id').replace /\D+/, '']).updateSize(); w.focus(); return
    $tabs = $('.ui-layout-east, .ui-layout-south').tabs tabOpts

    refreshTabs = ->
      $tabs.each -> $t = $ @; if !$('li', $t).length then ['east', 'south'].forEach (d) -> (if $t.hasClass 'ui-layout-' + d then layout.close d); return
           .tabs 'refresh'
      return

    $tabs.find('ul').each ->
      $(@).sortable
        cursor: 'move', revert: true, tolerance: 'pointer', connectWith: $tabs.find 'ul'
        receive: (_, ui) ->
          $(@).closest('.ui-tabs').append $ '#win' + ui.item.attr('id').replace /\D+/, ''
          $tabs.tabs('destroy').tabs tabOpts
          return
        start: -> $('body').addClass 'dragging'; return
        stop: ->
          refreshTabs()
          $('[role=tab]', $tabs).attr 'style', '' # clean up tabs' z-indices after dragging, $().sortable screws them up
          $('body').removeClass 'dragging'
          return

    Dyalog.wins = wins = # mapping between window ids and widget instances (Dyalog.Session or Dyalog.Editor)
      0: session = Dyalog.Session $('.ui-layout-center'),
        edit: (s, i) -> socket.emit 'Edit', win: 0, pos: i, text: s
        exec: (lines, trace) -> (for s in lines then socket.emit 'Execute', text: (s + '\n'), trace: trace); return
        autocomplete: (s, i) -> socket.emit 'Autocomplete', line: s, pos: i, token: 0

    socket
      .on 'UpdateDisplayName', ({displayName}) -> $('title').text displayName
      .on 'EchoInput', ({input}) -> session.add input
      .on 'AppendSessionOutput', ({result}) -> session.add result
      .on 'NotAtInputPrompt', -> session.noPrompt()
      .on 'AtInputPrompt', ({why}) -> session.prompt why
      .on 'FocusWindow', ({win}) -> $("#wintab#{win} a").click(); wins[win].focus(); return
      .on 'WindowTypeChanged', ({win, tracer}) -> wins[win].setDebugger tracer
      .on 'autocomplete', (token, skip, options) -> wins[token].autocomplete skip, options
      .on 'highlight', (win, line) -> wins[win].highlight line
      .on 'end', -> alert 'Interpreter disconnected'
      .on 'UpdateWindow', (ee) -> wins[ee.token].open ee; session.scrollCursorIntoView() # "ee" for EditableEntity
      .on 'ReplySaveChanges', ({win, err}) -> wins[win]?.saved err
      .on 'CloseWindow', ({win}) ->
        $("#wintab#{win},#win#{win}").remove()
        $tabs.tabs('destroy').tabs tabOpts
        refreshTabs()
        wins[win].closePopup?()
        delete wins[win]; session.scrollCursorIntoView()
        return
      .on 'OpenWindow', (ee) -> # "ee" for EditableEntity
        layout.open dir = if ee.debugger then 'south' else 'east'
        w = ee.token
        $("<li id='wintab#{w}'><a href='#win#{w}'></a></li>").appendTo('.ui-layout-' + dir + ' ul').find('a').text ee.name
        $tabContent = $("<div style='width:100%;height:auto;padding:0' id='win#{w}'></div>").appendTo('.ui-layout-' + dir)
        wins[w] = Dyalog.Editor $tabContent,
          debugger: ee.debugger
          save: (s, bs)   -> socket.emit 'SaveChanges',    win: w, text: s, attributes: stop: bs
          close:          -> socket.emit 'CloseWindow',    win: w
          over:           -> socket.emit 'RunCurrentLine', win: w
          into:           -> socket.emit 'StepInto',       win: w
          back:           -> socket.emit 'TraceBackward',  win: w
          skip:           -> socket.emit 'TraceForward',   win: w
          continueTrace:  -> socket.emit 'ContinueTrace',  win: w
          continueExec:   -> socket.emit 'Continue',       win: w
          restartThreads: -> socket.emit 'RestartThreads', win: w
          edit:    (s, p) -> socket.emit 'Edit',           win: w, text: s, pos: p
          interrupt:      -> socket.emit 'WeakInterrupt'
          cutback:        -> socket.emit 'Cutback',        win: w
          autocomplete: (s, i) -> socket.emit 'autocomplete', s, i, w
          pop: ->
            if !opener
              if pw = open "?win=#{w}", '_blank', 'width=500,height=400,left=100,top=100,resizable=1' # pw:popup window
                $("#wintab#{w},#win#{w}").remove(); $tabs.tabs('destroy').tabs tabOpts; refreshTabs()
                session.scrollCursorIntoView()
                # wins[w] will be replaced a bit later by code running in the popup
              else
                alert 'Popups are blocked.'
            return
        wins[w].open ee
        $('.ui-layout-' + dir).tabs('refresh').tabs(active: -1)
          .data('ui-tabs').panels.off 'keydown' # prevent jQueryUI tabs from hijacking our keystrokes, <C-Up> in particular
        session.scrollCursorIntoView()

    # language bar
    $('.lbar-close').on 'click', -> layout.close 'north'; false
    $tip = $ '.lbar-tip'; $tipDesc = $ '.lbar-tip-desc'; $tipText = $ '.lbar-tip-text'; $tipTriangle = $ '.lbar-tip-triangle'
    ttid = null # tooltip timeout id
    $ '.lbar'
      .on 'mousedown', -> false
      .on 'mousedown', 'b', (e) -> (for _, x of wins when x.hasFocus() then x.insert $(e.target).text()); false
      .on 'mouseout', 'b', -> clearTimeout ttid; ttid = null; $tip.add($tipTriangle).hide(); return
      .on 'mouseover', 'b', (e) ->
        clearTimeout ttid; $t = $ e.target; p = $t.position(); x = $t.text()
        ttid = setTimeout(
          ->
            ttid = null; key = Dyalog.reverseKeyMap[x] || ''; keyText = key && "Keyboard: #{Dyalog.getPrefixKey()}#{key}\n\n"
            h = Dyalog.lbarTips[x] or [x, '']; $tipDesc.text h[0]; $tipText.text keyText + h[1]
            $tipTriangle.css(left: 3 + p.left + ($t.width() - $tipTriangle.width()) / 2, top: p.top + $t.height() + 2).show()
            x0 = p.left - 21; x1 = x0 + $tip.width(); y0 = p.top + $t.height()
            if x1 > $(document).width() then $tip.css(left: '', right: 0, top: y0).show()
            else $tip.css(left: Math.max(0, x0), right: '', top: y0).show()
            return
          200
        )
        return

    layout = $('.ide').layout
      defaults: enableCursorHotkey: 0
      north: resizable: 0, togglerLength_closed: '100%', togglerTip_closed: 'Show Language Bar', spacing_open: 0
      east:  spacing_closed: 0, size: '0%', resizable: 1, togglerLength_open: 0
      south: spacing_closed: 0, size: '0%', resizable: 1, togglerLength_open: 0
      center: onresize: -> (for _, x of wins then x.updateSize()); session.scrollCursorIntoView(); return
      fxName: ''
    for d in ['east', 'south'] then layout.close d; layout.sizePane d, '50%'
    session.updateSize()

    # menu
    do ->
      $m = $ '.menu'; $l = $m.find('>li').addClass 'm-top'
      $l.mousedown (e) -> if $(e.target).hasClass 'm-top' then $(e.target).toggleClass 'active'; $l.not(e.target).removeClass 'active'; false
      $l.mouseover (e) -> if $(e.target).hasClass('m-top') && $l.hasClass 'active' then $l.removeClass('active'); $(e.target).addClass 'active'; return
      $(document).mousedown (e) -> if !$(e.target).closest('.menu').length then $l.removeClass 'active'
      $m.on 'mousedown mouseup', 'li', (e) -> if !$(e.target).hasClass 'm-top' then $l.removeClass 'active'; $(e.target).trigger 'menu-select'; false
        .on 'mouseover mouseout', 'li', (e) -> $(e.target).closest('li').toggleClass 'hover', e.type == 'mouseover'; return

    return
