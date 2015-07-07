prefs = require './prefs'

@name = 'Code'

$acb = null # "auto-close brackets" checkbox

@init = ($e) ->
  $e.html '''
    <p><label><input id=code-acb type=checkbox> Auto-close brackets: <tt>{}[]()</tt></label></p>
  '''
  $acb = $ '#code-acb'
  return

@load = -> $acb.prop 'checked', !!prefs.autoCloseBrackets(); return
@save = -> prefs.autoCloseBrackets $acb.is ':checked'; return
