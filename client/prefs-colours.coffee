prefs = require './prefs'
{join, dict, qw, esc} = require './util'

@name = 'Colours'

G = [ # information about syntax highlighting groups
  # t: token type, a short key for storing customisations in localStorage
  # s: name to display in the UI
  # c: css selector
  # showX: whether to show the control for "X"
  {t:'norm', s:'normal',               c:'.cm-s-default,.CodeMirror-gutter-wrapper'}
  {t:'num',  s:'number',               c:'.cm-apl-num' }
  {t:'str',  s:'string',               c:'.cm-apl-str' }
  {t:'zld',  s:'zilde',                c:'.cm-apl-zld' }
  {t:'var',  s:'name',                 c:'.cm-apl-var'}
  {t:'glb',  s:'global name',          c:'.cm-apl-glb' }
  {t:'quad', s:'quad name',            c:'.cm-apl-quad'}
  {t:'fn',   s:'function',             c:'.cm-apl-fn'  }
  {t:'op1',  s:'monadic operator',     c:'.cm-apl-op1' }
  {t:'op2',  s:'dyadic operator',      c:'.cm-apl-op2' }
  {t:'ns',   s:'namespace',            c:'.cm-apl-ns'  }
  {t:'asgn', s:'assignment',           c:'.cm-apl-asgn'}
  {t:'diam', s:'diamond',              c:'.cm-apl-diam'}
  {t:'par',  s:'parenthesis',          c:'.cm-apl-par' }
  {t:'brkt', s:'bracket',              c:'.cm-apl-brkt'}
  {t:'semi', s:'semicolon',            c:'.cm-apl-semi'}
  {t:'dfn',  s:'dfn',                  c:'.cm-apl-dfn' }
  {t:'dfn1', s:'dfn level 1',          c:'.cm-apl-dfn1'}
  {t:'dfn2', s:'dfn level 2',          c:'.cm-apl-dfn2'}
  {t:'dfn3', s:'dfn level 3',          c:'.cm-apl-dfn3'}
  {t:'trad', s:'tradfn',               c:'.cm-apl-trad'}
  {t:'kw',   s:'keyword',              c:'.cm-apl-kw'  }
  {t:'lbl',  s:'label',                c:'.cm-apl-lbl' }
  {t:'idm',  s:'idiom',                c:'.cm-apl-idm' }
  {t:'com',  s:'comment',              c:'.cm-apl-com' }
  {t:'err',  s:'error',                c:'.cm-apl-err' }
  {t:'lnum', s:'line number',          c:'.CodeMirror-linenumber'}
  {t:'cur',  s:'cursor',               c:'div.CodeMirror-cursor', controls:{lb:1,fg:0,bg:0,BIU:0}}
  {t:'mtch', s:'matching bracket',     c:'.CodeMirror-matchingbracket'}
  {t:'srch', s:'search match',         c:'.cm-searching'}
  {t:'mod',  s:'modified line',        c:'.modified'}
  {t:'sel',  s:'selection (focus)',    c:'.CodeMirror-focused .CodeMirror-selected', controls:{fg:0,BIU:0}}
  {t:'sel0', s:'selection (no focus)', c:'.CodeMirror-selected',                     controls:{fg:0,BIU:0}}
]
H = dict G.map (g, i) -> [g.t, i]

builtInSchemes = [
  {
    name:'Default', frozen:1
    num :{fg:'#888888'}, str :{fg:'#008888'}, zld :{fg:'#000088'}, var :{fg:'#888888'}, quad:{fg:'#880088'}
    fn  :{fg:'#000088'}, op1 :{fg:'#0000ff'}, op2 :{fg:'#0000ff'}, ns  :{fg:'#888888'}, asgn:{fg:'#0000ff'}
    diam:{fg:'#0000ff'}, par :{fg:'#0000ff'}, brkt:{fg:'#0000ff'}, semi:{fg:'#0000ff'}, dfn :{fg:'#0000ff'}
    trad:{fg:'#888888'}, kw  :{fg:'#880000'}, idm :{fg:'#0000ff'}, com :{fg:'#008888'}, err :{fg:'#ff0000'}
    lnum:{fg:'#000088'}, mtch:{bg:'#ffff88'}, srch:{bg:'#ff8800'}, mod :{bg:'#eeeeee'}, sel :{bg:'#d7d4f0'}
    sel :{bg:'#d9d9d9'}
  }
]
schemes  =      # all schemes (built-in and user-defined) as objects
scheme   =      # the active scheme object
$cm = cm =      # DOM element and CodeMirror instance for displaying sample code
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
  cm.on 'gutterClick', -> selectGroup 'lnum'; return
  cm.on 'cursorActivity', ->
    selectGroup(
      if cm.somethingSelected() then 'sel'
      else if 0 <= cm.getLine(cm.getCursor().line).indexOf SEARCH_MATCH then 'srch'
      else if t = cm.getTokenTypeAt cm.getCursor(), 1 then t.replace /^apl-(\w+).*$/, '$1'
      else 'norm'
    )
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
  updateSampleStyle(); selectGroup 'norm', 1; return

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
    c = (G[i] || G[0]).controls || {}
    $('#col-fg-p' ).toggle !!(c.fg ? 1)
    $('#col-bg-p' ).toggle !!(c.bg ? 1)
    $('#col-BIU-p').toggle !!(c.BIU ? 1)
    $('#col-lb-p' ).toggle !!c.lb
    sel = t
  return
