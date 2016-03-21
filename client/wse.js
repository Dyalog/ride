'use strict'
// workspace explorer
var $t,h={} // $t:jstree instance, h:pending callbacks indexed by node id
this.replyTreeList=function(x){
  var id=x.nodeId;if(!h[id])return
  h[id](x.names.map(function(y,i){return{text:y,children:true,id:'wse-'+(x.nodeIds[i]||(id+'-'+i))}}));delete h[id]
}
CodeMirror.commands.WSE=function(){
  if($t){var op=$t.dialog('isOpen');$t.dialog(op?'close':'open');op||$t.jstree('refresh');return}
  $t=$('<div class=wse>').dialog({title:'Workspace Explorer'}).jstree({
    core:{
      animation:0,check_callback:true,
      data:function(x,f){
        var i=x.id==='#'?0:+x.id.replace(/\D+/g,'')
        h[i]=f.bind(this);D.ide.emit('TreeList',{nodeId:i})
      }
    },
    plugins:[]
  })
  $t.on('dblclick','.jstree-anchor',function(e){
    D.ide.emit('TreeAction',{nodeId:+this.id.replace(/\D+/g,'')});return!1
  })
}
