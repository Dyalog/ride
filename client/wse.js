'use strict'
// workspace explorer
var $t // $t:jstree instance, $d:dialog instance
CodeMirror.commands.WSE=function(){
  if($t){$t.dialog($t.dialog('isOpen')?'close':'open');return}
  $t=$('<div class=wse>').dialog({title:'Workspace Explorer'}).jstree({
    core:{
      animation:0,
      check_callback:true,
      themes:{stripes:true},
      data:function(x,f){
        var p=x.id==='#'?1:x.id
        f.call(this,[
          {id:2*p  ,text:'node'+(2*p  ),children:true},
          {id:2*p+1,text:'node'+(2*p+1),children:true}
        ])
      }
    },
    types:{
      '#':{max_children:2,'max_depth':10,'valid_children':['root']},
      root:{icon:'/static/3.2.1/assets/images/tree_icon.png',valid_children:['default']},
      'default':{valid_children:['default','file']},
      file:{icon:'glyphicon glyphicon-file',valid_children:[]}
    },
    plugins:['contextmenu','dnd','search','state','types','wholerow']
  })
}
