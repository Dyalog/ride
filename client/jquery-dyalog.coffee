# jQuery utility plugins

$.alert = (message, title, callback) ->
  $('<p>').text(message).dialog modal: 1, title: title, buttons: [
    text: 'OK', click: -> $(@).dialog 'close'; callback?(); return
  ]
  return

$.fn.dyalogmenu = (arg) ->
  if typeof arg == 'object' && arg && arg.length?
    @each ->

      render = (x) ->
        if !x then return
        if x == '-' then return $ '<hr>'
        acc = null # access key
        name = x[''].replace /_(.)/g, (_, k) ->
          if acc || k == '_' then k else acc = k; "<u>#{k}</u>"
        $a = $ "<a href='#'>#{name}</a>"
        if acc then $a.attr 'accessKey', acc.toLowerCase()
        if x.key
          $a.append $('<span class="shortcut">').text x.key
          $(document).on 'keydown', '*', x.key, -> x.action(); false
        if x.checked?
          $a.addClass('toggle').toggleClass 'checked', x.checked
            .on 'mousedown mouseup click', (e) -> $(@).toggleClass 'checked'; mFocus null; x.action? $(@).hasClass '.checked'; false
        else
          if x.action then $a.on 'mousedown mouseup click', (e) -> mFocus null; x.action(); false
        if !x.items then return $a
        $u = $ '<div>'; for y in x.items then $u.append render y
        $('<div>').append($a).append($u)

      $o = null # original focused element
      mFocus = (anchor) ->
        $m.find('.m-open').removeClass 'm-open'
        if anchor
          $o ?= $ ':focus'; ($a = $ anchor).parentsUntil('.menu').addClass 'm-open'; $a.focus()
        else
          if $o then $o.focus(); $o = null
        return

      leftRight = (d) -> -> # d: delta, either +1 or -1;   note that this is a higher-order function
        $t = $m.children(); i = $(@).parentsUntil('.menu').last().index() # Which top-level menu are we under?
        n = $t.length; mFocus $t.eq((i + d + n) % n).find('a').eq 1; false

      upDown = (d) -> -> # d: delta, either +1 or -1;   note that this is a higher-order function
        if $(@).is '.m-top' then mFocus $(@).parent().find('a').eq 1
        else $s = $(@).parent().children 'a'; i = $s.index @; n = $s.length; mFocus $s.eq (i + d + n) % n
        false

      $m = $(@).empty().addClass('menu').append arg.map render
      $m.find('>div>a').addClass 'm-top'
      $m.on 'mouseover', 'a', -> $(@).closest('.menu').children().is('.m-open') && mFocus @; return
        .on 'mousedown', 'a.m-top', -> (if $(@).parentsUntil('.menu').last().is '.m-open' then mFocus null else mFocus @); false
        .on 'click',     'a.m-top', -> false
        .on 'keydown', '*', 'left',  leftRight -1
        .on 'keydown', '*', 'right', leftRight 1
        .on 'keydown', '*', 'up',    upDown -1
        .on 'keydown', '*', 'down',  upDown 1
        .on 'keydown', '*', 'esc f10', -> mFocus null; false

      isAccessKeyEvent = (e) -> e.altKey && !e.ctrlKey && !e.shiftKey && 65 <= e.which <= 90
      $(document)
        .on 'keydown', '*', 'f10', -> $m.children().eq(0).addClass('m-open').find('a').eq(1).focus(); false
        .on 'keyup keypress', (e) -> !isAccessKeyEvent e
        .keydown (e) -> if isAccessKeyEvent e then $m.find("[accessKey=#{String.fromCharCode(e.which).toLowerCase()}]:visible").mousedown(); false
        .mousedown (e) -> (if !$(e.target).closest('.menu').length then mFocus null); return
      return
