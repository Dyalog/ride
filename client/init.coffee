do ->
  Dyalog.nwjs = process?
  if Dyalog.nwjs
    nww = require('nw.gui').Window.get()
    # restore window state:
    winProps = 'x y width height isFullscreen'.split ' '
    do -> if winInfo = (try JSON.parse localStorage.winInfo) then for p in winProps then nww[p] = winInfo[p]
    nww.show()
    nww.on 'close', ->
      # save window state:
      winInfo = {}; (for p in winProps then winInfo[p] = nww[p]); localStorage.winInfo = JSON.stringify winInfo
      window.onbeforeunload?(); window.onbeforeunload = null; nww.close true; return
    Dyalog.zoomIn    = -> nww.zoomLevel++;   return
    Dyalog.zoomOut   = -> nww.zoomLevel--;   return
    Dyalog.resetZoom = -> nww.zoomLevel = 0; return
    $(document).on 'keydown', '*', 'f12', -> nww.showDevTools(); false
  Dyalog.urlParams = {}
  for kv in (location + '').replace(/^[^\?]*($|\?)/, '').split '&'
    [_, k, v] = /^([^=]*)=?(.*)$/.exec kv; Dyalog.urlParams[unescape(k or '')] = unescape(v or '')
  if opener && (win = Dyalog.urlParams.win)? # are we running in a floating editor window?
    $ ->
      wins = opener.Dyalog.wins
      $('body').html('<div class="ui-layout-center"></div>').layout
        defaults: enableCursorHotkey: 0
        center: onresize: -> ed?.updateSize(); return
        fxName: ''
      ed0 = wins[win]; ed = wins[win] = Dyalog.Editor $('.ui-layout-center'), ed0.getOpts()
      ed.setValue ed0.getValue(); ed.setCursorIndex ed0.getCursorIndex(); ed.updateSize(); ed.focus(); ed0 = null
      window.onbeforeunload = -> ed.saveAndClose(); return
      return
  else
    if Dyalog.nwjs
      class FakeSocket
        emit: (a...) -> @other.onevent data: a
        onevent: ({data}) -> (for f in @[data[0]] or [] then f data[1..]...); return
        on: (e, f) -> (@[e] ?= []).push f; @
      socket = new FakeSocket; socket1 = new FakeSocket; socket.other = socket1; socket1.other = socket
      setTimeout (-> require('./proxy').Proxy() socket1), 1
      Dyalog.quit = -> require('nw.gui').Window.get().close(); return
    else
      socket = io()
      Dyalog.quit = close
    Dyalog.socket = socket
    $ -> Dyalog.connectPage(); return

  return
