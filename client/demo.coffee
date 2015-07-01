{delay} = require './util'

# support for presentations

lines = []; index = -1
$i = null # the <input type=file>, lazy init

move = (d) ->
  if 0 <= index + d < lines.length
    index += d; D.ide.wins[0].loadLine lines[index]
  return

# Key display mode:
$p = null # $p: DOM element for the pending key or null if key display mode is off
keyInfo = (e) -> # returns a pair of the key name and an "is complete" flag
  s = '' # key name
  e.shiftKey && s += 'Shift-'
  e.ctrlKey  && s += 'Ctrl-'
  e.altKey   && s += 'Alt-'
  k = CodeMirror.keyNames[e.which] || "[#{e.which}]"
  c = k !in ['Shift', 'Ctrl', 'Alt'] # c: is the key combination complete?
  c && s += k
  [s, c]
keyDownHandler = (e) ->
  $p.text(s = keyInfo(e)[0]).toggle !!s; return
keyUpHandler = (e) ->
  [s, c] = keyInfo e
  if c
    $p.hide(); $k = $('<span>').text(s).insertBefore $p
    delay 2000, -> $k.fadeOut 1000; return
  else
    $p.text(s).toggle !!s
  return

$.extend CodeMirror.commands,
  DMN: -> move  1; return # next line
  DMP: -> move -1; return # prev line
  DMR: -> # run demo script
    console.info 'dmr', 'D.nwjs', D.nwjs
    if D.nwjs && !D.floating
      ($i ||= $('<input id=demo-input type=file style=display:none>').appendTo 'body')
      .trigger('click').change ->
        if @value then D.readFile @value, 'utf8', (err, s) ->
          if err then console?.error? err; $.alert 'Cannot load demo file'
          else lines = s.replace(/^[\ufeff\ufffe]/, '').split /\r?\n/; index = -1
          return
        return
    return
  DMK: -> # toggle key display mode
    if !$p
      $('body').append $('<div id=demo-keys>').append $p = $('<span>').hide()
      $(document).on('keyup.demo', keyUpHandler).on('keydown.demo', keyDownHandler)
    else
      $(document).off '.demo'; $('#demo-keys').remove(); $p = null
    return
