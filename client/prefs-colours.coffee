prefs = require './prefs'
{join, dict} = require './util'

@name = 'Colours'

defaults = [
  ['number',           fg: '#888888']
  ['string',           fg: '#008888']
  ['zilde',            fg: '#000088']
  ['name',             fg: '#888888']
  ['global-name',      fg: '#000000']
  ['quad-name',        fg: '#880088']
  ['function',         fg: '#000088']
  ['monadic-operator', fg: '#0000ff']
  ['dyadic-operator',  fg: '#0000ff']
  ['namespace',        fg: '#888888']
  ['assignment',       fg: '#0000ff']
  ['diamond',          fg: '#0000ff']
  ['paren',            fg: '#0000ff']
  ['bracket',          fg: '#0000ff']
  ['semicolon',        fg: '#0000ff']
  ['dfn',              fg: '#0000ff']
  ['dfn1',             fg: '#0000ff']
  ['dfn2',             fg: '#0000ff']
  ['dfn3',             fg: '#0000ff']
  ['tradfn',           fg: '#888888']
  ['keyword',          fg: '#880000']
  ['label',            fg: '#000000']
  ['idiom',            fg: '#0000ff']
  ['comment',          fg: '#008888']
  ['error',            fg: '#ff0000']
]

renderCSS = (v, rp = '') -> # v: the value of localStorage.hi parsed as JSON, rp: rule prefix
  join defaults.map ([g, d]) -> # g: group name, d: default style
    h = $.extend {}, d, v[g] # h: effective style
    """
      #{rp} .cm-apl-#{g}{
        color:#{h.fg};
        #{h.bg         && "background-color:#{h.bg}"   || ''}
        #{h.bold       && 'font-weight:bold;'          || ''}
        #{h.italic     && 'font-style:italic;'         || ''}
        #{h.underlined && 'text-decoration:underline;' || ''}
      }
    """

prefs.hi updateStyle = (v) -> $('#col-style').text renderCSS v; return
$ -> updateStyle prefs.hi(); return

sampleCode = '''
  dfn←{ ⍝ comment
    0 ¯1.2e¯3j¯.45 'string' ⍬
    +/-⍣×A:⍺∇⍵[i;j]
    {{{nested}}}
  }
  ∇{R}←{X}tradfn Y;local
    label:
    :if condition
      {⍵[⍋⍵]}
      global←0 ⋄ ⎕error
    :endif
  ∇
'''

$cm = cm = null # DOM element and CodeMirror instance for displaying sample code
$fg = null # <input>-s with type=color

@init = ($e) ->
  u = []; (for [_, {fg}] in defaults when 0 < u.indexOf fg then u.push fg); u.sort() # u: unique colours from the defaults
  $e.html """
    <div id=col-settings>
      #{join defaults.map ([g]) -> "<div><input type=color list=col-list> #{g}</div>"}
      <datalist id=col-list>#{join u.map (c) -> "<option value=#{c} />"}</datalist>
    </div>
    <div id=col-cm></div>
  """
  $cm = $ '#col-cm'; cm = new CodeMirror $cm[0]
  $fg = $('#col-settings input[type=color]').change updateSampleStyle
  return

@load = ->
  v = prefs.hi(); for [g, {fg}], i in defaults then $fg.eq(i).val v[g]?.fg || fg
  cm.setSize $cm.width(), $cm.height(); cm.setValue sampleCode; updateSampleStyle(); return

@save = ->
  prefs.hi dict defaults.map(([g, {fg}], i) -> c = $fg.eq(i).val(); if c != fg then [g, {fg}]).filter (x) -> !!x
  return

@resize = -> cm.setSize $cm.width(), $cm.height(); return

updateSampleStyle = ->
  v = dict defaults.map ([g], i) -> [g, fg: $fg.eq(i).val()]
  $('#col-sample-style').text renderCSS v, '#col-cm'; return
