prefs = require './prefs'
{esc, join} = require './util'
{cmds} = require './cmds'

@name = 'Shortcuts'

keyHTML = (k) -> "<span><span class=shortcuts-text>#{k}</span><a href=# class=shortcuts-del>×</a></span> "

$sc = null # <input> for search

@init = ($e) ->
  $e.html """
    <div>
      <input id=shortcuts-search placeholder=Search>
      <a id=shortcuts-search-clear href=# style=display:none title="Clear search">×</a>
    </div>
    <div id=shortcuts-table-wrapper>
      <table>#{join cmds.map ([code, desc]) ->
        "<tr><td>#{desc}<td class=shortcuts-code>#{code}<td id=shortcuts-#{code}>"
      }</table>
    </div>
    <div id=shortcuts-no-results style=display:none>No results</div>
  """
    .on 'mouseover', '.shortcuts-del', -> $(@).parent().addClass    'shortcuts-del-hover'; return
    .on 'mouseout',  '.shortcuts-del', -> $(@).parent().removeClass 'shortcuts-del-hover'; return
    .on 'click', '.shortcuts-del', -> $(@).parent().remove(); updateDups(); false
    .on 'click', '.shortcuts-add', ->
      $b = $ @; getKeystroke (k) -> k && $b.parent().append(keyHTML k).append $b; updateDups(); return
      false
  $sc = $('#shortcuts-search').on 'keyup change', ->
    q = @value.toLowerCase(); $('#shortcuts-search-clear').toggle !!q; found = 0
    $('#shortcuts-table-wrapper tr').each ->
      $(@).toggle x = 0 <= $(@).text().toLowerCase().indexOf q
      found ||= x; return
    $('#shortcuts-no-results').toggle !found
    return
  $('#shortcuts-search-clear').click -> $(@).hide(); $sc.val('').change().focus(); false
  return

getKeystroke = (callback) ->
  $d = $ '<p><input class=shortcuts-input placeholder=...>'
    .dialog title: 'New Key', modal: 1, buttons: Cancel: -> $d.dialog 'close'; callback k; return
  $ 'input', $d
    .focus -> $(@).addClass    'shortcuts-input'; return
    .blur  -> $(@).removeClass 'shortcuts-input'; return
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
    $ "#shortcuts-#{code}"
      .html join (h[code] || defaults).map keyHTML
      .append '<a href=# class=shortcuts-add>+</a>'
  updateDups()
  $sc.val() && $sc.val('').change()
  return

@save = ->
  h = {}
  for [c, _, d] in cmds
    a = $("#shortcuts-#{c} .shortcuts-text").map(-> $(@).text()).toArray()
    if JSON.stringify(a) != JSON.stringify(d) then h[c] = a
  prefs.keys h; return

prefs.keys updateKeys = (x) ->
  h = CodeMirror.keyMap.dyalog = fallthrough: 'dyalogDefault'
  for [c, _, d] in cmds then for k in x[c] || d then h[k] = c
  return
updateKeys prefs.keys()

updateDups = ->
  h = {} # maps keystrokes to DOM objects
  for [c, _, d] in cmds then $("#shortcuts-#{c} .shortcuts-text").each ->
    k = $(@).text(); if h[k] then $(@).add(h[k]).addClass 'shortcuts-dup' else $(@).removeClass 'shortcuts-dup'; h[k] = @
  return
