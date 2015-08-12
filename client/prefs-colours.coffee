prefs = require './prefs'
{join, dict, qw, esc} = require './util'

@name = 'Colours'

G = [ # information about syntax highlighting groups
  # t: token type, a short key for storing customisations in localStorage
  # s: name to display in the UI
  # c: css selector
  # controls: which UI controls are allowed or disallowed for this group (other than the default controls)
  {t:'norm', s:'normal',               c:'.cm-s-default,.CodeMirror-gutters'}
  {t:'num',  s:'number',               c:'.cm-apl-num' }
  {t:'str',  s:'string',               c:'.cm-apl-str' }
  {t:'zld',  s:'zilde',                c:'.cm-apl-zld' }
  {t:'var',  s:'name',                 c:'.cm-apl-var' }
  {t:'glb',  s:'global name',          c:'.cm-apl-glb' }
  {t:'quad', s:'quad name',            c:'.cm-apl-quad'}
  {t:'fn',   s:'function',             c:'.cm-apl-fn'  }
  {t:'op1',  s:'monadic operator',     c:'.cm-apl-op1' }
  {t:'op2',  s:'dyadic operator',      c:'.cm-apl-op2' }
  {t:'ns',   s:'namespace',            c:'.cm-apl-ns'  }
  {t:'asgn', s:'assignment',           c:'.cm-apl-asgn'}
  {t:'diam', s:'diamond',              c:'.cm-apl-diam'}
  {t:'par',  s:'parenthesis',          c:'.cm-apl-par' }
  {t:'sqbr', s:'bracket',              c:'.cm-apl-sqbr'}
  {t:'semi', s:'semicolon',            c:'.cm-apl-semi'}
  {t:'dfn',  s:'dfn',                  c:'.cm-apl-dfn' }
  {t:'dfn1', s:'dfn level 1',          c:'.cm-apl-dfn1'}
  {t:'dfn2', s:'dfn level 2',          c:'.cm-apl-dfn2'}
  {t:'dfn3', s:'dfn level 3',          c:'.cm-apl-dfn3'}
  {t:'dfn4', s:'dfn level 4',          c:'.cm-apl-dfn4'}
  {t:'dfn5', s:'dfn level 5',          c:'.cm-apl-dfn5'}
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
  {t:'sel',  s:'selection',            c:'.CodeMirror-selected,.CodeMirror-focused .CodeMirror-selected', controls:{fg:0,BIU:0}}
  {t:'tc',   s:'tracer',               c:'.tracer .CodeMirror,.tracer .CodeMirror .CodeMirror-gutter-wrapper'}
]
H = dict G.map (g, i) -> [g.t, i] # reverse dict of G

# Colour schemes are represented in one of two ways:
#   In memory                 In localStorage
#     {                         {
#       "name": "MyScheme",       "name": "MyScheme",
#       "group1": {               "styles": "group1=fg:f00,B group2=bg:f00 ..."
#         "fg": "f00",          }
#         "B": 1
#       },
#       "group2": {
#         "bg": "f00"
#       },
#       ...
#     }
# encodeScheme() and decodeScheme() convert between the two.

encodeScheme = (x) ->
  s = ''
  for g, h of x when g != 'name'
    u = ''; for p, v of h then u += ",#{p}"; if !(p in ['B', 'I', 'U'] && v) then u += ":#{v}"
    u && s += " #{g}=#{u[1..]}"
  name: x.name, styles: s[1..]

decodeScheme = (x) ->
  {name, styles} = x; r = {name}
  if styles
    for gh in styles.split /\s+/ when gh
      [g, s1] = gh.split '='; r[g] = h = {}; for pv in s1.split ',' then [p, v] = pv.split ':'; h[p] = v ? 1
      h.bgo? && h.bgo = +h.bgo # if .bgo is present, convert it to a number
  r

