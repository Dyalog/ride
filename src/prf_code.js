//Preferences > Code
;(function(){'use strict'

var q //DOM elements whose ids start with "code_", keyed by the rest of the id
D.prf_tabs.code={
  name:'Code',
  init:function(t){
    q=J.code
    var updEnabling=function(){q.sw.disabled=q.aim.disabled=!q.ai.checked;q.swm.disabled=!q.ai.checked||!q.aim.checked}
    q.ai  .onchange=function(){updEnabling();q.ai .checked&&q.sw .select()}
    q.aim .onchange=function(){updEnabling();q.aim.checked&&q.swm.select()}
    q.acbl.onchange=function(){q.acbe.disabled=!q.acbl.checked;q.acbl.checked&&q.acbe.focus()}
    q.ac  .onchange=function(){q.acd .disabled=!q.ac  .checked;q.ac.checked&&q.acd.select()}
  },
  load:function(){
    var p=D.prf
    var sw =p.indent       ();q.ai .checked=sw >=0;q.sw .value=sw <0&&4||sw
    var swm=p.indentMethods();q.aim.checked=swm>=0;q.swm.value=swm<0&&2||swm
    q.icom.checked=!!p.indentComments     ()
    q.io  .checked=!!p.indentOnOpen       ()
    q.ilf .checked=!!p.ilf                ()
    q.mb  .checked=!!p.matchBrackets      ()
    q.acbr.checked=!!p.autoCloseBrackets  ()
    q.acbl.checked=!!p.autoCloseBlocks    ()
    q.acbe.value  =  p.autoCloseBlocksEnd ()
    q.ac  .checked=!!p.autocompletion     ()
    q.acd .value  =  p.autocompletionDelay()
    q.dark.checked=!!p.dark()
    q.bc.checked=!!p.blockCursor        ()
    q.blc.checked=!!p.blinkCursor         ()
    q.fold.checked=!!p.fold               ()
    q.vt  .checked=!!p.valueTips          ()
    q.sqt .checked=!!p.squiggleTips       ()
    q.sqp .checked=!!p.sqp                ()
    q.ai.onchange();q.acbl.onchange();q.ac.onchange()
  },
  activate:function(){q.ai.focus()},
  save:function(){
    var p=D.prf
    p.indent             (q.ai .checked?(+q.sw .value||0):-1)
    p.indentMethods      (q.aim.checked?(+q.swm.value||0):-1)
    p.indentComments     (q.icom.checked)
    p.indentOnOpen       (q.io  .checked)
    p.ilf                (q.ilf .checked)
    p.matchBrackets      (q.mb  .checked)
    p.autoCloseBrackets  (q.acbr.checked)
    p.autoCloseBlocks    (q.acbl.checked)
    p.autoCloseBlocksEnd (q.acbe.value)
    p.autocompletion     (q.ac  .checked)
    p.autocompletionDelay(q.acd .value)
    p.blockCursor        (q.bc.checked)
    p.blinkCursor        (q.blc.checked)
    p.fold               (q.fold.checked)
    p.valueTips          (q.vt  .checked)
    p.squiggleTips       (q.sqt .checked)
    p.sqp                (q.sqp .checked)
    p.dark                (q.dark .checked)
  },
  validate:function(){
    if(q.ai .checked&&!isInt(q.sw .value,0))return{msg:'Auto-indent must be a non-negative integer.'           ,el:q.sw}
    if(q.aim.checked&&!isInt(q.swm.value,0))return{msg:'Auto-indent in methods must be a non-negative integer.',el:q.swm}
    if(q.ac .checked&&!isInt(q.acd.value,1))return{msg:'Autocompletion delay must be a positive integer.'      ,el:q.acd}
  }
}
function isInt(x,minX){x=+x;return x===(x|0)&&x>=minX}

}())
