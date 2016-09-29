//Preferences > Menu
;(function(){'use strict'

var ta //the textarea
D.prf_tabs.pmenu={
  name:'Menu',
  init:function(t){ta=I.pmenu_ta;I.pmenu_rst.onclick=function(){ta.value=D.prf.menu.getDefault()}},
  load:function(){ta.value=D.prf.menu()},
  activate:function(){ta.scrollTop=ta.selectionStart=ta.selectionEnd=0;ta.focus()},
  save:function(){D.prf.menu(ta.value)},
  validate:function(){
    try {
      var visit=function(x){
        if(x.cmd==='PRF')return 1
        if(x.items)for(var i=0;i<x.items.length;i++)if(visit(x.items[i]))return 1
      }
      var ok=0,a=D.parseMenuDSL(ta.value);for(var i=0;i<a.length;i++)if(visit(a[i])){ok=1;break}
      if(!ok)return{msg:'Menu must contain the PRF (Preferences) command',el:ta}
    }catch(e){
      return{msg:e.message,el:ta}
    }
  }
}
D.parseMenuDSL=function(md){ //md:menu description
  var extraOpts={
    LBR:{checkBoxPref:D.prf.lbar      },
    FLT:{checkBoxPref:D.prf.floating  },
    WRP:{checkBoxPref:D.prf.wrap      },
    TOP:{checkBoxPref:D.prf.floatOnTop},
    WSE:{checkBoxPref:D.prf.wse       },
    THM:{items:['Classic','Redmond','Cupertino'].map(function(x,i){
      return{'':x,group:'thm',checked:D.prf.theme()===x.toLowerCase(),action:function(){D.prf.theme(x.toLowerCase())}}
    })}
  }
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
        return function(){var f=CodeMirror.commands[cmd]
                          f?f(D.ide.focusedWin.cm):D.ide[cmd]?D.ide[cmd]():$.err('Unknown command: '+cmd)}
      }(cmd)
    }else if(url){
      h.action=D.openExternal.bind(D,url)
    }
    $.extend(h,extraOpts[cmd])
  }
  return stk[0].items
}

}())
