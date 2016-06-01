D.modules['prefs-menu']=function(require){'use strict'

var prefs=require('./prefs')
var $ta // the textarea
this.tabTitle='Menu'
this.init=function($e){
  $e[0].innerHTML='<button class=rst><u>R</u>eset</button>'+
                  '<p>Takes effect on restart</p><textarea wrap=off></textarea>'
  $ta=$('textarea',$e);$('.rst',$e).click(function(){$ta.val(prefs.menu.getDefault())})
}
this.load=function(){$ta.val(prefs.menu())}
this.save=function(){prefs.menu($ta.val())}
this.validate=function(){
  try {
    var visit=function(x){
      if(x.cmd==='PRF')return 1
      if(x.items)for(var i=0;i<x.items.length;i++)if(visit(x.items[i]))return 1
    }
    var ok=0,a=this.parseMenuDSL($ta.val());for(var i=0;i<a.length;i++)if(visit(a[i])){ok=1;break}
    if(!ok)return{msg:'Menu must contain the PRF (Preferences) command',el:$ta}
  }catch(e){
    return{msg:e.message,el:$ta}
  }
}
var extraOpts={
  LBR:{checkBoxPref:prefs.lbar      },
  FLT:{checkBoxPref:prefs.floating  },
  WRP:{checkBoxPref:prefs.wrap      },
  TOP:{checkBoxPref:prefs.floatOnTop},
  WSE:{checkBoxPref:prefs.wse       },
  THM:{items:['Classic','Redmond','Cupertino'].map(function(x,i){
    return{'':x,group:'themes',checked:prefs.theme()===x.toLowerCase(),action:function(){prefs.theme(x.toLowerCase())}}
  })}
}
this.parseMenuDSL=function(md){ // md:menu description
  var stk=[{ind:-1,items:[]}],lines=md.split('\n')
  for(var i=0;i<lines.length;i++){
    var s=lines[i]
    if(/^\s*$/.test(s=s.replace(/#.*/,'')))continue
    var cond='';s=s.replace(/\{(.*)\}/,function(_,x){cond=x;return''})
    var url='';s=s.replace(/\=(https?:\/\/\S+)/,function(_,x){url=x;return''})
    var cmd='';s=s.replace(/\=([a-z][a-z0-9]+)/i,function(_,x){cmd=x;return''})
    var h={ind:s.replace(/\S.*/,'').length,'':s.replace(/^\s*|\s*$/g,'')}
    while(h.ind<=stk[stk.length-1].ind)stk.pop()
    if(!cond||new Function('var browser='+!D.el+',mac='+D.mac+',win='+D.win+';return('+cond+')')()){
      var base=stk[stk.length-1];(base.items||(base.items=[])).push(h)
    }
    stk.length!==1||h.items||(h.items=[]) // force top-level items to be menus
    stk.push(h)
    if(cmd){
      h.cmd=cmd
      h.action=function(cmd){
        return function(){
          var f=CodeMirror.commands[cmd]
          f?f(D.ide.focusedWin.cm):D.ide[cmd]?D.ide[cmd]():$.alert('Unknown command: '+cmd)
        }
      }(cmd)
    }else if(url){
      h.action=D.openExternal.bind(D,url)
    }
    $.extend(h,extraOpts[cmd])
  }
  return stk[0].items
}

}
