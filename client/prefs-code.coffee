prefs = require './prefs'
{delay} = require './util'

@name = 'Code'

$ai = $sw = $aim = $swm = $mb = $acbr = $acbl = $acbe = $ac = $acd = $fold = null

@init = ($e) ->
  $e.html '''
    <p><label><input id=code-ai   type=checkbox>Auto-indent</label> <label><input id=code-sw  size=1> spaces</label>
    <!--<p><label><input id=code-aim  type=checkbox>in methods:</label> <label><input id=code-swm size=1> spaces</label>-->
    <p><label><input id=code-mb   type=checkbox>Highlight matching brackets: <tt>()[]{}</tt></label></p>
    <p><label><input id=code-acbr type=checkbox>Auto-close brackets</label>
    <p><label><input id=code-acbl type=checkbox>Auto-close blocks: <tt>:If :For ...</tt></label>
       <label>with <select id=code-acbe>
         <option value=0>:EndIf,:EndFor,...
         <option value=1>just :End
       </select></label>
    <p><label><input id=code-ac   type=checkbox>Autocompletion</label> <label>after <input id=code-acd size=5>ms</label>
    <p><label><input id=code-fold type=checkbox>Code folding</label>
  '''
  $ai   = $ '#code-ai'
  $sw   = $ '#code-sw'
  $aim  = $ '#code-aim'
  $swm  = $ '#code-swm'
  $mb   = $ '#code-mb'
  $acbr = $ '#code-acbr'
  $acbl = $ '#code-acbl'
  $acbe = $ '#code-acbe'
  $ac   = $ '#code-ac'
  $acd  = $ '#code-acd'
  $fold = $ '#code-fold'
  $ai.add($aim).change ->
    $sw.add($aim).prop 'disabled', !$ai.is ':checked'
    $swm.prop 'disabled', !$ai.is(':checked') || !$aim.is ':checked'
    return
  $acbl.change -> $acbe.prop 'disabled', !$(@).is ':checked'; return
  $ac  .change -> $acd .prop 'disabled', !$(@).is ':checked'; return
  $sw.add($swm).add($acd).click -> $(@).select(); return
  return

@load = ->
  sw  = prefs.indent();        $ai .prop 'checked', sw  >= 0; $sw .val sw  < 0 && 4 || sw
  swm = prefs.indentMethods(); $aim.prop 'checked', swm >= 0; $swm.val swm < 0 && 2 || swm
  $mb  .prop 'checked', !!prefs.matchBrackets()
  $acbr.prop 'checked', !!prefs.autoCloseBrackets()
  $acbl.prop 'checked', !!prefs.autoCloseBlocks()
  $acbe.val               prefs.autoCloseBlocksEnd()
  $ac  .prop 'checked', !!prefs.autocompletion()
  $acd .val               prefs.autocompletionDelay()
  $fold.prop 'checked', !!prefs.fold()
  $ai.add($acbl).add($ac).change()
  return

@save = ->
  prefs.indent              if $ai .is ':checked' then +$sw .val() || 0 else -1
  prefs.indentMethods       if $aim.is ':checked' then +$swm.val() || 0 else -1
  prefs.matchBrackets       $mb  .is ':checked'
  prefs.autoCloseBrackets   $acbr.is ':checked'
  prefs.autoCloseBlocks     $acbl.is ':checked'
  prefs.autoCloseBlocksEnd  $acbe.val()
  prefs.autocompletion      $ac  .is ':checked'
  prefs.autocompletionDelay $acd .val()
  prefs.fold                $fold.is ':checked'
  return
