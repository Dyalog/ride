prefs = require './prefs'
$ta = null # the textarea
@name = 'Menu'
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
