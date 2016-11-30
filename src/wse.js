//workspace explorer
'use strict'
D.WSE=function(){
  var pending=this.pending={};this.dom=I.wse;this.dom.hidden=0
  var bt=new Bonsai(this.dom,{
    children:function(id,callback){pending[id]=callback.bind(this);D.send('TreeList',{nodeId:id})},
    click:function(path){D.send('Edit',{win:0,pos:0,text:path.map(function(x){return x.text}).join('.')})}
  })
}
D.WSE.prototype={
  replyTreeList:function(x){ //handle response from interpreter
    var f=this.pending[x.nodeId];if(!f)return
    f((x.nodeIds||[]).map(function(c,i){
      //x.classes uses constants from http://help.dyalog.com/15.0/Content/Language/System%20Functions/nc.htm
      return{id:c||('leaf_'+x.nodeId+'_'+i),text:x.names[i],expandable:!!c,icon:(''+Math.abs(x.classes[i])).replace('.','_')}
    }))
    delete this.pending[x.nodeId]
  },
  refresh:function(){/*todo*/}
}
