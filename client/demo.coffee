# support for presentations

lines = []; index = -1
$i = null # the <input type=file>, lazy init

move = (d) ->
  if 0 <= index + d < lines.length
    index += d; D.ide.wins[0].loadLine lines[index]
  return

$.extend CodeMirror.commands,
  DMN: -> move  1; return # Next Line
  DMP: -> move -1; return # Prev Line
  DMR: -> # Run Demo Script
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
