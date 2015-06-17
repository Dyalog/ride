prefs = require './prefs'
{join, dict, qw, esc} = require './util'

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

builtInSchemes = [
  {
    name: 'Default', frozen: 1
    0:{fg:'#888888'}, "'":{fg:'#008888'}, '⍬':{fg:'#000088'}, a:{fg:'#888888'}, '⎕':{fg:'#880088'},
    '+':{fg:'#000088'}, '/':{fg:'#0000ff'}, '.':{fg:'#0000ff'}, '#':{fg:'#888888'}, '←':{fg:'#0000ff'},
    '⋄':{fg:'#0000ff'}, '(':{fg:'#0000ff'}, '[':{fg:'#0000ff'}, ';':{fg:'#0000ff'}, '{':{fg:'#0000ff'},
    '∇':{fg:'#888888'}, ':':{fg:'#880000'}, i:{fg:'#0000ff'}, '⍝':{fg:'#008888'}, '!':{fg:'#ff0000'},
    L:{fg:'#000088'}, mb:{bg:'#ffff88'}, sc:{bg:'#ff8800'}, mo:{bg:'#eeeeee'}, s1:{bg:'#d7d4f0'},
    s0:{bg:'#d9d9d9'}
  }
  {
    name: 'Twilight', frozen: 1
    ' ':{fg:'#88ff88',bg:'#000000'}, 'cu':{lb:'#ff0000'}
  }
]
schemes  = null # all schemes (built-in and user-defined) as objects
scheme   = null # the active scheme object
$cm = cm = null # DOM element and CodeMirror instance for displaying sample code
sel      = null # the selected group's token type (.t)

renderCSS = (scheme, rp = '') -> # rp: css rule prefix
  join G.map (g) ->
    if h = scheme[g.t]
      g.c.split(',').map((x) -> rp + ' ' + x).join(',') + '{' +
        (h.fg && "color:#{h.fg};"             || '') +
        (h.bg && "background-color:#{h.bg};"  || '') +
        (h.B  && 'font-weight:bold;'          || '') +
        (h.I  && 'font-style:italic;'         || '') +
        (h.U  && 'text-decoration:underline;' || '') +
        (h.lb && "border-left-color:#{h.lb};" || '') +
        '}'
    else
      ''

$ updateStyle = -> # update global style from what's in localStorage; do it on "document ready"
  name = prefs.colourScheme()
  for x in builtInSchemes.concat prefs.colourSchemes() when x.name == name
    $('#col-style').text renderCSS x, '.ride-win'; break
  return
# ... and update whenever the values in localStorage change
prefs.colourScheme  updateStyle
prefs.colourSchemes updateStyle

pickUniqueSchemeName = (root) ->
  h = {}; for x in schemes then h[x.name] = 1
  if !h[root]
    root
  else
    root = root.replace /\ \(\d+\)$/, ''
    i = 1; (while h[r = "#{root} (#{i})"] then i++); r

