;(function(){'use strict'
//This file implements the Preferences dialog as a whole. Individual tabs are in separate files: prf_*.js
//Tab implementations can export the following properties:
// name       tab title
// id         a string used to construct DOM ids, CSS classes, etc
// init()     called only once, before Preferences is opened for the first time
// load()     called every time Preferences is opened
// validate() should return a falsey value on success or a {msg,el} object on failure
// save()     called when OK or Apply is pressed
// resize()   called when the Preferences dialog is resized or the tab is selected
// activate() called when the tab is selected ("activated")
//
//Before any attempt to call save(), all tabs' validate() methods are tested.
//If any of them returns a falsey value, save() is aborted.
var tabs=D.prf_tabs={} //tab implementations self-register here

var d //DOM element for the dialog, lazily initialized
function ok(){apply()&&cancel()}
function apply(){ //returns 0 on failure and 1 on success
  var v
  for(var i in tabs)if(v=tabs[i].validate&&tabs[i].validate()){
    setTimeout(function(){$.err(v.msg,v.el?function(){v.el.focus()}:null)},1)
    return 0
  }
  for(var i in tabs)tabs[i].save()
  return 1
}
function cancel(){
  if(D.el){
    D.ipc.of.ride_master.emit('prfClose')
  } else {
    d.hidden=1;D.ide.wins[0].focus()
  }
}
D.prf_ui=function(){
  if(D.prf_bw){
    D.ipc.server.emit(D.prf_bw.socket,'show');
    D.el.BrowserWindow.fromId(D.prf_bw.id).show();
    return!1
  }
  if(!d){
    d=I.prf_dlg
    d.onkeydown=function(x){if(x.which===13&&!x.shiftKey&&x.ctrlKey&&!x.altKey&&!x.metaKey){ok();return!1}
                            if(x.which===27&&!x.shiftKey&&!x.ctrlKey&&!x.altKey&&!x.metaKey){cancel();return!1}}
//    onresize=function(){for(var i in tabs)tabs[i].resize&&tabs[i].resize()}
    I.prf_dlg_ok    .onclick=function(){ok()    ;return!1}
    I.prf_dlg_apply .onclick=function(){apply() ;return!1}
    I.prf_dlg_cancel.onclick=function(){cancel();return!1}
    var hdrs=I.prf_nav.children,payloads=[]
    I.prf_nav.onclick=function(x){return!1}
    I.prf_nav.onmousedown=function(x){
      var a=x.target;if(a.nodeName!=='A')return!1
      for(var i=0;i<hdrs.length;i++){var b=a===hdrs[i];payloads[i].hidden=!b;hdrs[i].className=b?'sel':''}
      var t=tabs[a.href.replace(/.*#/,'')];t.resize&&t.resize();t.activate&&t.activate()
      x.preventDefault();return!1
    }
    for(var i=0;i<hdrs.length;i++){var id=hdrs[i].href.replace(/.*#/,''),e=document.getElementById(id)
                                   tabs[id].init(e);payloads.push(e)}
  }
  if(D.el){
    let t=d.querySelector('.dlg_title');t&&(t.hidden=1)
    document.title=t.innerText;
    d.style='width:100%;height:100%';d.hidden=0;
  } else {D.util.dlg(d,{w:600,h:490})}
  for(var i in tabs)tabs[i].load()
  var t=tabs[(((document.getElementById('prf_nav').querySelector('.sel')||{}).href)||'').replace(/.*#/,'')]
  t&&t.activate&&t.activate()
}

}())