builtInSchemes = [
  {name: 'Default', styles: '''
    asgn=fg:00f com=fg:088 dfn=fg:00f diam=fg:00f err=fg:f00 fn=fg:008 idm=fg:00f kw=fg:800 lnum=fg:008,bg:f,bgo:1
    mod=bg:e,bgo:1 mtch=bg:ff8,bgo:.5 norm=bg:f,bgo:1 ns=fg:8 num=fg:8 op1=fg:00f op2=fg:00f par=fg:00f quad=fg:808
    sel=bg:ddf,bgo:.5 semi=fg:00f sqbr=fg:00f srch=bg:f80,bgo:.5 str=fg:088 tc=bg:d,bgo:1 trad=fg:8 var=fg:8 zld=fg:008
  '''}
  {name: 'Francisco Goya', styles: '''
    asgn=fg:ff0 com=fg:b,I:1 cur=lb:f00 dfn2=fg:eb4 dfn3=fg:c79 dfn4=fg:cd0 dfn5=fg:a0d dfn=fg:a7b diam=fg:ff0
    err=fg:f00,bg:822,bgo:.5,B:1,U:1 fn=fg:0f0 glob=B:1 idm=B:1 kw=fg:aa2 lbl=U:1,bg:642,bgo:.5 lnum=fg:b94,bg:010,bgo:1
    mod=bg:1,bgo:1 mtch=fg:0,bg:ff8,bgo:.75 norm=fg:9c7,bg:0,bgo:1 num=fg:a8b op1=fg:d95 op2=fg:fd6 sel=bg:048,bgo:.5
    semi=fg:8 sqbr=fg:8 srch=bg:b96,bgo:.75,fg:0 str=fg:dae tc=bg:1,bgo:1 zld=fg:d9f,B:1
  '''}
  {name:'Albrecht Dürer', styles: '''
    com=I:1 diam=B:1 err=fg:f,bg:0,bgo:.5,B:1,I:1,U:1 glb=I:1 idm=U:1,bg:e,bgo:.5 kw=B:1 lnum=bg:f,bgo:1 mod=bg:e,bgo:1
    mtch=bg:c,bgo:.5 norm=bg:f,bgo:1 ns=fg:8 num=fg:8 quad=fg:808 srch=bg:c,bgo:.5 str=fg:8 tc=bg:e,bgo:1 zld=fg:8
  '''}
  {name:'Kazimir Malevich', styles: ''}
].map(decodeScheme).map (x) -> x.frozen = 1; x

schemes  =      # all schemes (built-in and user-defined) as objects
scheme   =      # the active scheme object
$cm = cm =      # DOM element and CodeMirror instance for displaying sample code
sel      = null # the selected group's token type (.t)

renderCSS = (scheme, rp = '') -> # rp: css rule prefix
  join G.map (g) ->
    if h = scheme[g.t]
      g.c.split(',').map((x) -> rp + ' ' + x).join(',') + '{' +
        (h.fg && "color:#{expandColour h.fg};"             || '') +
        (h.bg && "background-color:#{expandColour h.bg};"  || '') +
        (h.B  && 'font-weight:bold;'                       || '') +
        (h.I  && 'font-style:italic;'                      || '') +
        (h.U  && 'text-decoration:underline;'              || '') +
        (h.lb && "border-left-color:#{expandColour h.lb};" || '') +
        (h.bg && "background-color:#{expandColourRGBA h.bg, h.bgo ? .5};" || '') +
        '}'
    else
      ''

expandColour = (s) ->
  switch (s || '').length
    when 6 then '#'+s; when 3 then [r,g,b]=s;'#'+r+r+g+g+b+b; when 1 then '#'+s+s+s+s+s+s; else s

expandColourRGBA = (s, a) -> s = expandColour s; "rgba(#{+('0x'+s[1..2])},#{+('0x'+s[3..4])},#{+('0x'+s[5..6])},#{a})"

shrinkColour = (s) ->
  if !/^#.{6}$/.test s then s
  else [_,r,r1,g,g1,b,b1]=s; if r==r1==g==g1==b==b1 then r else if r==r1 && g==g1 && b==b1 then r+g+b else s[1..]

$ updateStyle = -> # update global style from what's in localStorage; do it on "document ready"
  name = prefs.colourScheme()
  for x in builtInSchemes.concat prefs.colourSchemes().map decodeScheme when x.name == name
    $('#col-style').text renderCSS x, '.ride-win'; break
  return
# ... and update whenever the values in localStorage change
prefs.colourScheme  updateStyle
prefs.colourSchemes updateStyle

chooseUniqueSchemeName = (s) -> # s: suggested root
  h = {}; for x in schemes then h[x.name] = 1
  if !h[s] then s else s = s.replace /\ \(\d+\)$/, ''; i = 1; (while h[r = "#{s} (#{i})"] then i++); r

