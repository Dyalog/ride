//workspace explorer
'use strict'
D.WSE=function(){
  var pending=this.pending={};this.dom=I.wse;this.dom.hidden=0
  this.dom.onclick=function(x){var t=x.target.closest('.jstree-anchor');if(!t)return
                               D.send('Edit',{win:0,pos:0,text:$e.jstree('get_path',t,'.')})
                               ;/^wse_leaf_/.test(t.id)||$e.jstree('refresh_node',t)}
  var $e=this.$e=$(this.dom).jstree({plugins:[],core:{animation:true,check_callback:true,data:function(x,f){
    var i=x.id==='#'?0:+x.id.replace(/\D+/g,'');pending[i]=f.bind(this);D.send('TreeList',{nodeId:i})
  }}})
}
D.WSE.prototype={
  replyTreeList:function(x){
    var f=this.pending[x.nodeId];if(!f)return
    f((x.nodeIds||[]).map(function(c,i){
      var t=Math.floor(x.classes[i]);return{text:x.names[i],children:!!c,id:'wse_'+(c||('leaf_'+x.nodeId+'_'+i)),
                                            icon:c?'':2<=t&&t<=4?'style/img/wse_nc'+t+'.png':'img/tb_ED.png'}
    }))
    delete this.pending[x.nodeId]
  },
  refresh:function(){this.$e.jstree('refresh')}
}
