# NW.js-specific initialisation
if process?
  gui = require 'nw.gui'; fs = require 'fs'; nomnom = require 'nomnom'
  path = require 'path'; {spawn} = require 'child_process'; proxy = require './proxy'

  # Detect platform
  #   https://nodejs.org/api/process.html#process_process_platform
  #   https://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
  D.nwjs = 1
  D.win = /^win/i.test process.platform
  D.mac = process.platform == 'darwin'
  D.floating = !!opener

  console.log = (s) -> try process.stdout.write s + '\n' catch then console.log = ->
  D.opts = nomnom.options(
    connect: abbr: 'c', flag: true, metavar: 'HOST[:PORT]'
    listen:  abbr: 'l', flag: true
    spawn:   abbr: 's', flag: true, default: # depends on whether we are a standalone RIDE
      if D.win then false
      else if D.mac then fs.existsSync "#{path.dirname process.execPath}/../../../../Resources/Dyalog/mapl"
      else fs.existsSync "#{path.dirname process.execPath}/../mapl"
    version: abbr: 'v', flag: true, help: 'print version and exit'
  ).parse gui.App.argv

  if D.opts.version then console.log D.versionInfo.version; process.exit 0

  # switch IME locale as early as possible
  if D.win && (!localStorage.ime || localStorage.ime == '1') &&
        fs.existsSync setImeExe = process.execPath.replace /[^\\\/]+$/, 'set-ime.exe'
    spawn setImeExe, [process.pid], stdio: ['ignore', 'ignore', 'ignore']

  segmOverlap = (a, b, c, d) -> a < d && c < b # Do the two segments ab and cd overlap?

  rectOverlap = (r0, r1) -> ( # A rectangle is {x,y,width,height}.  Do the two overlap?
    segmOverlap(r0.x, r0.x + r0.width,  r1.x, r1.x + r1.width) &&
    segmOverlap(r0.y, r0.y + r0.height, r1.y, r1.y + r1.height)
  )

  segmFit = (a, b, A, B) -> # Nudge and/or squeeze "ab" as necessary so it fits into "AB".
    if b - a > B - A then [A, B] else if a < A then [A, A + b - a] else if b > B then [B - b + a, B] else [a, b]

  rectFit = (r, R) -> # like segmFit but for for rectangles
    [x, x1] = segmFit r.x, r.x + r.width,  R.x, R.x + R.width
    [y, y1] = segmFit r.y, r.y + r.height, R.y, R.y + R.height
    {x, y, width: x1 - x, height: y1 - y}

  restoreWindow = (w, r) -> # w: NWJS window, r: rectangle
    # Find a screen that overlaps with "r" and fit "w" inside it:
    for scr in gui.Screen.screens when rectOverlap scr.work_area, r
      r.maximized || r = rectFit r, scr.work_area
      w.moveTo r.x, r.y; w.resizeTo r.width, r.height
      process.nextTick ->
        w.dx = w.x      - r.x
        w.dy = w.y      - r.y
        w.dw = w.width  - r.width
        w.dh = w.height - r.height
        r.maximized && w.maximize()
        return
      break
    return

  if D.mac then process.env.DYALOG_IDE_INTERPRETER_EXE||=D.lastSpawnedExe=path.resolve process.cwd(),'../Dyalog/mapl'
  process.chdir process.env.PWD || process.env.HOME || '.' # see https://github.com/nwjs/nw.js/issues/648
  D.process = process; gui.Screen.Init(); nww = D.nww = gui.Window.get()

  urlParams = {}
  for kv in (location + '').replace(/^[^\?]*($|\?)/, '').split '&'
    [_, k, v] = /^([^=]*)=?(.*)$/.exec kv; urlParams[unescape k || ''] = unescape v || ''

  do -> # restore window state:
    if D.floating
      opener.D.floatingWindows.push nww
      restoreWindow nww,
        x:         +urlParams.x
        y:         +urlParams.y
        width:     +urlParams.width
        height:    +urlParams.height
        maximized: +urlParams.maximized
    else
      D.floatingWindows = []; D.floatOnTop = 0
      aot = (x) -> (for w in D.floatingWindows when x != !!w.aot then w.aot = x; w.setAlwaysOnTop x); return
      nww.on 'focus', -> aot !!D.floatOnTop; return
      nww.on 'blur',  -> aot false; return
      if localStorage.pos then try
        pos = JSON.parse localStorage.pos
        restoreWindow nww, x: pos[0], y: pos[1], width: pos[2], height: pos[3], maximized: pos[4] || 0
    return
  nww.show(); nww.focus() # focus() is needed for the Mac

  # To "throttle" a function is to make it execute no more often than once every X milliseconds.
  throttle = (f) -> tid = null; -> tid ?= setTimeout (-> f(); tid = null; return), 500; return

  saveWindowState = throttle ->
    posArr = [
      nww.x      - (nww.dx || 0)
      nww.y      - (nww.dy || 0)
      nww.width  - (nww.dw || 0)
      nww.height - (nww.dh || 0)
    ]
    nww.maximized && posArr.push 1
    p =
      if !D.floating                 then 'pos'
      else if +urlParams.tracer      then 'posTracer'
      else if urlParams.token == '1' then 'posEditor'
      else ''
    p && localStorage[p] = JSON.stringify posArr
    return
  nww.on 'move',   saveWindowState
  nww.on 'resize', saveWindowState
  nww.on 'maximize',   -> nww.maximized = 1; saveWindowState(); return
  nww.on 'unmaximize', -> nww.maximized = 0; saveWindowState(); return

  nww.on 'close', ->
    if D.forceClose
      (fw = opener.D.floatingWindows).splice fw.indexOf(nww), 1
      process.nextTick -> nww.close true; return
    else
      window.onbeforeunload?(); if !D.floating then process.nextTick -> process.exit 0; return
    return

  D.forceCloseNWWindow = -> nww.close true; return # used to close floating windows after session is dead

  # Context menu
  opener && D.ide = opener.D.ide
  items = [].concat(
    ['Cut', 'Copy', 'Paste'].map (x) -> label: x, click: -> document.execCommand x; return
    [type: 'separator']
    ['Undo', 'Redo'].map (x) -> label: x, click: -> D.ide?.focusedWin?.cm?[x.toLowerCase()]?(); return
  )
  cmenu = new gui.Menu; for item in items then cmenu.append new gui.MenuItem item
  $(document).contextmenu (e) -> cmenu.popup e.clientX, e.clientY; false

  D.readFile = fs.readFile # needed for presentation mode

  D.createSocket = ->
    class LocalSocket # imitate socket.io's API
      emit: (a...) -> @other.onevent data: a
      onevent: ({data}) -> (for f in @[data[0]] || [] then f data[1..]...); return
      on: (e, f) -> (@[e] ?= []).push f; @
    socket = new LocalSocket; socket1 = new LocalSocket; socket.other = socket1; socket1.other = socket
    proxy.Proxy() socket1
    socket

  {execPath} = process; if D.mac then execPath = execPath.replace /(\/Contents\/).*$/, '$1MacOS/nwjs'
  D.rideConnect = -> spawn execPath, ['--no-spawn'], detached: true, stdio: ['ignore', 'ignore', 'ignore']; return
  D.rideNewSession = ->
    if D.lastSpawnedExe
      env = {}; (for ek, ev of process.env then env[ek] = ev); env.DYALOG_IDE_INTERPRETER_EXE = D.lastSpawnedExe
      spawn execPath, ['-s'], detached: true, stdio: ['ignore', 'ignore', 'ignore'], env: env
    else
      $.alert(
        'The current session is remote.  To connect elsewhere or launch a local interpreter, please use "Connect..." instead.',
        'Cannot Start New Session' # title
      )
    return

  D.quit = -> gui.Window.get().close(); return
  D.clipboardCopy = (s) -> gui.Clipboard.get().set s; return

  # Debugging utilities
  $(document).keydown (e) ->
    if e.which == 123 && !e.altKey # F12
      if     !e.ctrlKey && !e.shiftKey then nww.showDevTools().setAlwaysOnTop 1; false
      else if e.ctrlKey && !e.shiftKey then showProtocolLog(); false

  showProtocolLog = ->
    window.lw = lw = open 'empty.html'
    wr = (s) ->
      if !lw || lw.closed || !lw.document || !lw.document.createTextNode
        i = proxy.log.listeners.indexOf wr; i >= 0 && proxy.log.listeners.splice i, 1; lw = null
      else
        b = lw.document.body; atEnd = b.scrollTop == b.scrollHeight - b.clientHeight
        b.appendChild lw.document.createTextNode s; if atEnd then b.scrollTop = b.scrollHeight - b.clientHeight
      return
    lw.onload = ->
      lw.document.body.innerHTML = '''
        <style>
          body{font-family:monospace;margin:0;padding:0;white-space:pre;
               position:absolute;top:0;bottom:0;left:0;right:0;overflow:scroll}
        </style>
      '''
      lw.document.title = 'RIDE Protocol Log'; wr proxy.log.get().join ''; proxy.log.listeners.push wr
      return
    false

  # expandStackString inserts snippets of code next to each file:///filename.js:123:45
  expandStackString = (s) -> # s: the string from  new Error().stack
    C = 2 # how many lines of context above and below
    s.replace /\(file:\/\/([^\n\r\)]+):(\d+):(\d+)\)/g, (m, f, l, c) ->
      # m:whole match  f:file  l:line  c:col
      if !(f.indexOf('/') == f.indexOf('\\') == -1) then try
        lines = fs.readFileSync(f, 'utf8').split /\r?\n/
        l-- # make "l" a 0-based line number
        l0 = Math.max l - C, 0
        l1 = Math.min l + C, lines.length
        fr = lines[l0..l1] # fragment to show
        ok = 1; for x in fr when x.length > 200 then ok = 0; break
        if ok # if the fragment doesn't contain lines that are too long
          fr = fr.map (x) -> '            ' + x
          fr[l - l0] = '>' + fr[l - l0][1..]
          m += '\n' + fr.join '\n'
      m

  # Error handling
  if !D.floating
    htmlChars = '&': '&amp;', '<': '&lt;', '>': '&gt;'
    htmlEsc = (s) -> s.replace /./g, (x) -> htmlChars[x] || x
    process.on 'uncaughtException', (e) ->
      if window then window.lastError = e
      info = """
        IDE: #{JSON.stringify D.versionInfo}
        Interpreter: #{JSON.stringify(D.remoteIdentification || null)}
        localStorage: #{JSON.stringify localStorage}
        \n#{expandStackString e.stack}\n
        Proxy log:
        #{proxy.log.get().join ''}
      """
      excuses = '''
        Oops... it broke!
        Congratulations, you found a ... THE bug.
        Users-Developers 1:0
        According to our developers this is impossible.
        This bug was caused by cosmic radiation randomly flipping bits.
        You don't find bugs.  Bugs find you.
      '''.split '\n'
      document.write """
        <html>
          <head><title>Error</title></head>
          <body>
            <h3>#{excuses[Math.floor excuses.length * Math.random()]}</h3>
            <h3 style=font-family:apl,monospace>
              <a href="mailto:support@dyalog.com?subject=#{escape 'RIDE crash'}&body=#{escape '\n\n' + info}">support@dyalog.com</a>
            </h3>
            <textarea autofocus style=width:100%;height:90% nowrap>#{htmlEsc info}</textarea>
          </body>
        <html>
      """
      false

  D.open = (url, opts) -> opts.icon = 'D.png'; opts.toolbar ?= false; !!gui.Window.open url, opts
  D.openExternal = gui.Shell.openExternal

  if D.mac && !D.floating # Mac menu
    groups = {} # group name -> array of MenuItem-s

    render = (x) ->
      if !x then return
      if x[''] == '-' then return new gui.MenuItem type: 'separator'
      h = # arguments to MenuItem's constructor
        label: x[''].replace /_/g, ''
        key: if (i = x[''].indexOf '_') >= 0 then x[i + 1] # this doesn't work on the Mac but let's keep it anyway in case we use native menus elsewhere
        type: if x.group || x.checkBoxPref then 'checkbox' else 'normal'
      if x.group
        h.checked = !!x.checked
        h.click = ->
          groups[x.group].forEach (sibling) -> sibling.checked = sibling == mi; return
          x.action?(); return
      else if x.checkBoxPref
        h.checked = !!x.checkBoxPref(); h.click = -> x.action? mi.checked; return
        x.checkBoxPref (v) -> mi.checked = !!v; return
      else
        h.click = -> x.action?(); return
      if x.items then h.submenu = new gui.Menu; for y in x.items then h.submenu.append render y
      mi = new gui.MenuItem h
      if x.group then (groups[x.group] ?= []).push mi
      mi

    D.installMenu = (m) ->
      mb = new gui.Menu type: 'menubar'
      mb.createMacBuiltin 'Dyalog'
      mb.items[0].submenu.removeAt 0 # remove built-in "About Dyalog" that doesn't do anything useful
      mb.items[1].submenu.removeAt 7 # remove "Edit > Select All"
      mb.items[1].submenu.removeAt 2 # remove separator
      mb.items[1].submenu.removeAt 1 # remove "Edit > Undo"
      mb.items[1].submenu.removeAt 0 # remove "Edit > Redo"
      # For "Special Characters..." and "Start Dictation...": see https://github.com/nwjs/nw.js/issues/2812
      # I discovered that if I remove "Copy" they go away, but then Cmd+C stops working.
      for x, ix in m
        if x[''].replace(/_/, '') in ['Edit', 'Help'] then x[''] += ' ' # a hack to get rid of Help>Search
        ourMenu = render x
        if ix
          theirMenu = null; for y in mb.items when y.label == ourMenu.label.replace(/\ $/, '') then theirMenu = y; break
        else
          theirMenu = mb.items[0]
        if theirMenu # try to merge new menu with existing menu
          if theirMenu.label == 'Edit' # again, a special case...  for "Edit" prepend their items instead of appending
            ys = for y, iy in theirMenu.submenu.items then y # does not include "Start Dictation" and "Special Characters..."
            for y in ys then theirMenu.submenu.remove y
            for y, iy in ys then ourMenu.submenu.insert y, iy
          else
            ourMenu.submenu.append new gui.MenuItem type: 'separator'
            while theirMenu.submenu.items.length
              y = theirMenu.submenu.items[0]; theirMenu.submenu.remove y
              ourMenu.submenu.append y
          mb.remove theirMenu
        mb.insert ourMenu, ix
      nww.menu = mb
      return

  # Hacks to make the window title repaint on Windows.  This is a workaround for:
  #   https://github.com/nwjs/nw.js/issues/2895
  #   https://github.com/nwjs/nw.js/issues/2896
  #   https://github.com/nwjs/nw.js/issues/3589
  #   https://github.com/nwjs/nw.js/issues/3658
  if D.win
    $(window).on 'focus blur', repaintTitle = -> nww.resizeBy 0, 1; nww.resizeBy 0, -1; return
    D.setTitle = (s) -> document.title = s; repaintTitle(); return

  if process.env.DYALOG_IDE_JS then $.getScript 'file://' + path.resolve process.cwd(), process.env.DYALOG_IDE_JS
