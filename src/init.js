var I={}, //all elements by id, eg I.lb_tip_text is document.getElementById('lb_tip_text')
    J={}  //grouped by id prefix using '_' as a separator; J[x][y] is the element with id x+'_'+y
          //eg J.lb.tip_text is document.getElementById('lb_tip_text')

;(function(){'use strict'

if(typeof node_require!=='undefined'){
  D.el=node_require('electron').remote
  D.elw=D.el.getGlobal('elw')
  D=$.extend(D,node_require('electron').remote.getGlobal('D'))
  var plt=process.platform;D.win=/^win/i.test(plt);D.mac=plt==='darwin'
}

var a=document.querySelectorAll('[id]')
for(var i=0;i<a.length;i++){var e=a[i],s=e.id,j=s.indexOf('_');I[s]=e;
                            if(j>=0){var u=s.slice(0,j),v=s.slice(j+1);(J[u]=J[u]||{})[v]=e}}

//don't use Alt- keystrokes on the Mac (see email from 2015-09-01)
var h=CM.keyMap.emacsy;for(var k in h)if(/^alt-[a-z]$/i.test(k))delete h[k]
if(D.el){
  var zM=11 //zoom level can be between -zM and zM inclusive
  var updPW=function(){D.ide&&D.ide.wins&&D.ide.wins[0]&&D.ide.wins[0].updPW()}
  CM.commands.ZMI=function(){D.prf.zoom(Math.min( zM,D.prf.zoom()+1));updPW()}
  CM.commands.ZMO=function(){D.prf.zoom(Math.max(-zM,D.prf.zoom()-1));updPW()}
  CM.commands.ZMR=function(){D.prf.zoom(0);updPW()}
  document.onmousewheel=
    function(e){var d=e.wheelDelta;d&&(e.ctrlKey||e.metaKey)&&!e.shiftKey&&!e.altKey&&CM.commands[d>0?'ZMI':'ZMO']()}
  document.body.className+=' zoom'+D.prf.zoom()
  D.prf.zoom(function(z){
    if(!D.ide)return
    var wins=D.ide.wins
    for(var x in wins){
      var w=wins[x],b=w.getDocument().body
      var btm_line=w.cm.lineAtHeight(w.btm,'local')
      var diff=w.btm-btm_line*w.cm.defaultTextHeight()
      b.className='zoom'+z+' '+b.className.split(/\s+/).filter(function(s){return!/^zoom-?\d+$/.test(s)}).join(' ')
      w.refresh()
      w.btm=w.cm.defaultTextHeight()*btm_line+diff;
    }
    wins[0].restoreScrollPos()
  })
}
D.open=D.open||function(url,o){
  var x=o.x,y=o.y,width=o.width,height=o.height,spec='resizable=1'
  if(width!=null&&height!=null)spec+=',width='+width+',height='+height
  if(x!=null&&y!=null)spec+=',left='+x+',top='+y+',screenX='+x+',screenY='+y
  return!!open(url,'_blank',spec)
}
D.openExternal=D.el?D.el.shell.openExternal:function(x){open(x,'_blank')}
if(/^\?\d+$/.test(location.search)){
  var winId=+location.search.slice(1)
  document.body.className+=' floating-window'
  document.body.textContent='editor '+winId
//  window.onresize=function(){ed&&ed.updSize()}
//  var pe=opener.D.pendingEditors[winId], editorOpts=pe.editorOpts, ee=pe.ee, ide=pe.ide
//  D.ide=opener.D.ide
//  var ed=D.ide.wins[winId]=new D.Ed(ide,$(document.body),editorOpts)
//  ed.open(ee);ed.updSize();document.title=ed.name
//  window.onbeforeunload=function(){return ed.onbeforeunload()}
//  setTimeout(function(){ed.refresh()},500) //work around a rendering issue on Ubuntu
//  D.ide.unblock()
}else{
  if(D.el){
  //context menu
    let cmenu=D.el.Menu.buildFromTemplate(
      ['Cut','Copy','Paste'].map(function(x){return{label:x,role:x.toLowerCase()}})
      .concat({type:'separator'})
      .concat(['Undo','Redo'].map(function(x){return{label:x,click:function(){
        let u=D.ide;u&&(u=u.focusedWin)&&(u=u.cm)&&u[x.toLowerCase()]&&u[x.toLowerCase()]()}}})))
    D.oncmenu=function(e){e.preventDefault();cmenu.popup(D.elw)}
    node_require(__dirname+'/src/cn')()
  }else{
    var ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host)
    var q=[],flush=function(){while(ws.readyState===1&&q.length)ws.send(q.shift())} //q:send queue
    D.send=function(x,y){q.push(JSON.stringify([x,y]));flush()}
    ws.onopen=function(){ws.send('SupportedProtocols=2')
                         ws.send('UsingProtocol=2')
                         ws.send('["Identify",{"identity":1}]')
                         ws.send('["Connect",{"remoteId":2}]')
                         ws.send('["GetWindowLayout",{}]')}
    ws.onmessage=function(x){if(x.data[0]==='['){var[c,h]=JSON.parse(x.data);D.recv(c,h)}}
    ws.onerror=function(x){console.info('ws error:',x)}
    new D.IDE
  }
  if(!D.quit)D.quit=close
}
window.onbeforeunload=function(e){
  if (D.ide&&!D.shutdown){
    e.returnValue=false
    setTimeout(function(){
      if (D.prf.sqp()){
        $.confirm('Quit Dyalog APL. Are you sure?',document.title,function(q){
          if(q) {
            D.shutdown=1
            D.send('Disconnect',{message:'User shutdown request'})
            close()
          }
        })
      }
      else{
        D.shutdown=1
        D.send('Disconnect',{message:'User shutdown request'})
        close()
      }
    },10)
  }
}

if(D.el)document.body.className+=D.mac?' platform-mac':D.win?' platform-windows':''

window.focused=true;window.onfocus=window.onblur=function(x){window.focused=x.type==='focus'}
//Implement access keys (Alt-X) using <u></u>.
//HTML's accesskey=X doesn't handle duplicates well -- it doesn't always favour a visible input over a hidden one.
//Also, browsers like Firefox and Opera use different shortcuts (such as Alt-Shift-X or Ctrl-X) for accesskey-s.
D.mac||CM.on(document,'keydown',function(e){ // Alt-A...Alt-Z or Alt-Shift-A...Alt-Shift-Z
  if(!e.altKey||e.ctrlKey||e.metaKey||e.which<65||e.which>90)return
  var c=String.fromCharCode(e.which).toLowerCase(),C=c.toUpperCase()
  var $ctx=$('.ui-widget-overlay').length?$('.ui-dialog:visible').last():$('body') //modal dialogs take priority
  var $a=$('u:visible',$ctx).map(function(){
    var h=this.innerHTML;if(h!==c&&h!==C)return
    var $i=$(this).closest(':input,label,a').eq(0)
    if($i.is('label'))$i=$('#'+$i.attr('for')).add($i.find(':input')).eq(0)
    return $i[0]
  })
  if($a.length>1){$a.eq(($a.index(':focus')+1)%$a.length).focus()}
  else if($a.is(':checkbox')){$a.focus().prop('checked',!$a.prop('checked')).change()}
  else if($a.is(':text,:password,textarea,select')){$a.focus()}
  else{$a.click()}
  return!$a.length
},true)
if(D.el){
  //drag and drop
  CM.defaults.dragDrop=0;window.ondragover=window.ondrop=function(e){e.preventDefault();return!1}
  window.ondrop=function(e){
    var a=e.dataTransfer.files,f=(a[0]||{}).path
    if(!D.lastSpawnedExe){$.err('Drag and drop of workspaces works only for locally started interpreters.')}
    else if(!/\.dws$/i.test(f)){$.err('RIDE supports drag and drop only for .dws files.')}
    else if(a.length!==1){$.err('RIDE does not support dropping of multiple files.')}
    else{$.confirm('Are you sure you want to )load '+f.replace(/^.*[\\\/]/,'')+'?','Load workspace',
                   function(x){x&&D.ide.exec(['      )load '+f+'\n'],0)})}
    e.preventDefault();return!1
  }

  //extra css and js
  var path=node_require('path'),env=process.env
  env.RIDE_JS&&env.RIDE_JS.split(path.delimiter)
                          .forEach(function(x){x&&$.getScript('file://'+path.resolve(process.cwd(),x))})
  env.RIDE_CSS&&$('<style>').text(env.RIDE_CSS.split(path.delimiter)
                                              .map(function(x){return'@import url("'+x+'");'})).appendTo('head')
}

}())
