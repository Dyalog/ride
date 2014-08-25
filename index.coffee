jQuery ($) ->
  socket = io()
  send = (a...) -> console.info 'send:', a...; socket.emit a...
  recv = (x, f) -> socket.on x, (a...) -> console.info 'recv:', x, a...; f a...

  recv 'add', (s) -> cm.setValue cm.getValue() + s
  recv 'prompt', ->
    cm.replaceRange '      ', line: cm.lineCount() - 1, ch: 0
    cm.setCursor cm.lineCount() - 1, 6

  cm = CodeMirror document.getElementById('session'),
    autofocus: true
    value: '      '
    extraKeys:
      'Enter': ->
        l = cm.lineCount() - 1
        s = cm.getLine l
        cm.replaceRange '', {line: l, ch: 0}, {line: l, ch: s.length}
        send 'exec', s + '\n'
  cm.setCursor 0, 6

  $(window).resize(-> cm.setSize null, $(window).height() - 2).resize()

  window.socket = socket
  window.cm = cm
