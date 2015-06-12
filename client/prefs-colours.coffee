prefs = require './prefs'
{join, dict, qw} = require './util'

@name = 'Colours'

G = [ # information about syntax highlighting groups
  # t: token type, a short key for storing customisations in localStorage
  # c: css selector
  # s: name to display in the UI
  # showX: whether to show the control for "X"
  {t:' ',  c:'.cm-s-default,.CodeMirror-gutter-wrapper', s:'normal'}
  {t:'0',  c:'.cm-apl-num',                 s:'number'          }
  {t:"'",  c:'.cm-apl-str',                 s:'string'          }
  {t:'⍬',  c:'.cm-apl-zilde',               s:'zilde'           }
  {t:'a',  c:'.cm-apl-name',                s:'name'            }
  {t:'A',  c:'.cm-apl-global-name',         s:'global name'     }
  {t:'⎕',  c:'.cm-apl-quad-name',           s:'quad name'       }
  {t:'+',  c:'.cm-apl-fn',                  s:'function'        }
  {t:'/',  c:'.cm-apl-op1',                 s:'monadic operator'}
  {t:'.',  c:'.cm-apl-op2',                 s:'dyadic operator' }
  {t:'#',  c:'.cm-apl-ns',                  s:'namespace'       }
  {t:'←',  c:'.cm-apl-assignment',          s:'assignment'      }
  {t:'⋄',  c:'.cm-apl-diamond',             s:'diamond'         }
  {t:'(',  c:'.cm-apl-paren',               s:'parenthesis'     }
  {t:'[',  c:'.cm-apl-bracket',             s:'bracket'         }
  {t:';',  c:'.cm-apl-semicolon',           s:'semicolon'       }
  {t:'{',  c:'.cm-apl-dfn',                 s:'dfn'             }
  {t:'{1', c:'.cm-apl-dfn1',                s:'dfn level 1'     }
  {t:'{2', c:'.cm-apl-dfn2',                s:'dfn level 2'     }
  {t:'{3', c:'.cm-apl-dfn3',                s:'dfn level 3'     }
  {t:'∇',  c:'.cm-apl-tradfn',              s:'tradfn'          }
  {t:':',  c:'.cm-apl-kw',                  s:'keyword'         }
  {t:'l:', c:'.cm-apl-label',               s:'label'           }
  {t:'i',  c:'.cm-apl-idiom',               s:'idiom'           }
  {t:'⍝',  c:'.cm-apl-comment',             s:'comment'         }
  {t:'!',  c:'.cm-apl-err',                 s:'error'           }
  {t:'L',  c:'.CodeMirror-linenumber',      s:'line number'     }
  {t:'cu', c:'div.CodeMirror-cursor',       s:'cursor',           controls:{lb:1,fg:0,bg:0,BIU:0}}
  {t:'mb', c:'.CodeMirror-matchingbracket', s:'matching bracket'}
  {t:'sc', c:'.cm-searching',               s:'search match'    }
  {t:'mo', c:'.modified',                   s:'modified (session)'}
  {t:'s1', c:'.CodeMirror-focused .CodeMirror-selected', s:'selected (focused)',    controls:{fg:0,BIU:0}}
  {t:'s0', c:'.CodeMirror-selected',                     s:'selected (no focus)',   controls:{fg:0,BIU:0}}
]
H = dict G.map (g, i) -> [g.t, i]

scheme =
  '0':fg:'#888888'
  "'":fg:'#008888'
  '⍬':fg:'#000088'
  'a':fg:'#888888'
  '⎕':fg:'#880088'
  '+':fg:'#000088'
  '/':fg:'#0000ff'
  '.':fg:'#0000ff'
  '#':fg:'#888888'
  '←':fg:'#0000ff'
  '⋄':fg:'#0000ff'
  '(':fg:'#0000ff'
  '[':fg:'#0000ff'
  ';':fg:'#0000ff'
  '{':fg:'#0000ff'
  '∇':fg:'#888888'
  ':':fg:'#880000'
  'i':fg:'#0000ff'
  '⍝':fg:'#008888'
  '!':fg:'#ff0000'
  'L':fg:'#000088'
  'mb':bg:'#ffff88'
  'sc':bg:'#ff8800'
  'mo':bg:'#eeeeee'
  's1':bg:'#d7d4f0'
  's0':bg:'#d9d9d9'

renderCSS = (v, rp = '') -> # v: style objects keyed by token type, rp: css rule prefix
  join G.map (g) ->
    h = $.extend {}, scheme[g.t], v[g.t] # h: effective style
    g.c.split(',').map((x) -> rp + ' ' + x).join(',') + '{' +
      (h.fg && "color:#{h.fg};"             || '') +
      (h.bg && "background-color:#{h.bg};"  || '') +
      (h.B  && 'font-weight:bold;'          || '') +
      (h.I  && 'font-style:italic;'         || '') +
      (h.U  && 'text-decoration:underline;' || '') +
      (h.lb && "border-left-color:#{h.lb};" || '') +
      '}'

