;(function(){'use strict'

var on=CodeMirror.on
var h={} // various input elements
D.prf_tabs.push({
  tabTitle:'Code',
  init:function($e){
    $e[0].innerHTML=
      '<div>'+
        '<p><label><input id=code-ai   type=checkbox>A<u>u</u>to-indent</label> <label><input id=code-sw  size=1> spaces</label>'+
        '<p><label><input id=code-aim  type=checkbox>in <u>m</u>ethods:</label> <label><input id=code-swm size=1> spaces</label>'+
        '<p><label><input id=code-icom type=checkbox><u>I</u>ndent lines that contain only a comment</label>'+
        '<p><label><input id=code-io   type=checkbox>I<u>n</u>dent content when an editor is opened</label>'+
        '<p><label><input id=code-mb   type=checkbox><u>H</u>ighlight matching brackets: <tt>()[]{}</tt></label></p>'+
        '<p><label><input id=code-acbr type=checkbox>Au<u>t</u>o-close brackets</label>'+
        '<p><label><input id=code-acbl type=checkbox>Auto-c<u>l</u>ose blocks: <tt>:If :For ...</tt></label>'+
           '<label><u>w</u>ith <select id=code-acbe><option value=0>:EndIf,:EndFor,...<option value=1>just :End</select></label>'+
        '<p><label><input id=code-ac   type=checkbox>Autocom<u>p</u>letion</label> <label>a<u>f</u>ter <input id=code-acd size=5>ms</label>'+
        '<p><label><input id=code-fold type=checkbox>Co<u>d</u>e folding (outlining)</label>'+
        '<p><label><input id=code-vt   type=checkbox>Show <u>v</u>alue tips</label>'+
        '<p><label><input id=code-sqt  type=checkbox>Show tips for <u>g</u>lyphs</label>'+
      '</div>'
    $('[id^=code-]',$e).each(function(){h[this.id.replace(/^code-/,'')]=this})
    $(h.ai).add(h.aim)
      .change(function(x){h.sw.disabled=h.aim.disabled=!h.ai.checked;h.swm.disabled=!h.ai.checked||!h.aim.checked})
    on(h.acbl,'change',function(){h.acbe.disabled=!this.checked})
    on(h.ac  ,'change',function(){h.acd .disabled=!this.checked})
    ;[h.sw,h.swm,h.acd].forEach(function(x){on(x,'change',function(){$(this).select()})})
  },
  load:function(){
    var p=D.prf
    var sw =p.indent       ();h.ai .checked=sw >=0;h.sw .value=sw <0&&4||sw
    var swm=p.indentMethods();h.aim.checked=swm>=0;h.swm.value=swm<0&&2||swm
    h.icom.checked=!!p.indentComments     ()
    h.io  .checked=!!p.indentOnOpen       ()
    h.mb  .checked=!!p.matchBrackets      ()
    h.acbr.checked=!!p.autoCloseBrackets  ()
    h.acbl.checked=!!p.autoCloseBlocks    ()
    h.acbe.value  =  p.autoCloseBlocksEnd ()
    h.ac  .checked=!!p.autocompletion     ()
    h.acd .value  =  p.autocompletionDelay()
    h.fold.checked=!!p.fold               ()
    h.vt  .checked=!!p.valueTips          ()
    h.sqt .checked=!!p.squiggleTips       ()
    $(h.ai).add(h.acbl).add(h.ac).change()
  },
  save:function(){
    var p=D.prf
    p.indent             (h.ai .checked?(+h.sw .value||0):-1)
    p.indentMethods      (h.aim.checked?(+h.swm.value||0):-1)
    p.indentComments     (h.icom.checked)
    p.indentOnOpen       (h.io  .checked)
    p.matchBrackets      (h.mb  .checked)
    p.autoCloseBrackets  (h.acbr.checked)
    p.autoCloseBlocks    (h.acbl.checked)
    p.autoCloseBlocksEnd (h.acbe.value)
    p.autocompletion     (h.ac  .checked)
    p.autocompletionDelay(h.acd .value)
    p.fold               (h.fold.checked)
    p.valueTips          (h.vt  .checked)
    p.squiggleTips       (h.sqt .checked)
  },
  validate:function(){
    if(h.ai .checked&&!isInt(h.sw .value,0))return{msg:'Auto-indent must be a non-negative integer.'           ,h:h.ai}
    if(h.aim.checked&&!isInt(h.swm.value,0))return{msg:'Auto-indent in methods must be a non-negative integer.',h:h.aim}
    if(h.ac .checked&&!isInt(h.acd.value,1))return{msg:'Autocompletion delay must be a positive integer.'      ,h:h.acd}
  }
})
function isInt(x,minX){x=+x;return x===(x|0)&&x>=minX}

}())
