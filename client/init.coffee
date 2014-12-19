do ->
  if window.require? # are we running under node-webkit?
    class FakeSocket
      emit: (e, a...) -> @other.onevent e: e, data: a
      onevent: ({e, data}) -> (for f in @[e] or [] then f data...); return
      on: (e, f) -> (@[e] ?= []).push f; @
    socket = new FakeSocket; socket1 = new FakeSocket; socket.other = socket1; socket1.other = socket
    require('./proxy').Proxy()(socket1)
  else
    socket = io()
  Dyalog.socket = socket
  $ ->
    $('body').on 'keydown', (e) ->
      if e.which == 112 && !e.ctrlKey && e.shiftKey && !e.altKey
        alert "Version: #{Dyalog.version}\nBuild date: #{Dyalog.buildDate}"; false
    Dyalog.welcomePage()
