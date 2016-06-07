// workspace explorer
'use strict'
D.WSE=function($e,ide){
  var pending=this.pending={}
  this.$e=$e
    .jstree({plugins:[],core:{animation:true,check_callback:true,data:function(x,f){
      var i=x.id==='#'?0:+x.id.replace(/\D+/g,'');pending[i]=f.bind(this);ide.emit('TreeList',{nodeId:i})
    }}})
    .on('click','.jstree-anchor',function(){
      ide.emit('Edit',{win:0,pos:0,text:$e.jstree('get_path',this,'.')})
      ;/^wse-leaf-/.test(this.id)||$e.jstree('refresh_node',this)
    })
}
D.WSE.prototype={
  replyTreeList:function(x){
    var f=this.pending[x.nodeId];if(!f)return
    f((x.nodeIds||[]).map(function(c,i){
      var t=Math.floor(x.classes[i])
      return{text:x.names[i],children:!!c,id:'wse-'+(c||('leaf-'+x.nodeId+'-'+i)),
             icon:c?'':2<=t&&t<=4?'style/img/wse-t'+t+'.png':'img/tb-ED.png'}
    }))
    delete this.pending[x.nodeId]
  },
  refresh:function(){this.$e.jstree('refresh')}
}
