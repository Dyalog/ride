var prefs=require('./prefs')
var $ai,$sw,$aim,$icom,$swm,$io,$mb,$acbr,$acbl,$acbe,$ac,$acd,$fold
this.name='Code'
this.init=function($e){
  $e.html(
    '<div>'+
      '<p><label><input id=code-ai   type=checkbox>Auto-indent</label> <label><input id=code-sw  size=1> spaces</label>'+
      '<p><label><input id=code-aim  type=checkbox>in methods:</label> <label><input id=code-swm size=1> spaces</label>'+
      '<p><label><input id=code-icom type=checkbox>Indent lines that contain only a comment</label>'+
      '<p><label><input id=code-io   type=checkbox>Indent content when an editor is opened</label>'+
      '<p><label><input id=code-mb   type=checkbox>Highlight matching brackets: <tt>()[]{}</tt></label></p>'+
      '<p><label><input id=code-acbr type=checkbox>Auto-close brackets</label>'+
      '<p><label><input id=code-acbl type=checkbox>Auto-close blocks: <tt>:If :For ...</tt></label>'+
         '<label>with <select id=code-acbe><option value=0>:EndIf,:EndFor,...<option value=1>just :End</select></label>'+
      '<p><label><input id=code-ac   type=checkbox>Autocompletion</label> <label>after <input id=code-acd size=5>ms</label>'+
      '<p><label><input id=code-fold type=checkbox>Code folding (outlining)</label>'+
    '</div>'
  )
  $ai  =$('#code-ai'  )
  $sw  =$('#code-sw'  )
  $aim =$('#code-aim' )
  $swm =$('#code-swm' )
  $icom=$('#code-icom')
  $io  =$('#code-io'  )
  $mb  =$('#code-mb'  )
  $acbr=$('#code-acbr')
  $acbl=$('#code-acbl')
  $acbe=$('#code-acbe')
  $ac  =$('#code-ac'  )
  $acd =$('#code-acd' )
  $fold=$('#code-fold')
  $ai.add($aim).change(function(){
    $sw.add($aim).prop('disabled',!$ai.is(':checked'))
    $swm.prop('disabled',!$ai.is(':checked')||!$aim.is(':checked'))
  })
  $acbl.change(function(){$acbe.prop('disabled',!$(this).is(':checked'))})
  $ac  .change(function(){$acd .prop('disabled',!$(this).is(':checked'))})
  $sw.add($swm).add($acd).click(function(){$(this).select()})
}
this.load=function(){
  sw =prefs.indent       ();$ai .prop('checked',sw >=0);$sw .val(sw <0&&4||sw )
  swm=prefs.indentMethods();$aim.prop('checked',swm>=0);$swm.val(swm<0&&2||swm)
  $icom.prop('checked',!!prefs.indentComments     ())
  $io  .prop('checked',!!prefs.indentOnOpen       ())
  $mb  .prop('checked',!!prefs.matchBrackets      ())
  $acbr.prop('checked',!!prefs.autoCloseBrackets  ())
  $acbl.prop('checked',!!prefs.autoCloseBlocks    ())
  $acbe.val (            prefs.autoCloseBlocksEnd ())
  $ac  .prop('checked',!!prefs.autocompletion     ())
  $acd .val (            prefs.autocompletionDelay())
  $fold.prop('checked',!!prefs.fold               ())
  $ai.add($acbl).add($ac).change()
}
this.save=function(){
  prefs.indent             ($ai .is(':checked')?(+$sw .val()||0):-1)
  prefs.indentMethods      ($aim.is(':checked')?(+$swm.val()||0):-1)
  prefs.indentComments     ($icom.is(':checked'))
  prefs.indentOnOpen       ($io  .is(':checked'))
  prefs.matchBrackets      ($mb  .is(':checked'))
  prefs.autoCloseBrackets  ($acbr.is(':checked'))
  prefs.autoCloseBlocks    ($acbl.is(':checked'))
  prefs.autoCloseBlocksEnd ($acbe.val())
  prefs.autocompletion     ($ac  .is(':checked'))
  prefs.autocompletionDelay($acd .val())
  prefs.fold               ($fold.is(':checked'))
}
