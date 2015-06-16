prefs = require './prefs'
{join, dict, qw} = require './util'

@name = 'Colours'

G = [ # information about syntax highlighting groups
  # t: token type, a short key for storing customisations in localStorage
  # s: name to display in the UI
  # c: css selector
  # showX: whether to show the control for "X"
  {t:' ',  s:'normal',              c:'.cm-s-default,.CodeMirror-gutter-wrapper'}
  {t:'0',  s:'number',              c:'.cm-apl-num'           }
  {t:"'",  s:'string',              c:'.cm-apl-str'           }
  {t:'⍬',  s:'zilde',               c:'.cm-apl-zilde'         }
  {t:'a',  s:'name',                c:'.cm-apl-name'          }
  {t:'A',  s:'global name',         c:'.cm-apl-global-name'   }
  {t:'⎕',  s:'quad name',           c:'.cm-apl-quad-name'     }
  {t:'+',  s:'function',            c:'.cm-apl-fn'            }
  {t:'/',  s:'monadic operator',    c:'.cm-apl-op1'           }
  {t:'.',  s:'dyadic operator',     c:'.cm-apl-op2'           }
  {t:'#',  s:'namespace',           c:'.cm-apl-ns'            }
  {t:'←',  s:'assignment',          c:'.cm-apl-assignment'    }
  {t:'⋄',  s:'diamond',             c:'.cm-apl-diamond'       }
  {t:'(',  s:'parenthesis',         c:'.cm-apl-paren'         }
  {t:'[',  s:'bracket',             c:'.cm-apl-bracket'       }
  {t:';',  s:'semicolon',           c:'.cm-apl-semicolon'     }
  {t:'{',  s:'dfn',                 c:'.cm-apl-dfn'           }
  {t:'{1', s:'dfn level 1',         c:'.cm-apl-dfn1'          }
  {t:'{2', s:'dfn level 2',         c:'.cm-apl-dfn2'          }
  {t:'{3', s:'dfn level 3',         c:'.cm-apl-dfn3'          }
  {t:'∇',  s:'tradfn',              c:'.cm-apl-tradfn'        }
  {t:':',  s:'keyword',             c:'.cm-apl-kw'            }
  {t:'l:', s:'label',               c:'.cm-apl-label'         }
  {t:'i',  s:'idiom',               c:'.cm-apl-idiom'         }
  {t:'⍝',  s:'comment',             c:'.cm-apl-comment'       }
  {t:'!',  s:'error',               c:'.cm-apl-err'           }
  {t:'L',  s:'line number',         c:'.CodeMirror-linenumber'}
  {t:'cu', s:'cursor',              c:'div.CodeMirror-cursor', controls:{lb:1,fg:0,bg:0,BIU:0}}
  {t:'mb', s:'matching bracket',    c:'.CodeMirror-matchingbracket'}
  {t:'sc', s:'search match',        c:'.cm-searching'         }
  {t:'mo', s:'modified (session)',  c:'.modified'             }
  {t:'s1', s:'selected (focused)',  c:'.CodeMirror-focused .CodeMirror-selected', controls:{fg:0,BIU:0}}
  {t:'s0', s:'selected (no focus)', c:'.CodeMirror-selected',                     controls:{fg:0,BIU:0}}
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
  v = {}; (for g, i in G then for p, x of model[i] when x then (v[g.t] ?= {})[p] = x); v

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
