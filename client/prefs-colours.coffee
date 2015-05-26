prefs = require './prefs'
{join, dict} = require './util'

@name = 'Colours'

defaults = [
  ['number',           '#888888']
  ['string',           '#008888']
  ['zilde',            '#000088']
  ['name',             '#888888']
  ['global-name',      '#000000']
  ['quad-name',        '#880088']
  ['function',         '#000088']
  ['monadic-operator', '#0000ff']
  ['dyadic-operator',  '#0000ff']
  ['namespace',        '#888888']
  ['assignment',       '#0000ff']
  ['diamond',          '#0000ff']
  ['paren',            '#0000ff']
  ['bracket',          '#0000ff']
  ['semicolon',        '#0000ff']
  ['dfn',              '#0000ff']
  ['dfn1',             '#0000ff']
  ['dfn2',             '#0000ff']
  ['dfn3',             '#0000ff']
  ['tradfn',           '#888888']
  ['keyword',          '#880000']
  ['label',            '#000000']
  ['idiom',            '#0000ff']
  ['comment',          '#008888']
  ['error',            '#ff0000']
]

renderCSS = (v, rp = '') -> # v: the value of localStorage.hi parsed as JSON, rp: rule prefix
  join defaults.map ([g, d]) -> # g: group name, d: default colour
    h = v[g] || col: d
    """
      #{rp} .cm-apl-#{g}{
        color:#{h.col};
        #{h.bold && 'font-weight:bold;' || ''}
        #{h.italic && 'text-decoration:italic;' || ''}
      }
    """

prefs.hi updateStyle = (v) ->
  $('#col-style').text renderCSS v; return

updateStyle prefs.hi()

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
$i = null # <input>-s with type=color

@init = ($e) ->
  u = []; (for [_, c] in defaults when 0 < u.indexOf c then u.push c); u.sort() # u: unique colours from the defaults
  $e.html """
    <div id=col-settings>
      #{join defaults.map ([g]) -> "<div><input type=color list=col-list> #{g}</div>"}
      <datalist id=col-list>#{join u.map (c) -> "<option value=#{c} />"}</datalist>
    </div>
    <div id=col-cm></div>
  """
  $cm = $ '#col-cm'; cm = new CodeMirror $cm[0]
  $i = $('#col-settings input[type=color]').change updateSampleStyle
  return

@load = ->
  v = prefs.hi(); for [g, d], i in defaults then $i.eq(i).val v[g]?.col || d
  cm.setSize $cm.width(), $cm.height(); cm.setValue sampleCode; updateSampleStyle(); return

@save = ->
  prefs.hi dict defaults.map(([g, d], i) -> c = $i.eq(i).val(); if c != d then [g, col: c]).filter (x) -> !!x
  return

@resize = -> cm.setSize $cm.width(), $cm.height(); return

updateSampleStyle = ->
  v = dict defaults.map ([g], i) -> [g, col: $i.eq(i).val()]
  $('#col-sample-style').text renderCSS v, '#col-cm'; return
