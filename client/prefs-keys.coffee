prefs = require './prefs'
{esc, join} = require './util'
{cmds} = require './cmds'

@name = 'Keys'

keyHTML = (k) -> "<span><span class=keys-text>#{k}</span><a href=# class=keys-del>×</a></span> "

@init = ($e) ->
  $e.html """
    <div>
      <input id=keys-search placeholder=Search>
      <a id=keys-search-clear href=# style=display:none title="Clear search">×</a>
    </div>
    <div id=keys-table-wrapper>
      <table>#{join cmds.map ([code, desc]) ->
        "<tr><td>#{desc}<td class=keys-code>#{code}<td id=keys-#{code}>"
      }</table>
    </div>
    <div id=keys-no-results style=display:none>No results</div>
  """
    .on 'mouseover', '.keys-del', -> $(@).parent().addClass    'keys-del-hover'; return
    .on 'mouseout',  '.keys-del', -> $(@).parent().removeClass 'keys-del-hover'; return
    .on 'click', '.keys-del', -> $(@).parent().remove(); updateDups(); false
    .on 'click', '.keys-add', ->
      $b = $ @; getKeystroke (k) -> k && $b.parent().append(keyHTML k).append $b; updateDups(); return
      false
  $('#keys-search').on 'keyup change', ->
    q = @value.toLowerCase(); $('#keys-search-clear').toggle !!q; found = 0
    $('#keys-table-wrapper tr').each ->
      $(@).toggle x = 0 <= $(@).text().toLowerCase().indexOf q
      found ||= x; return
    $('#keys-no-results').toggle !found
    return
  $('#keys-search-clear').click -> $(@).hide(); $('#keys-search').val('').change().focus(); false
  return

getKeystroke = (callback) ->
  $d = $ '<p><input class=keys-input placeholder=...>'
    .dialog title: 'New Key', modal: 1, buttons: Cancel: -> $d.dialog 'close'; callback k; return
  $ 'input', $d
    .focus -> $(@).addClass    'keys-input'; return
    .blur  -> $(@).removeClass 'keys-input'; return
    .on 'keypress keyup', (e) ->
      kn = CodeMirror.keyNames[e.which] || ''
      if kn in ['Shift', 'Ctrl', 'Alt']
        $(@).val (e.shiftKey && 'Shift-' || '') +
                 (e.ctrlKey  && 'Ctrl-'  || '') +
                 (e.altKey   && 'Alt-'   || '')
      else
        $d.dialog 'close'; callback @value
      false
    .keydown (e) ->
      kn = CodeMirror.keyNames[e.which] || ''
      if kn in ['Shift', 'Ctrl', 'Alt'] then kn = ''
      $(@).val (e.shiftKey && 'Shift-' || '') +
               (e.ctrlKey  && 'Ctrl-'  || '') +
               (e.altKey   && 'Alt-'   || '') +
               kn
      false
  return

@load = ->
  h = prefs.keys()
  for [code, desc, defaults] in cmds
    $ "#keys-#{code}"
      .html join (h[code] || defaults).map keyHTML
      .append '<a href=# class=keys-add>+</a>'
  updateDups()
  return

@save = ->
  h = {}
  for [c, _, d] in cmds
    a = $("#keys-#{c} .keys-text").map(-> $(@).text()).toArray()
    if JSON.stringify(a) != JSON.stringify(d) then h[c] = a
  prefs.keys h; return

prefs.keys updateKeys = (x) ->
  h = CodeMirror.keyMap.dyalog = fallthrough: 'dyalogDefault'
  for [c, _, d] in cmds then for k in x[c] || d then h[k] = c
  return
updateKeys prefs.keys()

updateDups = ->
  h = {} # maps keystrokes to DOM objects
  for [c, _, d] in cmds then $("#keys-#{c} .keys-text").each ->
    k = $(@).text(); if h[k] then $(@).add(h[k]).addClass 'keys-dup' else $(@).removeClass 'keys-dup'; h[k] = @
  return
