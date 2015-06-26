prefs = require './prefs'
{qw} = require './util'

@name = 'Menu'
$ta = null # the textarea
@init = ($e) ->
  $e.html '''
    <a href=# class=reset>Reset</a>
    <p>Takes effect on restart</p>
    <textarea wrap=off></textarea>
  '''
  $ta = $ 'textarea', $e
  $('.reset', $e).button().click -> $ta.val prefs.menu.getDefault(); false
  return
@load = -> $ta.val prefs.menu(); return
@save = -> prefs.menu $ta.val(); return

@validate = ->
  try
    visit = (x) ->
      if x.cmd == 'PRF' then return 1
      if x.items then for y in x.items when visit y then return 1
      0
    ok = 0; for x in @parseMenuDSL $ta.val() when visit x then ok = 1; break
    if !ok then message: 'Menu must contain the PRF (Preferences) command', element: $ta
  catch e
    message: e.message, element: $ta

extraOpts =
  # todo: remove obsolete options
  # todo: update from prefs.keys() dynamically
  NEW: key: 'Ctrl+N'
  QIT: key: 'Ctrl+Q'
  ZMI: key: 'Ctrl+=', dontBindKey: 1
  ZMO: key: 'Ctrl+-', dontBindKey: 1
  ZMR: key: 'Ctrl+0', dontBindKey: 1
  LBR: checkBoxPref: prefs.lbar
  FLT: checkBoxPref: prefs.floating
  WRP: checkBoxPref: prefs.wrap
  TOP: checkBoxPref: prefs.floatOnTop
  DMN: key: 'Ctrl+Shift+N'
  DMP: key: 'Ctrl+Shift+P'
  ABT: key: 'Shift+F1', dontBindKey: 1
  THM: items: qw('Modern Redmond Cupertino Freedom').map (x, i) ->
    '': x, group: 'themes', checked: prefs.theme() == x.toLowerCase(), action: ->
      prefs.theme x.toLowerCase(); return

@parseMenuDSL = (md) ->
  stack = [ind: -1, items: []]
  for s in md.split '\n' when !/^\s*$/.test s = s.replace /#.*/, ''
    cond = ''; s = s.replace /\{(.*)\}/, (_, x) -> cond = x; ''
    url = ''; s = s.replace /\=(https?:\/\/\S+)/, (_, x) -> url = x; ''
    cmd = ''; s = s.replace /\=([a-z][a-z0-9]+)/i, (_, x) -> cmd = x; ''
    h = ind: s.replace(/\S.*/, '').length, '': s.replace /^\s*|\s*$/g, ''
    while h.ind <= stack[stack.length - 1].ind then stack.pop()
    if !cond || do new Function "var browser=!#{D.nwjs},mac=#{D.mac};return(#{cond})"
      (stack[stack.length - 1].items ?= []).push h
    if stack.length == 1 then h.items ?= [] # force top-level items to be menus
    stack.push h
    if cmd
      h.cmd = cmd
      h.action = do (cmd = cmd) -> ->
        if f = CodeMirror.commands[cmd] then f D.ide.focusedWin.cm
        else if D.ide[cmd] then D.ide[cmd]()
        else $.alert "Unknown command: #{cmd}"
        return
    else if url
      h.action = do (url = url) -> -> D.openExternal url; return
    $.extend h, extraOpts[cmd]
  stack[0].items
