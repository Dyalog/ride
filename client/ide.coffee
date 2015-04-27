require './menu'
about = require './about'
prefs = require './prefs'
prefsUI = require './prefs-ui'
{Editor} = require './editor'
{Session} = require './session'
keymap = require './keymap'
require '../lbar/lbar'
require '../jquery.layout'
{esc, delay} = require './util'
CodeMirror = require 'codemirror'

class @IDE
  constructor: ->
    ide = D.ide = @
    $('body').html @$ide = $ """
      <div class=ide>
        <div class="lbar ui-layout-north" style=display:none>
          <a class=lbar-prefs title=Preferences href=#></a>
          #{D.lbarHTML}
        </div>
        <div class=lbar-tip style=display:none><div class=lbar-tip-desc></div><pre class=lbar-tip-text></pre></div>
        <div class=lbar-tip-triangle style=display:none></div>
        <div class=ui-layout-center></div>
        <div class=ui-layout-east ><ul></ul></div>
        <div class=ui-layout-south><ul></ul></div>
      </div>
    """

    @isDead = 0
    @pending = [] # lines to execute: AtInputPrompt consumes one item from the queue, HadError empties it
    @w3500 = null # window for 3500⌶
    @host = @port = @wsid = ''; prefs.windowTitle @updateTitle.bind @
    @demoLines = []; @demoIndex = -1
    @focusedWinId = 0

    D.wins = @wins = # window id -> instance of Editor or Session
      0: new Session @, $('.ui-layout-center'),
        id: 0, emit: @emit.bind(@), weakInterrupt: @WI.bind(@)
        exec: (lines, trace) =>
          if lines && lines.length
            if !trace then @pending = lines[1..]
            @emit 'Execute', {trace, text: lines[0] + '\n'}
          return

    # Tab management
    @tabOpts = activate: (_, ui) => (widget = @wins[+ui.newTab.attr('id').replace /\D+/, '']).updateSize(); widget.focus(); return
    @$tabs = $('.ui-layout-east, .ui-layout-south').tabs @tabOpts
    @refreshTabs = =>
      for d in ['east', 'south'] when !$(".ui-layout-#{d} li", @$ide).length then @layout.close d
      @$tabs.tabs 'refresh'; return
    for tab in @$tabs.find 'ul'
      $(tab).sortable
        cursor: 'move', containment: 'parent', tolerance: 'pointer', axis: 'x', revert: true
        stop: (_, ui) =>
          @refreshTabs()
          $('[role=tab]', @$tabs).attr 'style', '' # clean up tabs' z-indices after dragging, $().sortable screws them up
          return
      .data('ui-sortable').floating = true # workaround for a jQueryUI bug, see http://bugs.jqueryui.com/ticket/6702#comment:20

    D.socket
      .on '*identify', (i) => D.remoteIdentification = i; @updateTitle(); return
      .on '*spawnedError', ({message}) =>
        @die(); delay 100, -> $.alert message, 'Error'; return # give the window a chance to restore its original dimensions
        return
      .on '*disconnected', => (if !@isDead then $.alert 'Interpreter disconnected', 'Error'; @die()); return
      .on 'Disconnect', ({message}) =>
        if !@isDead
          @die()
          if message == 'Dyalog session has ended'
            (try close()); D.process?.exit? 0
          else
            $.alert message, 'Interpreter disconnected'
        return
      .on 'SysError', ({text}) => $.alert text, 'SysError'; @die(); return
      .on 'InternalError', ({error, dmx}) => $.alert "error: #{error}, dmx: #{dmx}", 'Internal Error'; @die(); return
      .on 'UpdateDisplayName', (a) => @wsid = a.displayName; @updateTitle(); return
      .on 'EchoInput', ({input}) => @wins[0].add input; return
      .on 'AppendSessionOutput', ({result}) => @wins[0].add result; return
      .on 'NotAtInputPrompt', => @wins[0].noPrompt(); return
      .on 'AtInputPrompt', ({why}) =>
        if @pending.length then @emit 'Execute', trace: 0, text: @pending.shift() + '\n' else @wins[0].prompt why
        return
      .on 'HadError', => @pending.splice 0, @pending.length; return
      .on 'FocusWindow', ({win}) => $("#wintab#{win} a").click(); @wins[win]?.focus(); return
      .on 'WindowTypeChanged', ({win, tracer}) => @wins[win].setDebugger tracer
      .on 'autocomplete', (token, skip, options) => @wins[token].autocomplete skip, options
      .on 'highlight', (win, line) => @wins[win].highlight line; return
      .on 'UpdateWindow', (ee) => # "ee" for EditableEntity
        $("#wintab#{ee.token} a").text ee.name; @wins[ee.token].open ee; @wins[0].scrollCursorIntoView(); return
      .on 'ReplySaveChanges', ({win, err}) => @wins[win]?.saved err
      .on 'CloseWindow', ({win}) =>
        $("#wintab#{win},#win#{win}").remove(); @$tabs.tabs('destroy').tabs @tabOpts; @refreshTabs()
        @wins[win]?.closePopup?(); delete @wins[win]; @wins[0].scrollCursorIntoView(); @wins[0].focus(); return
      .on 'OpenWindow', @openWindow.bind @
      .on 'ShowHTML', @showHTML.bind @

    # language bar
    $('.lbar-prefs').click -> prefsUI 'keyboard'; return
    $tip = $ '.lbar-tip'; $tipDesc = $ '.lbar-tip-desc'; $tipText = $ '.lbar-tip-text'; $tipTriangle = $ '.lbar-tip-triangle'
    ttid = null # tooltip timeout id
    $ '.lbar'
      .on 'mousedown', -> false
      .on 'mousedown', 'b', (e) =>
        ch = $(e.target).text()
        for _, widget of @wins when widget.hasFocus() then widget.insert ch; return false
        $(':focus').insert ch
        false
      .on 'mouseout', 'b', -> clearTimeout ttid; ttid = null; $tip.add($tipTriangle).hide(); return
      .on 'mouseover', 'b', (e) ->
        clearTimeout ttid; $t = $ e.target; p = $t.position(); x = $t.text()
        ttid = delay 200, ->
          ttid = null; key = keymap.getBQKeyFor x
          keyText = if key && x.charCodeAt(0) > 127 then "Keyboard: #{prefs.prefixKey()}#{key}\n\n" else ''
          h = D.lbarTips[x] or [x, '']; $tipDesc.text h[0]; $tipText.text keyText + h[1]
          $tipTriangle.css(left: 3 + p.left + ($t.width() - $tipTriangle.width()) / 2, top: p.top + $t.height() + 2).show()
          x0 = p.left - 21; x1 = x0 + $tip.width(); y0 = p.top + $t.height()
          if x1 > $(document).width() then $tip.css(left: '', right: 0, top: y0).show()
          else $tip.css(left: Math.max(0, x0), right: '', top: y0).show()
          return
        return

    @layout = @$ide.layout
      defaults: enableCursorHotkey: 0
      north: spacing_closed: 0, spacing_open: 0, resizable: 0, togglerLength_open: 0
      east:  spacing_closed: 0, size: '0%',      resizable: 1, togglerLength_open: 0
      south: spacing_closed: 0, size: '0%',      resizable: 1, togglerLength_open: 0
      center: onresize: => (for _, widget of @wins then widget.updateSize()); @wins[0].scrollCursorIntoView(); return
      fxName: ''
    for d in ['east', 'south'] then @layout.close d; @layout.sizePane d, '50%'
    if !prefs.showLanguageBar() then @layout.hide 'north'
    @wins[0].updateSize()

    themes = ['Modern', 'Redmond', 'Cupertino', 'Freedom'] # default is set in init.coffee to prevent FOUC
    themeClasses = themes.map (x) -> "theme-#{x.toLowerCase()}"
    allThemeClasses = themeClasses.join ' '

    D.editorsOnTop = prefs.editorsOnTop()
    prefs.showLanguageBar (x) -> ide.layout[if x then 'show' else 'hide'] 'north'; return

    extraOpts =
      NEW: key: 'Ctrl+N'
      QIT: key: 'Ctrl+Q'
      ZMI: key: 'Ctrl+=', dontBindKey: 1
      ZMO: key: 'Ctrl+-', dontBindKey: 1
      ZMR: key: 'Ctrl+0', dontBindKey: 1
      LBR: checkBoxPref: prefs.showLanguageBar
      FLT: checkBoxPref: prefs.floatNewEditors
      WRP: checkBoxPref: prefs.sessionLineWrapping
      TOP: checkBoxPref: prefs.editorsOnTop
      DMN: key: 'Ctrl+Shift+N'
      DMP: key: 'Ctrl+Shift+P'
      ABT: key: 'Shift+F1', dontBindKey: 1
      THM: items: themes.map (x, i) ->
        '': x, group: 'themes', checked: prefs.theme() == x.toLowerCase(), action: ->
          prefs.theme x.toLowerCase(); $('body').removeClass(allThemeClasses).addClass themeClasses[i]; return

    parseMenuDescription = (md) ->
      stack = [ind: -1, items: []]
      for s in md.split '\n' when !/^\s*$/.test s = s.replace /#.*/, ''
        cond = ''; s = s.replace /\{(.*)\}/, (_, x) -> cond = x; ''
        cmd = ''; s = s.replace /\=([A-Z][A-Z0-9]{1,2})\b/, (_, x) -> cmd = x; ''
        url = ''; s = s.replace /\=(http:\/\/\S+)/, (_, x) -> url = x; ''
        h = ind: s.replace(/\S.*/, '').length, '': s.replace /^\s*|\s*$/g, ''
        while h.ind <= stack[stack.length - 1].ind then stack.pop()
        if !cond || do new Function "var browser=!#{D.nwjs},mac=#{D.mac};return(#{cond})"
          (stack[stack.length - 1].items ?= []).push h
        stack.push h
        if cmd
          h.action = do (cmd = cmd) -> ->
            if f = CodeMirror.commands[cmd] then f ide.wins[ide.focusedWinId].cm
            else if ide[cmd] then ide[cmd]()
            else $.alert "Unknown command: #{cmd}"
            return
        else if url
          h.action = do (url = url) -> -> D.openExternal url; return
        $.extend h, extraOpts[cmd]
      stack[0].items

    D.installMenu parseMenuDescription prefs.menu()
    return

  setHostAndPort: (@host, @port) -> @updateTitle(); return

  emit: (x, y) -> @isDead || D.socket.emit x, y; return
  WI: -> @emit 'WeakInterrupt'; return
  SI: -> @emit 'StrongInterrupt'; return

  die: -> # don't really, just pretend
    if !@isDead then @isDead = 1; @$ide.addClass 'disconnected'; for _, widget of @wins then widget.die()
    return

  updateTitle: -> # add updateTitle() as a change listener for preference "windowTitle"
    ri = D.remoteIdentification || {}; v = D.versionInfo
    t = prefs.windowTitle().replace /\{(\w+)\}/g, (g0, g1) =>
      switch g1.toUpperCase()
        when 'WSID'       then @wsid || ''
        when 'HOST'       then @host || ''
        when 'PORT'       then @port || ''
        when 'PID'        then ri.pid || ''
        when 'CHARS'      then (ri.arch || '').split('/')[0] || ''
        when 'BITS'       then (ri.arch || '').split('/')[1] || ''
        when 'VER_A'      then (ri.version || '').split('.')[0] || ''
        when 'VER_B'      then (ri.version || '').split('.')[1] || ''
        when 'VER_C'      then (ri.version || '').split('.')[2] || ''
        when 'VER'        then ri.version || ''
        when 'RIDE_VER_A' then (v.version || '').split('.')[0] || ''
        when 'RIDE_VER_B' then (v.version || '').split('.')[1] || ''
        when 'RIDE_VER_C' then (v.version || '').split('.')[2] || ''
        when 'RIDE_VER'   then v.version || ''
        else g0
    $('title').text if /^\s*$/.test t then 'Dyalog' else t
    return

  showHTML: ({title, html}) ->
    init = =>
      @w3500.document.body.innerHTML = html
      @w3500.document.getElementsByTagName('title')[0].innerHTML = esc title || '3500⌶'
      return
    if !@w3500 || @w3500.closed
      @w3500 = open 'empty.html', '3500 I-beam', 'width=800,height=500'
      @w3500.onload = init
    else
      @w3500.focus(); init()
    return

  openWindow: (ee) -> # "ee" for EditableEntity
    w = ee.token
    editorOpts = id: w, name: ee.name, debugger: ee.debugger, emit: @emit.bind(@), weakInterrupt: @WI.bind(@)
    if prefs.floatNewEditors() && !D.floating && !@isDead
      if D.open "index.html?win=#{w}", $.extend {width: 500, height: 400, title: ee.name}, prefs.floatingWindowInfos()[w]
        # D.wins[w] will be replaced a bit later by code running in the popup
        (D.pendingEditors ?= {})[w] = {editorOpts, ee, ide: @}
        done = 1
      else
        $.alert 'Popups are blocked.'
    if !done
      @layout.open dir = if ee.debugger then 'south' else 'east'
      $("<li id=wintab#{w}><a href=#win#{w}></a></li>").appendTo(".ui-layout-#{dir} ul")
        .find('a').text(ee.name).click (e) => e.which == 2 && @wins[w].EP(); return # middle click
      $tabContent = $("<div class=win id=win#{w}></div>").appendTo ".ui-layout-#{dir}"
      (@wins[w] = new Editor @, $tabContent, editorOpts).open ee
      $(".ui-layout-#{dir}").tabs('refresh').tabs(active: -1)
        .data('ui-tabs').panels.off 'keydown' # prevent jQueryUI tabs from hijacking our keystrokes, <C-Up> in particular
      @wins[0].scrollCursorIntoView()
    return

  CNC: -> D.rideConnect();    return
  NEW: -> D.rideNewSession(); return
  QIT: -> D.quit();           return
  PRF: -> prefsUI();          return
  ZMI: -> D.zoomIn();         return
  ZMO: -> D.zoomOut();        return
  ZMR: -> D.resetZoom();      return
  ABT: -> about();            return

  DMR: -> # Run Demo Script
    ide = @
    $('<input type=file style=display:none>').appendTo('body').trigger('click').change ->
      if @value then D.readFile @value, 'utf8', (err, s) ->
        if err then console?.error? err; $.alert 'Cannot load demo file'
        else ide.demoLines = s.replace(/^[\ufeff\ufffe]/, '').split /\r?\n/; ide.demoIndex = -1
        return
      return
    return

  DMN: -> @demoMove  1; return # demo next
  DMP: -> @demoMove -1; return # demo prev
  demoMove: (d) ->
    if 0 <= @demoIndex + d < @demoLines.length
      @demoIndex += d; @wins[0].loadLine @demoLines[@demoIndex]
    return

  LBR: -> prefs.showLanguageBar    .toggle(); return
  FLT: -> prefs.floatNewEditors    .toggle(); return
  WRP: -> prefs.sessionLineWrapping.toggle(); return
  TOP: -> prefs.editorsOnTop       .toggle(); return
  THM: -> # ignore
