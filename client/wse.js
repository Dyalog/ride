'use strict'
// workspace explorer
var $t,h={} // $t:jstree instance, h:pending callbacks indexed by node id
this.replyTreeList=function(x){
  var i=x.nodeId;if(!h[i])return
  h[i](x.children.map(function(c){return{id:'wse-'+c.id,text:c.name,children:true}}))
  delete h[i]
}
CodeMirror.commands.WSE=function(){
  if($t){$t.dialog($t.dialog('isOpen')?'close':'open');return}
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