SEARCH_MATCH = 'search match' # sample text to illustrate it

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
      <div id=col-bgo title=Transparency></div>
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
      scheme.name = ''; scheme.name = chooseUniqueSchemeName newName
      $('#prefs-tab-colours').removeClass 'renaming'; updateSchemes()
    return
  $('#col-new-name').keydown (e) ->
    switch e.which
      when 13 then $(@)                 .blur(); false # enter
      when 27 then $(@).val(scheme.name).blur(); false # esc
  $('#col-clone').button().click ->
    schemes.push x = {}; for k, v of scheme then x[k] = $.extend {}, v # x: the new scheme
    x.name = chooseUniqueSchemeName scheme.name; delete x.frozen; scheme = x; updateSchemes(); false
  $('#col-rename').button().click ->
    $('#col-new-name').width($('#col-scheme').width()).val(scheme.name).select()
    $('#prefs-tab-colours').addClass 'renaming'; false
  $('#col-delete').button().click ->
    i = $('#col-scheme')[0].selectedIndex; schemes.splice i, 1
    scheme = schemes[Math.min i, schemes.length - 1]; updateSchemes(); false
  $cm = $ '#col-cm'
  cm = new CodeMirror $cm[0],
    dragDrop: 0, lineNumbers: true, firstLineNumber: 0, lineNumberFormatter: (i) -> "[#{i}]"
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
      else if t = cm.getTokenTypeAt cm.getCursor(), 1
        t = t.split(' ').sort((x, y) -> y.length - x.length)[0].replace(/^apl-/, '')
      else 'norm'
    )
    return
  $('#col-group').change -> selectGroup G[+@value].t; return
  qw('fg bg lb').forEach (p) ->
    $("#col-#{p}").change -> (scheme[sel] ?= {})[p] = @value; updateSampleStyle(); return
    $("#col-#{p}-cb").click ->
      $("#col-#{p}").toggle @checked
      h = scheme[sel] ?= {}; if @checked then h[p] = shrinkColour $("#col-#{p}").val() else delete h[p]
      updateSampleStyle(); return
    return
  $('#col-bg-cb').click -> $('#col-bgo').toggle @checked; return
  $('#col-bgo').slider range: 'min', value: .5, min: 0, max: 1, step: .25, slide: (e, ui) ->
    (scheme[sel] ?= {}).bgo = ui.value; updateSampleStyle(); return
  qw('B I U').forEach (p) ->
    $("#col-#{p}").click ->
      h = scheme[sel] ?= {}; if @checked then h[p] = 1 else delete h[p]
      updateSampleStyle(); return
    return
  cm.setValue """
    {R}←{X}tradfn(Y Z);local
    dfn←{ ⍝ comment
      0 ¯1.2e¯3j¯.45 'string' ⍬
      +/-⍣(×A):⍺∇⍵[i;j]
      {{{{nested ⍺:∇⍵}⍺:∇⍵}⍺:∇⍵}⍺:∇⍵}
    }
    label:
    :For i :In ⍳X ⋄ :EndFor
    :If condition
      {⍵[⍋⍵]} ⋄ global←local←0
      ⎕error ) ] } :error 'unclosed
    :EndIf
    #{SEARCH_MATCH}
  """
  return

updateSchemes = ->
  $('#col-scheme').html(join schemes.map (x) -> "<option value='#{esc x.name}'>#{esc x.name}").val scheme.name
  $('#prefs-tab-colours').toggleClass 'frozen', !!scheme.frozen; cm.setSize $cm.width(), $cm.height()
  updateSampleStyle(); selectGroup 'norm', 1; return

@load = ->
  schemes = builtInSchemes.concat prefs.colourSchemes().map decodeScheme
  name = prefs.colourScheme() # name of the active scheme
  [scheme] = schemes; for x in schemes when x.name == name then scheme = x; break
  updateSchemes()
  $('#prefs-tab-colours').removeClass 'renaming'
  cm.setSize $cm.width(), $cm.height()
  return

@save = ->
  prefs.colourSchemes schemes.filter((x) -> !x.frozen).map encodeScheme
  prefs.colourScheme scheme.name
  return

@resize = -> cm.setSize $cm.width(), $cm.height(); return

updateSampleStyle = -> $('#col-sample-style').text renderCSS scheme, '#col-cm'; return

selectGroup = (t, forceRefresh) ->
  if scheme && (sel != t || forceRefresh)
    i = H[t]; h = scheme[t] || {}; $('#col-group').val i
    qw('fg bg lb').forEach (p) ->
      $("#col-#{p}-cb").prop 'checked', !!h[p]; $("#col-#{p}").val(expandColour h[p]).toggle !!h[p]; return
    qw('B I U').forEach (p) -> $("#col-#{p}").prop 'checked', !!h[p]; return
    $('#col-bgo').slider 'value', h.bgo ? .5
    c = (G[i] || G[0]).controls || {}
    $('#col-fg-p' ).toggle !!(c.fg ? 1)
    $('#col-bg-p' ).toggle !!(c.bg ? 1)
    $('#col-bgo'  ).toggle !!h.bg
    $('#col-BIU-p').toggle !!(c.BIU ? 1)
    $('#col-lb-p' ).toggle !!c.lb
    sel = t
  return
