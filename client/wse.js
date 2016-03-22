'use strict'
// workspace explorer
var $t,h={} // $t:jstree instance, h:pending callbacks indexed by node id
this.replyTreeList=function(x){
  var p=x.nodeId;if(!h[p])return // p:parent node id, c:child node id
  h[p](x.nodeIds.map(function(c,i){return{text:x.names[i],children:!!c,id:'wse-'+(c||(p+'-'+i))}}))
  delete h[p]
}
function fData(x,f){var i=x.id==='#'?0:+x.id.replace(/\D+/g,'');h[i]=f.bind(this);D.ide.emit('TreeList',{nodeId:i})}
CodeMirror.commands.WSE=function(){
  if($t){var op=$t.dialog('isOpen');$t.dialog(op?'close':'open');op||$t.jstree('refresh');return}
  $t=$('<div class=wse>').dialog({title:'Workspace Explorer'})
                         .jstree({core:{animation:0,check_callback:true,data:fData},plugins:[]})
  $t.on('dblclick','.jstree-anchor',function(e){D.ide.emit('TreeAction',{nodeId:+this.id.replace(/\D+/g,'')});return!1})
}
