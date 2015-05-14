connect = require './connect'
{Editor} = require './editor'
about = require './about'
require '../jquery.layout'
{IDE} = require './ide'
require './util'
prefs = require './prefs'

$ ->
  if D.nwjs
    zM = 11 # zoom level magnitude limit
    $ document
      .on 'keydown', '*', 'ctrl+=', D.zoomIn    = -> prefs.zoom Math.min  zM, prefs.zoom() + 1; false
      .on 'keydown', '*', 'ctrl+-', D.zoomOut   = -> prefs.zoom Math.max -zM, prefs.zoom() - 1; false
      .on 'keydown', '*', 'ctrl+0', D.resetZoom = -> prefs.zoom 0; false
      .on 'keydown', '*', 'ctrl+shift+=', D.zoomIn
    $('body').addClass "zoom#{prefs.zoom()}"
    prefs.zoom (z) ->
      for _, w of D.wins
        $b = $ 'body', w.getDocument()
        $b.prop 'class', "zoom#{z} " + $b.prop('class').split(/\s+/).filter((s) -> !/^zoom-?\d+$/.test s).join ' '
        w.refresh()
      return

  D.open ?= (url, {x, y, width, height}) ->
    spec = 'resizable=1'
    if width? && height? then spec += ",width=#{width},height=#{height}"
    if x? && y? then spec += ",left=#{x},top=#{y},screenX=#{x},screenY=#{y}"
    !!open url, '_blank', spec

  D.openExternal ?= (url) -> open url, '_blank'; return

  urlParams = {}
  for kv in (location + '').replace(/^[^\?]*($|\?)/, '').split '&'
    [_, k, v] = /^([^=]*)=?(.*)$/.exec kv; urlParams[unescape(k or '')] = unescape(v or '')
  if D.floating && (win = urlParams.win)?
    $('body').addClass('floating-window').html('<div class=ui-layout-center></div>').layout
      defaults: {enableCursorHotkey: 0}, fxName: '', center: {onresize: -> ed?.updateSize(); return}
    {editorOpts, ee, ide} = opener.D.pendingEditors[win]
    D.wins = opener.D.wins
    ed = opener.D.wins[win] = new Editor ide, $('.ui-layout-center'), editorOpts; ed.open ee; ed.updateSize()
    $('title').text ed.name; window.onbeforeunload = -> ed.onbeforeunload()
    opener.D.ide.unblock()
  else
    D.socket = (D.createSocket || io)()
    D.quit ?= close
    o = D.opts || {} # handle command line arguments
    if o.listen
      cp = connect(); cp.listen o._[0]
    else if o.connect
      cp = connect(); cp.connect o._[0]
    else if o.spawn
      ide = new IDE
      D.socket.emit '*spawn' # '*spawnedError' is handled in ide.coffee
      window.onbeforeunload = -> D.socket.emit 'Exit', code: 0; return
    else
      connect()

  $ document
    .on 'keydown', '*', 'shift+f1', -> about(); false
    .on 'keydown', '*', 'ctrl+tab ctrl+shift+tab', (e) ->
      a = []; i = -1; for _, w of D.wins then (if w.hasFocus() then i = a.length); a.push w
      j = if i < 0 then 0 else if e.shiftKey then (i + a.length - 1) % a.length else (i + 1) % a.length
      $("#wintab#{a[j].id} a").click(); a[j].focus(); false

  # CSS class to indicate theme
  if !prefs.theme() then prefs.theme do ->
    # Detect platform
    #   https://nodejs.org/api/process.html#process_process_platform
    #   https://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
    p = (D.process ? navigator).platform
    if /^(darwin|mac|ipad|iphone|ipod)/i.test p then 'cupertino'
    else if /^(linux|x11|android)/i.test p then 'freedom'
    else 'redmond'
  $('body').addClass "theme-#{prefs.theme()}"
  prefs.theme (x, old) -> $('body').removeClass("theme-#{old}").addClass("theme-#{x}"); return

  # CSS class to indicate platform (NW.js-only)
  if D.nwjs
    if D.mac then $('body').addClass 'platform-mac'
    else if /^win/i.test D.process.platform then $('body').addClass 'platform-windows'

  # CSS class for focused window
  $(window).on 'focus blur', (e) -> $('body').toggleClass 'window-focused', window.focused = e.type == 'focus'
  window.focused = true

  # Some library is doing "localStorage.debug=undefined" instead of "delete localStorage.debug".
  # It doesn't work that way.  It may work for other objects, but the values in localStorage
  # are always strings and that leaves us with 'undefined' as a string.  So, let's clean up...
  delete localStorage.debug

  return
