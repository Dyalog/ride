prefs = require './prefs'
{join, dict} = require './util'

@name = 'Colours'

groups = [ # information about syntax highlighting groups
  # t: short identifier for the token type, used for storing customisations in localStorage
  # c: css class
  # s: name to display in the UI
  # d: default style
  {t:'0',  c:'cm-apl-number',           s:'number',           d:{fg:'#888888'}}
  {t:"'",  c:'cm-apl-string',           s:'string',           d:{fg:'#008888'}}
  {t:'⍬',  c:'cm-apl-zilde',            s:'zilde',            d:{fg:'#000088'}}
  {t:'a',  c:'cm-apl-name',             s:'name',             d:{fg:'#888888'}}
  {t:'A',  c:'cm-apl-global-name',      s:'global name',      d:{fg:'#000000'}}
  {t:'⎕',  c:'cm-apl-quad-name',        s:'quad name',        d:{fg:'#880088'}}
  {t:'+',  c:'cm-apl-function',         s:'function',         d:{fg:'#000088'}}
  {t:'/',  c:'cm-apl-monadic-operator', s:'monadic operator', d:{fg:'#0000ff'}}
  {t:'.',  c:'cm-apl-dyadic-operator',  s:'dyadic operator',  d:{fg:'#0000ff'}}
  {t:'#',  c:'cm-apl-namespace',        s:'namespace',        d:{fg:'#888888'}}
  {t:'←',  c:'cm-apl-assignment',       s:'assignment',       d:{fg:'#0000ff'}}
  {t:'⋄',  c:'cm-apl-diamond',          s:'diamond',          d:{fg:'#0000ff'}}
  {t:'(',  c:'cm-apl-paren',            s:'parenthesis',      d:{fg:'#0000ff'}}
  {t:'[',  c:'cm-apl-bracket',          s:'bracket',          d:{fg:'#0000ff'}}
  {t:';',  c:'cm-apl-semicolon',        s:'semicolon',        d:{fg:'#0000ff'}}
  {t:'{',  c:'cm-apl-dfn',              s:'dfn',              d:{fg:'#0000ff'}}
  {t:'{1', c:'cm-apl-dfn1',             s:'dfn level 1',      d:{fg:'#0000ff'}}
  {t:'{2', c:'cm-apl-dfn2',             s:'dfn level 2',      d:{fg:'#0000ff'}}
  {t:'{3', c:'cm-apl-dfn3',             s:'dfn level 3',      d:{fg:'#0000ff'}}
  {t:'∇',  c:'cm-apl-tradfn',           s:'tradfn',           d:{fg:'#888888'}}
  {t:':',  c:'cm-apl-keyword',          s:'keyword',          d:{fg:'#880000'}}
  {t:'l:', c:'cm-apl-label',            s:'label',            d:{fg:'#000000'}}
  {t:'i',  c:'cm-apl-idiom',            s:'idiom',            d:{fg:'#0000ff'}}
  {t:'⍝',  c:'cm-apl-comment',          s:'comment',          d:{fg:'#008888'}}
  {t:'!',  c:'cm-apl-error',            s:'error',            d:{fg:'#ff0000'}}
]

renderCSS = (v, rp = '') -> # v: the value of localStorage.hi parsed as JSON, rp: CSS rule prefix
  join groups.map (g) ->
    h = $.extend {}, g.d, v[g.t] # h: effective style
    """
      #{rp} .#{g.c}{
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
  dfn←{ ⍝ sample
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
  u = []; (for g in groups when 0 < u.indexOf g.d.fg then u.push g.d.fg); u.sort() # u: unique colours from the defaults
  $e.html """
    <div id=col-cm></div>
    <div id=col-settings>
      #{join groups.map (g) -> "<div><input type=color list=col-list> #{g.s}</div>"}
      <datalist id=col-list>#{join u.map (c) -> "<option value=#{c} />"}</datalist>
    </div>
  """
  $cm = $ '#col-cm'
  cm = new CodeMirror $cm[0],
    lineNumbers: true, firstLineNumber: 0, lineNumberFormatter: (i) -> "[#{i}]"
    indentUnit: 4, scrollButtonHeight: 12, matchBrackets: true, autoCloseBrackets: {pairs: '()[]{}', explode: '{}'}
  $fg = $('#col-settings input[type=color]').change updateSampleStyle
  return

@load = ->
  v = prefs.hi(); for g, i in groups then $fg.eq(i).val v[g.t]?.fg || g.d.fg
  cm.setSize $cm.width(), $cm.height(); cm.setValue sampleCode; updateSampleStyle(); return

@save = ->
  prefs.hi dict groups.map((g, i) -> c = $fg.eq(i).val(); if c != g.d.fg then [g.t, fg: c]).filter (x) -> !!x
  return

@resize = -> cm.setSize $cm.width(), $cm.height(); return

updateSampleStyle = ->
  v = dict groups.map (g, i) -> [g.t, fg: $fg.eq(i).val()]
  $('#col-sample-style').text renderCSS v, '#col-cm'; return
