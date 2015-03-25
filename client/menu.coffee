# This is a generic menu for a browser or NW.js
# There's an alternative implementation for NW.js in ../init-nw.coffee
# For the concrete content in the menu, see ide.coffee
D.installMenu ?= (arg) ->

  # DOM structure:
  #   ┌.menu───────────────────────────────────────┐
  #   │┌div.m-sub────────────────────────────┐     │
  #   ││            ┌div.m-box──────────────┐│     │
  #   ││┌a.m-opener┐│┌a───┐┌a───┐┌div.m-sub┐││     │
  #   │││File      │││Open││Save││   ...   │││ ... │
  #   ││└──────────┘│└────┘└────┘└─────────┘││     │
  #   ││            └───────────────────────┘│     │
  #   │└─────────────────────────────────────┘     │
  #   └────────────────────────────────────────────┘
  # Top-level ".m-opener"-s also have class ".m-top"
  render = (x) ->
    if !x then return
    if x == '-' then return $ '<hr>'
    acc = null # access key
    name = x[''].replace /_(.)/g, (_, k) -> if acc || k == '_' then k else "<u>#{acc = k}</u>"
    $a = $ "<a href='#'>#{name}</a>"
    if acc then $a.attr 'accessKey', acc.toLowerCase()
    if x.key
      $a.append $('<span class="m-shortcut">').text x.key
      if x.action && !x.dontBindKey then $(document).on 'keydown', '*', x.key, -> x.action(); false
    if x.group
      $a.addClass "m-group-#{x.group}"
      $a.toggleClass 'm-checked', !!x.checked
        .on 'mousedown mouseup click', (e) ->
          $(@).closest('.menu').find(".m-group-#{x.group}").removeClass 'm-checked'
          $(@).addClass 'm-checked'; mFocus null; x.action?(); false
    else if x.checked?
      $a.toggleClass 'm-checked', !!x.checked
        .on 'mousedown mouseup click', (e) -> $(@).toggleClass 'm-checked'; mFocus null; x.action? $(@).hasClass 'm-checked'; false
    else
      if x.action then $a.on 'mousedown mouseup click', (e) -> mFocus null; x.action(); false
    if !x.items then return $a
    $('<div class="m-sub">').append $a.addClass('m-opener'), $('<div class="m-box">').append x.items.map(render)...

  $o = null # original focused element
  mFocus = (anchor) ->
    $m.find('.m-open').removeClass 'm-open'
    if anchor
      $o ?= $ ':focus'; ($a = $ anchor).parentsUntil('.menu').addClass 'm-open'; $a.focus()
    else
      if $o then $o.focus(); $o = null
    return

  leftRight = (d) -> -> # d: delta, either +1 or -1;   note that this is a higher-order function
    if d == 1 && $(@).is '.m-opener'
      mFocus $(@).next('.m-box').find('a').first()
    else if d == -1 && $(@).parents('.m-sub').length > 1
      mFocus $(@).closest('.m-sub').find('.m-opener').first()
    else
      $t = $m.children(); i = $(@).parentsUntil('.menu').last().index() # Which top-level menu are we under?
      n = $t.length; mFocus $t.eq((i + d + n) % n).find('a').eq 1
    false

  upDown = (d) -> -> # d: delta, either +1 or -1;   note that this is a higher-order function
    if $(@).is '.m-top'
      mFocus $(@).parent().find(':not(hr)').eq 1
    else
      $s = $(@).closest('.m-box').children ':not(hr)'
      i = $s.index @; n = $s.length; $f = $s.eq (i + d + n) % n
      mFocus if $f.is 'a' then $f else $f.find('a').first()
    false

  $m = $('<div class="menu">').prependTo('body').empty().addClass('menu').append arg.map render
  $m.find('>.m-sub>.m-opener').addClass 'm-top'
  $m.on 'mouseover', 'a', -> $(@).closest('.menu').children().is('.m-open') && mFocus @; return
    .on 'mousedown', 'a', -> (if $(@).parentsUntil('.menu').last().is '.m-open' then mFocus null else mFocus @); false
    .on 'click',     'a', -> false
    .on 'keydown', '*', 'left',  leftRight -1
    .on 'keydown', '*', 'right', leftRight 1
    .on 'keydown', '*', 'up',    upDown -1
    .on 'keydown', '*', 'down',  upDown 1
    .on 'keydown', '*', 'esc f10', -> mFocus null; false

  isAccessKeyEvent = (e) -> e.altKey && !e.ctrlKey && !e.shiftKey && 65 <= e.which <= 90
  $ document
    .on 'keydown', '*', 'f10', -> $m.children().eq(0).addClass('m-open').find('a').eq(1).focus(); false
    .on 'keyup keypress', (e) -> !isAccessKeyEvent e
    .mousedown (e) -> (if !$(e.target).closest('.menu').length then mFocus null); return
    .keydown (e) ->
      if isAccessKeyEvent e
        $x = $m.find "[accessKey=#{String.fromCharCode(e.which).toLowerCase()}]:visible"
        if $x.length then $x.mousedown(); $x.parent().find('a').eq(1).focus(); false
  return
