do ->
  if window.require?
    nww = require('nw.gui').Window.get()
    $ -> # font size control in node-webkit
      $(document)
        .on 'menu-select', '.m-zi', zi = -> nww.zoomLevel++;   false
        .on 'menu-select', '.m-zo', zo = -> nww.zoomLevel--;   false
        .on 'menu-select', '.m-zr', zr = -> nww.zoomLevel = 0; false
        .on 'keydown', '*', 'ctrl+shift+= ctrl+=', zi
        .on 'keydown', '*', 'ctrl+-',              zo
        .on 'keydown', '*', 'ctrl+0',              zr
      return
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
      ed.setValue ed0.getValue(); ed.setCursorIndex ed0.getCursorIndex(); ed.updateSize(); ed.focus()
      return
  else
    if window.require? # are we running under node-webkit?
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

  $ -> $(document).on 'keydown', '*', 'shift+f1', -> Dyalog.about(); false
  return
