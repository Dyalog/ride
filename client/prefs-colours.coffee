prefs = require './prefs'
{join, dict, qw} = require './util'

@name = 'Colours'

G = [ # information about syntax highlighting groups
  # t: token type, a short name used as a key for storing customisations in localStorage
  # c: css selector
  # s: name to display in the UI
  # d: default style
  {t:' ',  c:'.cm-s-default,.CodeMirror-gutter-wrapper',s:'normal',d:{fg:'#000000',bg:'#ffffff'}}
  {t:'0',  c:'.cm-apl-number',           s:'number',           d:{fg:'#888888'}}
  {t:"'",  c:'.cm-apl-string',           s:'string',           d:{fg:'#008888'}}
  {t:'⍬',  c:'.cm-apl-zilde',            s:'zilde',            d:{fg:'#000088'}}
  {t:'a',  c:'.cm-apl-name',             s:'name',             d:{fg:'#888888'}}
  {t:'A',  c:'.cm-apl-global-name',      s:'global name',      d:{fg:'#000000'}}
  {t:'⎕',  c:'.cm-apl-quad-name',        s:'quad name',        d:{fg:'#880088'}}
  {t:'+',  c:'.cm-apl-function',         s:'function',         d:{fg:'#000088'}}
  {t:'/',  c:'.cm-apl-monadic-operator', s:'monadic operator', d:{fg:'#0000ff'}}
  {t:'.',  c:'.cm-apl-dyadic-operator',  s:'dyadic operator',  d:{fg:'#0000ff'}}
  {t:'#',  c:'.cm-apl-namespace',        s:'namespace',        d:{fg:'#888888'}}
  {t:'←',  c:'.cm-apl-assignment',       s:'assignment',       d:{fg:'#0000ff'}}
  {t:'⋄',  c:'.cm-apl-diamond',          s:'diamond',          d:{fg:'#0000ff'}}
  {t:'(',  c:'.cm-apl-paren',            s:'parenthesis',      d:{fg:'#0000ff'}}
  {t:'[',  c:'.cm-apl-bracket',          s:'bracket',          d:{fg:'#0000ff'}}
  {t:';',  c:'.cm-apl-semicolon',        s:'semicolon',        d:{fg:'#0000ff'}}
  {t:'{',  c:'.cm-apl-dfn',              s:'dfn',              d:{fg:'#0000ff'}}
  {t:'{1', c:'.cm-apl-dfn1',             s:'dfn level 1',      d:{fg:'#0000ff'}}
  {t:'{2', c:'.cm-apl-dfn2',             s:'dfn level 2',      d:{fg:'#0000ff'}}
  {t:'{3', c:'.cm-apl-dfn3',             s:'dfn level 3',      d:{fg:'#0000ff'}}
  {t:'∇',  c:'.cm-apl-tradfn',           s:'tradfn',           d:{fg:'#888888'}}
  {t:':',  c:'.cm-apl-keyword',          s:'keyword',          d:{fg:'#880000'}}
  {t:'l:', c:'.cm-apl-label',            s:'label',            d:{fg:'#000000'}}
  {t:'i',  c:'.cm-apl-idiom',            s:'idiom',            d:{fg:'#0000ff'}}
  {t:'⍝',  c:'.cm-apl-comment',          s:'comment',          d:{fg:'#008888'}}
  {t:'!',  c:'.cm-apl-error',            s:'error',            d:{fg:'#ff0000'}}
  {t:'L',  c:'.CodeMirror-linenumber',   s:'line number',      d:{fg:'#000088'}}
]
H = dict G.map (g, i) -> [g.t, i]

renderCSS = (v, rp = '') -> # v: style objects keyed by token type, rp: css rule prefix
  join G.map (g) ->
    h = $.extend {}, g.d, v[g.t] # h: effective style
    g.c.split(',').map((x) -> rp + ' ' + x).join(',') + '{' +
      (h.fg         && "color:#{h.fg};"             || '') +
      (h.bg         && "background-color:#{h.bg};"  || '') +
      (h.bold       && 'font-weight:bold;'          || '') +
      (h.italic     && 'font-style:italic;'         || '') +
      (h.underlined && 'text-decoration:underline;' || '') +
      '}'

