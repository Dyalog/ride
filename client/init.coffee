do ->
  Dyalog.urlParams = {}
  for kv in (location + '').replace(/^[^\?]*($|\?)/, '').split '&'
    [_, k, v] = /^([^=]*)=?(.*)$/.exec kv; Dyalog.urlParams[unescape(k or '')] = unescape(v or '')
  if opener && (win = Dyalog.urlParams.win)? # are we running in a floating editor window?
    $ ->
      wins = opener.Dyalog.wins
      $('body').html('<div class="ui-layout-center"></div>').css(backgroundColor: 'red').layout
        defaults: enableCursorHotkey: 0
        center: onresize: -> ed?.updateSize(); return
        fxName: ''
      ed0 = wins[win]; ed = wins[win] = Dyalog.Editor $('.ui-layout-center'), ed0.getOpts()
      ed.setValue ed0.getValue(); ed.setCursorIndex ed0.getCursorIndex(); ed.updateSize(); ed.focus()
      return
  else
    if window.require? # are we running under node-webkit?
      class FakeSocket
        emit: (e, a...) -> @other.onevent e: e, data: a
        onevent: ({e, data}) -> (for f in @[e] or [] then f data...); return
        on: (e, f) -> (@[e] ?= []).push f; @
      socket = new FakeSocket; socket1 = new FakeSocket; socket.other = socket1; socket1.other = socket
      require('./proxy').Proxy()(socket1)
      nww = require('nw.gui').Window.get()
      Dyalog.quit = -> nww.close(); return
      $ ->
        $(document)
          .on 'keydown', '*', 'ctrl++ ctrl+=', -> nww.zoomLevel++;   false
          .on 'keydown', '*', 'ctrl+-',        -> nww.zoomLevel--;   false
          .on 'keydown', '*', 'ctrl+0',        -> nww.zoomLevel = 0; false
    else
      socket = io()
      Dyalog.quit = close
    Dyalog.socket = socket
    $ -> Dyalog.connectPage()
  return