@init = ($e) ->
  u = []; (for _, {fg} of scheme when fg && 0 < u.indexOf fg then u.push fg); u.sort() # u: unique colours
  $e.html """
    <div id=col-top>
      <label>Scheme: <select id=col-scheme></select></label>
      <input id=col-new-name class=text-field>
      <a href=# id=col-clone>Clone</a>
      <a href=# id=col-rename>Rename</a>
      <a href=# id=col-delete>Delete</a>
    </div>
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
  $('#col-scheme').change ->
    scheme = schemes[+@selectedIndex]; updateSampleStyle()
    $('#prefs-tab-colours').toggleClass 'frozen', !!scheme.frozen
    cm.setSize $cm.width(), $cm.height(); return
  $('#col-new-name').blur ->
    if newName = $(@).val()
      scheme.name = ''; scheme.name = pickUniqueSchemeName newName
      $('#prefs-tab-colours').removeClass 'renaming'; updateSchemes()
    return
  $('#col-new-name').keydown (e) ->
    switch e.which
      when 13 then $(@)                 .blur(); false # enter
      when 27 then $(@).val(scheme.name).blur(); false # esc
  $('#col-clone').button().click ->
    schemes.push x = {}; for k, v of scheme then x[k] = $.extend {}, v # x: the new scheme
    x.name = pickUniqueSchemeName scheme.name; delete x.frozen; scheme = x; updateSchemes(); false
  $('#col-rename').button().click ->
    $('#col-new-name').width($('#col-scheme').width()).val(scheme.name).select()
    $('#prefs-tab-colours').addClass 'renaming'; false
  $('#col-delete').button().click ->
    i = $('#col-scheme')[0].selectedIndex; schemes.splice i, 1
    scheme = schemes[Math.min i, schemes.length - 1]; updateSchemes(); false
  $cm = $ '#col-cm'
  cm = new CodeMirror $cm[0],
    lineNumbers: true, firstLineNumber: 0, lineNumberFormatter: (i) -> "[#{i}]"
    indentUnit: 4, scrollButtonHeight: 12, matchBrackets: true, autoCloseBrackets: {pairs: '()[]{}', explode: '{}'}
  cm.addOverlay token: (stream) ->
    i = stream.string[stream.pos..].indexOf SEARCH_MATCH
    if !i then         stream.pos += SEARCH_MATCH.length; 'searching'
    else if i > 0 then stream.pos += i; return
    else               stream.skipToEnd(); return
  cm.on 'gutterClick', -> selectGroup 'L'; return
  cm.on 'cursorActivity', ->
    if cm.somethingSelected()
      selectGroup 's1'
    else if 0 <= cm.getLine(cm.getCursor().line).indexOf SEARCH_MATCH
      selectGroup 'sc'
    else if t = cm.getTokenTypeAt cm.getCursor(), 1
      c = '.cm-' + t.split(' ')[0]; for g in G when g.c == c then selectGroup g.t; break
    else
      selectGroup ' '
    return
  $('#col-group').change -> selectGroup G[+@value].t; return
  qw('fg bg lb').forEach (p) ->
    $("#col-#{p}").change -> (scheme[sel] ?= {})[p] = @value; updateSampleStyle(); return
    $("#col-#{p}-cb").click ->
      $("#col-#{p}").toggle @checked
      (scheme[sel] ?= {})[p] = @checked && $("#col-#{p}").val() || ''
      updateSampleStyle()
      return
    return
  qw('B I U').forEach (p) ->
    $("#col-#{p}").click -> (scheme[sel] ?= {})[p] = +!!@checked; updateSampleStyle(); return
    return
  return

updateSchemes = ->
  $('#col-scheme').html(join schemes.map (x) -> "<option value='#{esc x.name}'>#{esc x.name}").val scheme.name
  $('#prefs-tab-colours').toggleClass 'frozen', !!scheme.frozen; cm.setSize $cm.width(), $cm.height()
  updateSampleStyle(); selectGroup ' ', 1; return

SEARCH_MATCH = 'search match' # sample text to illustrate it
@load = ->
  schemes = builtInSchemes.concat prefs.colourSchemes()
  name = prefs.colourScheme() # name of the active scheme
  [scheme] = schemes; for x in schemes when x.name == name then scheme = x; break
  updateSchemes()
  $('#prefs-tab-colours').removeClass 'renaming'
  cm.setSize $cm.width(), $cm.height()
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

@save = -> prefs.colourSchemes schemes[builtInSchemes.length..]; prefs.colourScheme scheme.name; return
@resize = -> cm.setSize $cm.width(), $cm.height(); return

updateSampleStyle = -> $('#col-sample-style').text renderCSS scheme, '#col-cm'; return

selectGroup = (t, forceRefresh) ->
  if sel != t || forceRefresh
    i = H[t]; h = scheme[t] || {}; $('#col-group').val i
    qw('fg bg lb').forEach (p) -> $("#col-#{p}-cb").prop 'checked', !!h[p]; $("#col-#{p}").val(h[p]).toggle !!h[p]; return
    qw('B I U').forEach (p) -> $("#col-#{p}").prop 'checked', !!h[p]; return
    c = G[i].controls || {}
    $('#col-fg-p' ).toggle !!(c.fg ? 1)
    $('#col-bg-p' ).toggle !!(c.bg ? 1)
    $('#col-BIU-p').toggle !!(c.BIU ? 1)
    $('#col-lb-p' ).toggle !!c.lb
    sel = t
  return
