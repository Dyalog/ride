# NW.js-specific initialisation
@D ?= {}
if process? then do ->
  gui = require 'nw.gui'; crypto = require 'crypto'; fs = require 'fs'; nomnom = require 'nomnom'
  path = require 'path'; {spawn} = require 'child_process'; {Proxy} = require './proxy'
  D.nwjs = true
  D.process = process

  nww = gui.Window.get()
  if opener
    opener.D.floatingWindows.push nww
  else
    D.floatingWindows = []
    nww.on 'focus', -> D.floatingWindows.forEach((x) -> x.setAlwaysOnTop true ); return
    nww.on 'blur',  -> D.floatingWindows.forEach((x) -> x.setAlwaysOnTop false); return
    # restore window state:
    try wi = JSON.parse localStorage.winInfo || null
    if wi
      if wi.x? && wi.y? then nww.moveTo wi.x, wi.y
      if wi.width && wi.height then nww.resizeTo wi.width, wi.height
  nww.show()
  nww.on 'close', ->
    process.nextTick -> nww.close true; return
    if opener
      (fw = opener.D.floatingWindows).splice fw.indexOf(nww), 1
    else do -> # save window state:
      i = x: nww.x, y: nww.y, width: nww.width, height: nww.height
      localStorage.winInfo = JSON.stringify i
      return
    window.onbeforeunload?(); window.onbeforeunload = null; return
  nww.zoomLevel = +localStorage.zoom || 0
  $ ->
    contextMenu = null
    $(document)
      .on 'keydown', '*', 'ctrl+= ctrl+shift+=', D.zoomIn    = -> localStorage.zoom = ++nww.zoomLevel;   false
      .on 'keydown', '*', 'ctrl+-',              D.zoomOut   = -> localStorage.zoom = --nww.zoomLevel;   false
      .on 'keydown', '*', 'ctrl+0',              D.resetZoom = -> localStorage.zoom = nww.zoomLevel = 0; false
      .on 'keydown', '*', 'f12', -> nww.showDevTools(); false
      .on 'contextmenu', (e) ->
        if !contextMenu
          contextMenu = new gui.Menu
          ['Cut', 'Copy', 'Paste'].forEach (x) ->
            contextMenu.append new gui.MenuItem label: x, click: (-> document.execCommand x; return); return
        contextMenu.popup e.clientX, e.clientY
        false
    return

  # external editors (available only under nwjs)
  tmpDir = process.env.TMPDIR || process.env.TMP || process.env.TEMP || '/tmp'
  if editorExe = process.env.DYALOG_IDE_EDITOR || process.env.EDITOR
    D.openInExternalEditor = (text, line, callback) ->
      tmpFile = path.join tmpDir, "#{crypto.randomBytes(8).toString 'hex'}.dyalog"
      callback0 = callback
      callback = (args...) -> fs.unlink tmpFile, -> callback0 args... # make sure to delete file before calling callback
      fs.writeFile tmpFile, text, {mode: 0o600}, (err) ->
        if err then callback err; return
        child = spawn editorExe, [tmpFile], cwd: tmpDir, env: $.extend {}, process.env,
          DYALOG_IDE_FILE: tmpFile
          DYALOG_IDE_LINE_NUMBER: 1 + line
        child.on 'error', callback
        child.on 'exit', (c, s) ->
          if c || s then callback('Editor exited with ' + if c then 'code ' + c else 'signal ' + s); return
          fs.readFile tmpFile, 'utf8', callback; return
        return
      return

  D.createSocket = ->
    class LocalSocket
      emit: (a...) -> @other.onevent data: a
      onevent: ({data}) -> (for f in @[data[0]] or [] then f data[1..]...); return
      on: (e, f) -> (@[e] ?= []).push f; @
    socket = new LocalSocket; socket1 = new LocalSocket; socket.other = socket1; socket1.other = socket
    setTimeout (-> Proxy() socket1), 1
    socket

  D.quit = -> gui.Window.get().close(); return
  D.clipboardCopy = (s) -> gui.Clipboard.get().set s; return
  D.opts = nomnom.options(
    connect: abbr: 'c', flag: true, metavar: 'HOST[:PORT]'
    listen:  abbr: 'l', flag: true
    spawn:   abbr: 's', flag: true
  ).parse gui.App.argv
  return
