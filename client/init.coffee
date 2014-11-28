do ->
  if window.require? # are we running under node-webkit?
#     extend = (a...) -> r = {}; (for x in a then for k, v of x then r[k] = v); r
#     {spawn} = require 'child_process'
#     spawn process.env.APL_EXECUTABLE or 'apl', ['+s'], env: extend process.env, RIDE_LISTEN: '0.0.0.0:4502'
    class FakeSocket
      emit: (e, a...) -> @other.onevent e: e, data: a
      onevent: ({e, data}) -> (for f in @[e] or [] then f data...); return
      on: (e, f) -> (@[e] ?= []).push f; return
    socket = new FakeSocket; socket1 = new FakeSocket; socket.other = socket1; socket1.other = socket
    hostPort = require('nw.gui').App?.argv?[0] or prompt 'Connect to:', localStorage?.hostPort or '127.0.0.1:4502'
    if !hostPort then return close()
    localStorage?.hostPort = hostPort
    require('./server').Proxy(hostPort.split(':')...)(socket1)
  else
    socket = io()

  if localStorage?.d
    t0 = +new Date
    log = (s, a...) -> console.info (new Date - t0).toFixed(3) + ' ' + s, a...
    {emit, onevent} = socket
    socket.emit = (a...) -> log 'send:' + JSON.stringify(a)[..1000]; emit.apply socket, a
    socket.onevent = (packet) -> log ' recv:' + JSON.stringify(packet.data)[..1000]; onevent.apply socket, [packet]

  $ -> Dyalog.idePage socket
