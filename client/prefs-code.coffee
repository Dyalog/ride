prefs = require './prefs'
{delay} = require './util'

@name = 'Code'

$acb = # checkbox for "Auto-close brackets"
$ai  = # checkbox for "Auto-indent"
$sw  = # input box for the amount of indent (in Vim they refer to this as the "shiftwidth" or "sw")
$aim = $swm = # like $ai and $sw but for methods
$fold = null

updateAutoIndentFields = ->
  $sw.add($aim).prop 'disabled', !$ai.is ':checked'
  $swm.prop 'disabled', !$ai.is(':checked') || !$aim.is ':checked'
  return

@init = ($e) ->
  $e.html '''
    <p><label><input id=code-acb  type=checkbox>Auto-close brackets: <tt>{}[]()</tt></label>
    <p><label><input id=code-ai   type=checkbox>Auto-indent</label> <label><input id=code-sw  size=1> spaces</label>
    <p><label><input id=code-aim  type=checkbox>in methods:</label> <label><input id=code-swm size=1> spaces</label>
    <p><label><input id=code-fold type=checkbox>Code folding</label>
  '''
  $acb = $ '#code-acb'; $ai = $ '#code-ai'; $sw = $ '#code-sw'; $aim = $ '#code-aim'; $swm = $ '#code-swm'
  $fold = $ '#code-fold'
  $ai.add($aim).change updateAutoIndentFields
  $sw.add($swm).click -> $(@).select(); return
  return

@load = ->
  $acb.prop 'checked', !!prefs.autoCloseBrackets(); $fold.prop 'checked', !!prefs.fold()
  sw  = prefs.indent();        $ai .prop 'checked', sw  >= 0; $sw .val sw  < 0 && 4 || sw
  swm = prefs.indentMethods(); $aim.prop 'checked', swm >= 0; $swm.val swm < 0 && 2 || swm
  updateAutoIndentFields(); return

@save = ->
  prefs.autoCloseBrackets $acb.is ':checked'; prefs.fold $fold.is ':checked'
  prefs.indent        if $ai .is ':checked' then +$sw .val() || 0 else -1
  prefs.indentMethods if $aim.is ':checked' then +$swm.val() || 0 else -1
  return