prefs.hi updateStyle = (v) -> $('#col-style').text renderCSS v, '.ride-win'; return
$ -> updateStyle prefs.hi(); return

$cm = cm = null # DOM element and CodeMirror instance for displaying sample code
model = null # an array of style objects, in the same order as "G", initialised in @load()
sel = -1 # index of the selected group

@init = ($e) ->
  u = []; (for _, {fg} of scheme when fg && 0 < u.indexOf fg then u.push fg); u.sort() # u: unique colours
  $e.html """
    <div id=col-cm></div>
    <div id=col-settings>
      <datalist id=col-list>#{join u.map (c) -> "<option value=#{c}>"}</datalist>
      <select id=col-group>#{join G.map (g, i) -> "<option value=#{i}>#{g.s}"}</select>
      <p id=col-fg-p><label><input type=checkbox id=col-fg-cb>Foreground</label> <input type=color id=col-fg list=col-list>
      <p id=col-bg-p><label><input type=checkbox id=col-bg-cb>Background</label> <input type=color id=col-bg list=col-list>
      <p id=col-BIU-p>
        <label><input type=checkbox id=col-B><b>B</b></label>
        <label><input type=checkbox id=col-I><i>I</i></label>
        <label><input type=checkbox id=col-U><u>U</u></label>
      <p id=col-lb-p><label><input type=checkbox id=col-lb-cb>Cursor colour</label> <input type=color id=col-lb>
    </div>
  """
  $cm = $ '#col-cm'
  cm = new CodeMirror $cm[0],
    lineNumbers: true, firstLineNumber: 0, lineNumberFormatter: (i) -> "[#{i}]"
    indentUnit: 4, scrollButtonHeight: 12, matchBrackets: true, autoCloseBrackets: {pairs: '()[]{}', explode: '{}'}
  cm.addOverlay token: (stream) ->
    i = stream.string[stream.pos..].indexOf SEARCH_MATCH
    if !i then         stream.pos += SEARCH_MATCH.length; 'searching'
    else if i > 0 then stream.pos += i; return
    else               stream.skipToEnd(); return
  cm.on 'gutterClick', -> selectGroup H.L; return
  cm.on 'cursorActivity', ->
    if cm.somethingSelected()
      selectGroup H.s1
    else if 0 <= cm.getLine(cm.getCursor().line).indexOf SEARCH_MATCH
      selectGroup H.sc
    else if t = cm.getTokenTypeAt cm.getCursor(), 1
      c = '.cm-' + t.split(' ')[0]; i = -1; for g, j in G when g.c == c then i = j; break
      i != -1 && selectGroup i
    else
      selectGroup H[' ']
    return
  $('#col-group').change -> selectGroup +@value; return
  qw('fg bg lb').forEach (p) ->
    $("#col-#{p}").change -> model[sel][p] = @value; updateSampleStyle(); return
    $("#col-#{p}-cb").click ->
      $("#col-#{p}").toggle @checked
      model[sel][p] = @checked && $("#col-#{p}").val() || ''
      updateSampleStyle()
      return
    return
  qw('B I U').forEach (p) ->
    $("#col-#{p}").click -> model[sel][p] = +!!@checked; updateSampleStyle(); return
    return
  return

SEARCH_MATCH = 'search match' # sample text to illustrate a search match
@load = ->
  v = prefs.hi(); model = G.map (g) -> $.extend {}, scheme[g.t], v[g.t]
  updateSampleStyle(); selectGroup 0, 1; cm.setSize $cm.width(), $cm.height()
  cm.setValue """
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
      #{SEARCH_MATCH}
    ∇
  """
  return

props = qw 'fg bg B I U lb' # properties in style objects
getModelAsObject = -> # keyed by token type, contains only diffs from defaults, suitable for putting in localStorage
  v = {}
  for g, i in G
    m = model[i]
    for p in props when (m[p] || '') != (scheme[g.t]?[p] || '') then (v[g.t] ?= {})[p] = m[p]
  v

@save = -> prefs.hi getModelAsObject(); return
@resize = -> cm.setSize $cm.width(), $cm.height(); return

updateSampleStyle = -> $('#col-sample-style').text renderCSS dict(G.map (g, i) -> [g.t, model[i]]), '#col-cm'; return

selectGroup = (i, forceRefresh) ->
  if i != sel || forceRefresh
    h = model[i]; $('#col-group').val i
    qw('fg bg lb').forEach (p) -> $("#col-#{p}-cb").prop 'checked', !!h[p]; $("#col-#{p}").val(h[p]).toggle !!h[p]; return
    qw('B I U').forEach (p) -> $("#col-#{p}").prop 'checked', !!h[p]; return
    c = G[i].controls || {}
    $('#col-fg-p' ).toggle !!(c.fg ? 1)
    $('#col-bg-p' ).toggle !!(c.bg ? 1)
    $('#col-BIU-p').toggle !!(c.BIU ? 1)
    $('#col-lb-p' ).toggle !!c.lb
    sel = i
  return
