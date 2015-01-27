jQuery ($) ->

  overlap = (x0, x1, x2, x3) -> x2 < x1 && x0 < x3 # helper: do the segments (x0,x1) and (x2,x3) overlap?

  D.idePage = ->
    $('body').html """
      <div class="ide">
        <div class="lbar ui-layout-north" style="display:none">
          <a class="lbar-prefs" title="Preferences" href="#"></a>
          #{D.lbarHTML}
        </div>
        <div class="lbar-tip" style="display:none"><div class="lbar-tip-desc"></div><pre class="lbar-tip-text"></pre></div>
        <div class="lbar-tip-triangle" style="display:none"></div>
        <div class="ui-layout-center"></div>
        <div class="ui-layout-east" ><ul></ul></div>
        <div class="ui-layout-south"><ul></ul></div>
      </div>
    """

    # "wins" maps window ids, as they appear in the RIDE protocol, to window information objects that have the following properties:
    #   widget: an instance of D.Session or D.editor
    #   id: the key in "wins"
    D.wins = wins =
      0: id: 0, widget: session = D.Session $('.ui-layout-center'),
        edit: (s, i) -> D.socket.emit 'Edit', win: 0, pos: i, text: s
        autocomplete: (s, i) -> D.socket.emit 'Autocomplete', line: s, pos: i, token: 0
        exec: (lines, trace) -> (if !trace then execQueue = lines[1..]); D.socket.emit 'Execute', {trace, text: lines[0] + '\n'}; return

    # Tab management
    tabOpts = activate: (_, ui) -> (widget = wins[+ui.newTab.attr('id').replace /\D+/, ''].widget).updateSize(); widget.focus(); return
    $tabs = $('.ui-layout-east, .ui-layout-south').tabs tabOpts
    refreshTabs = ->
      $tabs.each -> $t = $ @; if !$('li', $t).length then ['east', 'south'].forEach (d) -> (if $t.is '.ui-layout-' + d then layout.close d); return
           .tabs 'refresh'
      return
    $(document).on 'keydown', '*', 'ctrl+tab ctrl+shift+tab', (e) ->
      for id, {widget} of wins when widget.hasFocus() then id = +id; break # id: id of old focused window
      wo = [0].concat $('li[role=tab]').map(-> +$(@).attr('id').replace /\D+/, '').toArray() # wo: window order
      u = wo[(wo.indexOf(id) + if e.shiftKey then wo.length - 1 else 1) % wo.length] # u: id of new focused window
      $("#wintab#{u} a").click(); wins[u]?.widget?.focus()
      false

    execQueue = [] # pending lines to execute: AtInputPrompt consumes one item from the queue, HadError empties it

    ($uls = $tabs.find 'ul').each ->
      $(@).sortable
        cursor: 'move', tolerance: 'pointer', connectWith: $uls, containment: '.ide'
        receive: (_, ui) ->
          $(@).closest('.ui-tabs').append $ '#win' + ui.item.attr('id').replace /\D+/, ''
          $tabs.tabs('destroy').tabs tabOpts
          return
        start: -> $('body').addClass 'dragging'; return
        sort: (_, ui) ->
          # ui.helper is floatable if it doesn't overlap with any <ul>-s (tab containers)
          hx0 = ui.offset.left; hy0 = ui.offset.top; hx1 = hx0 + $(ui.helper).width(); hy1 = hy0 + $(ui.helper).height()
          floatable = 1
          $uls.each ->
            uo = $(@).offset(); ux0 = uo.left; uy0 = uo.top; ux1 = ux0 + $(@).width(); uy1 = uy0 + $(@).height()
            floatable &&= !(overlap(ux0, ux1, hx0, hx1) && overlap(uy0, uy1, hy0, hy1))
            return
          $(ui.helper).toggleClass 'floatable', floatable
          return
        beforeStop: (_, ui) ->
          if $(ui.helper).is '.floatable' then $(ui.helper).removeClass 'floatable'; popWindow +$(ui.helper).attr('id').replace /\D+/, ''
          return
        stop: (_, ui) ->
          $('body').removeClass 'dragging'; refreshTabs()
          $('[role=tab]', $tabs).attr 'style', '' # clean up tabs' z-indices after dragging, $().sortable screws them up
          return

    popWindow = (w) ->
      if !opener
        if pw = open "?win=#{w}", '_blank', 'width=500,height=400,left=100,top=100,resizable=1'
          $("#wintab#{w},#win#{w}").remove(); $tabs.tabs('destroy').tabs tabOpts; refreshTabs()
          session.scrollCursorIntoView()
          # wins[w].widget will be replaced a bit later by code running in the popup
        else
          $.alert 'Popups are blocked.'
      return

    D.socket
      .on '*identify', (i) -> D.remoteIdentification = i; return
      .on 'UpdateDisplayName', ({displayName}) -> $('title').text displayName
      .on 'EchoInput', ({input}) -> session.add input
      .on 'AppendSessionOutput', ({result}) -> session.add result
      .on 'NotAtInputPrompt', -> session.noPrompt()
      .on 'AtInputPrompt', ({why}) ->
        if execQueue.length then D.socket.emit 'Execute', trace: 0, text: execQueue.shift() + '\n' else session.prompt why
        return
      .on 'HadError', -> execQueue.splice 0, execQueue.length; return
      .on 'FocusWindow', ({win}) -> $("#wintab#{win} a").click(); wins[win].widget.focus(); return
      .on 'WindowTypeChanged', ({win, tracer}) -> wins[win].widget.setDebugger tracer
      .on 'autocomplete', (token, skip, options) -> wins[token].widget.autocomplete skip, options
      .on 'highlight', (win, line) -> wins[win].widget.highlight line
      .on 'UpdateWindow', (ee) -> wins[ee.token].widget.open ee; session.scrollCursorIntoView() # "ee" for EditableEntity
      .on 'ReplySaveChanges', ({win, err}) -> wins[win]?.widget?.saved err
      .on 'CloseWindow', ({win}) ->
        $("#wintab#{win},#win#{win}").remove(); $tabs.tabs('destroy').tabs tabOpts; refreshTabs()
        wins[win].widget.closePopup?(); delete wins[win]; session.scrollCursorIntoView(); session.focus(); return
      .on 'OpenWindow', (ee) -> # "ee" for EditableEntity
        layout.open dir = if ee.debugger then 'south' else 'east'
        w = ee.token
        $("<li id='wintab#{w}'><a href='#win#{w}'></a></li>").appendTo('.ui-layout-' + dir + ' ul').find('a').text ee.name
        $tabContent = $("<div class='win' id='win#{w}'></div>").appendTo('.ui-layout-' + dir)
        wins[w] = id: w, name: ee.name, widget: D.Editor $tabContent,
          debugger: ee.debugger
          save: (s, bs)   -> D.socket.emit 'SaveChanges',    win: w, text: s, attributes: stop: bs
          close:          -> D.socket.emit 'CloseWindow',    win: w
          over:           -> D.socket.emit 'RunCurrentLine', win: w
          into:           -> D.socket.emit 'StepInto',       win: w
          back:           -> D.socket.emit 'TraceBackward',  win: w
          skip:           -> D.socket.emit 'TraceForward',   win: w
          continueTrace:  -> D.socket.emit 'ContinueTrace',  win: w
          continueExec:   -> D.socket.emit 'Continue',       win: w
          restartThreads: -> D.socket.emit 'RestartThreads', win: w
          edit:    (s, p) -> D.socket.emit 'Edit',           win: w, text: s, pos: p
          interrupt:      -> D.socket.emit 'WeakInterrupt'
          cutback:        -> D.socket.emit 'Cutback',        win: w
          autocomplete: (s, i) -> D.socket.emit 'autocomplete', s, i, w
          pop: -> popWindow w
          openInExternalEditor: D.openInExternalEditor
        wins[w].widget.open ee
        $('.ui-layout-' + dir).tabs('refresh').tabs(active: -1)
          .data('ui-tabs').panels.off 'keydown' # prevent jQueryUI tabs from hijacking our keystrokes, <C-Up> in particular
        session.scrollCursorIntoView()
        if +localStorage.floatNewEditors then popWindow w
        return

    # language bar
    $('.lbar-prefs').click D.showPrefs
    $tip = $ '.lbar-tip'; $tipDesc = $ '.lbar-tip-desc'; $tipText = $ '.lbar-tip-text'; $tipTriangle = $ '.lbar-tip-triangle'
    ttid = null # tooltip timeout id
    $ '.lbar'
      .on 'mousedown', -> false
      .on 'mousedown', 'b', (e) -> (for _, {widget} of wins when widget.hasFocus() then widget.insert $(e.target).text()); false
      .on 'mouseout', 'b', -> clearTimeout ttid; ttid = null; $tip.add($tipTriangle).hide(); return
      .on 'mouseover', 'b', (e) ->
        clearTimeout ttid; $t = $ e.target; p = $t.position(); x = $t.text()
        ttid = setTimeout(
          ->
            ttid = null; key = D.reverseKeyMap[x]
            keyText = if key && x.charCodeAt(0) > 127 then "Keyboard: #{D.getPrefixKey()}#{key}\n\n" else ''
            h = D.lbarTips[x] or [x, '']; $tipDesc.text h[0]; $tipText.text keyText + h[1]
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
      north: spacing_closed: 0, spacing_open: 0, resizable: 0, togglerLength_open: 0
      east:  spacing_closed: 0, size: '0%', resizable: 1, togglerLength_open: 0
      south: spacing_closed: 0, size: '0%', resizable: 1, togglerLength_open: 0
      center: onresize: -> (for _, {widget} of wins then widget.updateSize()); session.scrollCursorIntoView(); return
      fxName: ''
    for d in ['east', 'south'] then layout.close d; layout.sizePane d, '50%'
    session.updateSize()

    # menu
    $('<div class="menu"></div>').prependTo('body').dyalogmenu [
      (
        if D.nwjs
          {'': '_File', items: [
            {'': '_Quit', key: 'Ctrl+Q', action: D.quit}
          ]}
      )
      {'': '_Edit', items: [
        {'': '_Keyboard Preferences', action: D.showPrefs}
      ]}
      {'': '_View', items:
        [
          {'': 'Show Language Bar', checked: 1, action: -> layout.toggle 'north'; return}
          {'': 'Float New Editors', checked: +localStorage.floatNewEditors || 0, action: (x) -> localStorage.floatNewEditors = +x; return}
        ]
          .concat(
            if D.nwjs then [
              '-'
              {'': 'Zoom _In',    key: 'Ctrl+=', action: D.zoomIn}
              {'': 'Zoom _Out',   key: 'Ctrl+-', action: D.zoomOut}
              {'': '_Reset Zoom', key: 'Ctrl+0', action: D.resetZoom}
            ] else []
          )
      }
      {'': '_Help', items: [
        {'': '_About', key: 'Shift+F1', action: D.about}
      ]}
    ]
    $(document).on 'keydown', '*', 'ctrl+shift+=', -> D.zoomIn(); false
    return
