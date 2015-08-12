connect = require './connect'
{Editor} = require './editor'
about = require './about'
{IDE} = require './ide'
prefs = require './prefs'
{delay} = require './util'
require './prefs-colours' # load it in order to initialize syntax highlighting
require './demo'
require './codemirror-foldgutter'

$ ->
  CodeMirror.defaults.dragDrop = false
  window.ondragover = window.ondrop = (e) -> e.preventDefault(); false

  if D.nwjs
    zM = 11 # zoom level can be from -zM to zM inclusive
    $.extend CodeMirror.commands,
      ZMI: -> prefs.zoom Math.min  zM, prefs.zoom() + 1; return
      ZMO: -> prefs.zoom Math.max -zM, prefs.zoom() - 1; return
      ZMR: -> prefs.zoom 0; return
    $('body').addClass "zoom#{prefs.zoom()}"
    prefs.zoom (z) ->
      for _, w of D.wins
        $b = $ 'body', w.getDocument()
        $b.prop 'class', "zoom#{z} " + $b.prop('class').split(/\s+/).filter((s) -> !/^zoom-?\d+$/.test s).join ' '
        w.refresh()
      D.wins[0].scrollCursorIntoView()
      return

  D.open ?= (url, {x, y, width, height}) ->
    spec = 'resizable=1'
    if width? && height? then spec += ",width=#{width},height=#{height}"
    if x? && y? then spec += ",left=#{x},top=#{y},screenX=#{x},screenY=#{y}"
    !!open url, '_blank', spec

  D.openExternal ?= (url) -> open url, '_blank'; return
  D.setTitle ?= (s) -> document.title = s; return

  urlParams = {}
  for kv in (location + '').replace(/^[^\?]*($|\?)/, '').split '&'
    [_, k, v] = /^([^=]*)=?(.*)$/.exec kv; urlParams[unescape k || ''] = unescape v || ''
  if D.floating && (win = urlParams.win)?
    $('body').addClass('floating-window').html('<div class=ui-layout-center></div>').layout
      defaults: {enableCursorHotkey: 0}, fxName: '', center: {onresize: -> ed?.updateSize(); return}
    {editorOpts, ee, ide} = opener.D.pendingEditors[win]
    D.wins = opener.D.wins
    ed = opener.D.wins[win] = new Editor ide, $('.ui-layout-center'), editorOpts; ed.open ee; ed.updateSize()
    D.setTitle ed.name; window.onbeforeunload = -> ed.onbeforeunload()
    delay 500, -> ed.refresh(); return # work around a rendering issue on Ubuntu
    opener.D.ide.unblock()
  else
    D.socket = do(D.createSocket || -> eio (if location.protocol == 'https:' then 'wss://' else 'ws://') + location.host)
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

  # CSS class to indicate theme
  if !prefs.theme() then prefs.theme(
    if D.mac || /^(darwin|mac|ipad|iphone|ipod)/i.test navigator?.platform then 'cupertino'
    else if D.win || /^win/.test navigator?.platform then 'redmond'
    else 'classic'
  )
  $('body').addClass "theme-#{prefs.theme()}"
  prefs.theme (x, old) ->
    $('body').removeClass("theme-#{old}").addClass("theme-#{x}")
    D.ide?.layout.resizeAll()
    return

  # CSS class to indicate platform (NW.js-only)
  if D.nwjs
    D.mac && $('body').addClass 'platform-mac'
    D.win && $('body').addClass 'platform-windows'

  # CSS class for focused window
  $(window).on 'focus blur', (e) -> $('body').toggleClass 'window-focused', window.focused = e.type == 'focus'
  window.focused = true

  # Some library is doing "localStorage.debug=undefined" instead of "delete localStorage.debug".
  # It doesn't work that way.  It may work for other objects, but the values in localStorage
  # are always strings and that leaves us with 'undefined' as a string.  So, let's clean up...
  delete localStorage.debug

  return