prefs.hi updateStyle = (v) -> $('#col-style').text renderCSS v, '.ride-win'; return
$ -> updateStyle prefs.hi(); return

$cm = cm = null # DOM element and CodeMirror instance for displaying sample code
model = null # an array of style objects, in the same order as "G", initialised in @load()
sel = -1 # index of the selected group

@init = ($e) ->
  u = []; (for g in G when 0 < u.indexOf g.d.fg then u.push g.d.fg); u.sort() # u: unique colours from the defaults
  $e.html """
    <div id=col-cm></div>
    <div id=col-settings>
      <datalist id=col-list>#{join u.map (c) -> "<option value=#{c}>"}</datalist>
      <select id=col-group>#{join G.map (g, i) -> "<option value=#{i}>#{g.s}"}</select>
      <p><input type=checkbox id=col-fg-cb>Foreground <input type=color id=col-fg list=col-list>
      <p><input type=checkbox id=col-bg-cb>Background <input type=color id=col-bg list=col-list>
      <p><label><input type=checkbox id=col-bold      ><b>B</b></label>
         <label><input type=checkbox id=col-italic    ><i>I</i></label>
         <label><input type=checkbox id=col-underlined><u>U</u></label>
    </div>
  """
  $cm = $ '#col-cm'
  cm = new CodeMirror $cm[0],
    lineNumbers: true, firstLineNumber: 0, lineNumberFormatter: (i) -> "[#{i}]"
    indentUnit: 4, scrollButtonHeight: 12, autoCloseBrackets: {pairs: '()[]{}', explode: '{}'}
  cm.on 'gutterClick', -> selectGroup H.L; return
  cm.on 'cursorActivity', ->
    if t = cm.getTokenTypeAt cm.getCursor(), 1
      c = '.cm-' + t.split(' ')[0]; i = -1; for g, j in G when g.c == c then i = j; break
      i != -1 && selectGroup i
    else
      selectGroup H[' ']
    return
  $('#col-group').change -> selectGroup +@value; return
  $('#col-fg        ').change -> model[sel].fg         = @value;      updateSampleStyle(); return
  $('#col-bg        ').change -> model[sel].bg         = @value;      updateSampleStyle(); return
  $('#col-bold      ').click  -> model[sel].bold       = +!!@checked; updateSampleStyle(); return
  $('#col-italic    ').click  -> model[sel].italic     = +!!@checked; updateSampleStyle(); return
  $('#col-underlined').click  -> model[sel].underlined = +!!@checked; updateSampleStyle(); return
  $('#col-fg-cb').click -> $('#col-fg').toggle @checked; model[sel].fg = @checked && $('#col-fg').val() || ''; updateSampleStyle(); return
  $('#col-bg-cb').click -> $('#col-bg').toggle @checked; model[sel].bg = @checked && $('#col-bg').val() || ''; updateSampleStyle(); return
  return

@load = ->
  v = prefs.hi(); model = G.map (g) -> $.extend {}, g.d, v[g.t]
  updateSampleStyle(); selectGroup 0, 1; cm.setSize $cm.width(), $cm.height()
  cm.setValue '''
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
  return

props = qw 'fg bg bold italic underlined' # properties in style objects
getModelAsObject = -> # keyed by token type, contains only diffs from defaults, suitable for putting in localStorage
  v = {}
  for g, i in G
    m = model[i]
    for p in props when m[p] != (g.d[p] || '') then (v[g.t] ?= {})[p] = m[p]
  v

@save = -> prefs.hi getModelAsObject(); return
@resize = -> cm.setSize $cm.width(), $cm.height(); return

updateSampleStyle = -> $('#col-sample-style').text renderCSS dict(G.map (g, i) -> [g.t, model[i]]), '#col-cm'; return

selectGroup = (i, forceRefresh) ->
  if i != sel || forceRefresh
    h = model[i]; $('#col-group').val i
    $('#col-fg-cb').prop 'checked', !!h.fg; $('#col-fg').val(h.fg).toggle !!h.fg
    $('#col-bg-cb').prop 'checked', !!h.bg; $('#col-bg').val(h.bg).toggle !!h.bg
    $('#col-bold'      ).prop 'checked', !!h.bold
    $('#col-italic'    ).prop 'checked', !!h.italic
    $('#col-underlined').prop 'checked', !!h.underlined
    sel = i
  return
