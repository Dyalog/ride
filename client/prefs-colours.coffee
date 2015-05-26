prefs = require './prefs'
{join} = require './util'
{defaults} = require './colours'

@name = 'Colours'

sampleCode = '''
  dfn←{
    0 1j2.3 'string' ⍝ comment
    +/-⍣×A:⍺∇⍵[i;j]
    {{{{nested}}}}
  }
  ∇tradfn;local
    label:
    :if condition
      {⍵[⍋⍵]}
      global←0 ⋄ ⎕error
    :endif
  ∇
'''

$cm = cm = null # DOM element and CodeMirror instance for displaying sample code

@init = ($e) ->
  u = []; (for [_, x] in defaults when 0 < u.indexOf x then u.push x); u.sort()
  $e
    .html """
      <div id=col-settings>
        #{join defaults.map ([x]) -> "<div><input id=col-input-#{x} type=color list=col-list> #{x}</div>"}
        <datalist id=col-list>#{join u.map (x) -> "<option value='#{x}'/>"}</datalist>
      </div>
      <div id=col-cm></div>
    """
  $cm = $ '#col-cm'; cm = new CodeMirror $cm[0]
  $('#col-settings input[type=color]').change updateSampleStyle
  return

@load = ->
  h = prefs.colours(); for [x, d] in defaults then $("#col-input-#{x}").val h[x] || d
  cm.setSize $cm.width(), $cm.height(); cm.setValue sampleCode; updateSampleStyle(); return

@save = ->
  h = {}; for [x, d] in defaults then v = $("#col-input-#{x}").val(); if v != d then h[x] = v
  prefs.colours h; return

@resize = -> cm.setSize $cm.width(), $cm.height(); return

updateSampleStyle = ->
  $('#col-sample-style').text join defaults.map ([x]) -> "#col-cm .cm-apl-#{x}{color:#{$("#col-input-#{x}").val()}}"
  return
