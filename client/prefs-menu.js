var prefs=require('./prefs')
var $ta // the textarea
this.name='Menu'
this.init=function($e){
  $e.html('<a href=# class=reset>Reset</a><p>Takes effect on restart</p><textarea wrap=off></textarea>')
  $ta=$('textarea',$e)
  $('.reset',$e).button().click(function(){$ta.val(prefs.menu.getDefault());return false})
}
this.load=function(){$ta.val(prefs.menu())}
this.save=function(){prefs.menu($ta.val())}
this.validate=function(){
  try {
    function visit(x){
      if(x.cmd==='PRF')return 1
      if(x.items)for(var i=0;i<x.items.length;i++)if(visit(x.items[i]))return 1
    }
    var ok=0,a=this.parseMenuDSL($ta.val());for(var i=0;i<a.length;i++)if(visit(a[i])){ok=1;break}
    if(!ok)return{message:'Menu must contain the PRF (Preferences) command',element:$ta}
  }catch(e){
    return{message:e.message,element:$ta}
  }
}
var extraOpts={
  LBR:{checkBoxPref:prefs.lbar      },
  FLT:{checkBoxPref:prefs.floating  },
  WRP:{checkBoxPref:prefs.wrap      },
  TOP:{checkBoxPref:prefs.floatOnTop},
  THM:{items:['Classic','Redmond','Cupertino'].map(function(x,i){
    return{'':x,group:'themes',checked:prefs.theme()===x.toLowerCase(),action:function(){prefs.theme(x.toLowerCase())}}
  })}
}
this.parseMenuDSL=function(md){ // md:menu description
  var stk=[{ind:-1,items:[]}],lines=md.split('\n')
  for(var i=0;i<lines.length;i++){
    var s=lines[i]
    if(!(!/^\s*$/.test(s=s.replace(/#.*/,''))))continue
    var cond='';s=s.replace(/\{(.*)\}/,function(_,x){cond=x;return''})
    var url='';s=s.replace(/\=(https?:\/\/\S+)/,function(_,x){url=x;return''})
    var cmd='';s=s.replace(/\=([a-z][a-z0-9]+)/i,function(_,x){cmd=x;return''})
    var h={ind:s.replace(/\S.*/,'').length,'':s.replace(/^\s*|\s*$/g,'')}
    while(h.ind<=stk[stk.length-1].ind)stk.pop()
    if(!cond||new Function('var browser=!'+D.nwjs+',mac='+D.mac+',win='+D.win+';return('+cond+')')()){
      var base=stk[stk.length-1];(base.items||(base.items=[])).push(h)
    }
    stk.length!==1||h.items||(h.items=[]) // force top-level items to be menus
    stk.push(h)
    if(cmd){
      h.cmd=cmd
      h.action=(function(cmd){
        return function(){
          var f
          if(f=CodeMirror.commands[cmd])f(D.ide.focusedWin.cm)
          else if(D.ide[cmd])D.ide[cmd]()
          else $.alert('Unknown command: '+cmd)
        }
      })(cmd)
    }else if(url){
      h.action=(function(url){return function(){D.openExternal(url)}})(url)
    }
    $.extend(h,extraOpts[cmd])
  }
  return stk[0].items
}
