;(function(){'use strict'

if(typeof node_require!=='undefined')D=$.extend(D,node_require('electron').remote.getGlobal('D'))

var CM=CodeMirror,env=D.el?process.env:{}

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
      var $b=$('body',wins[x].getDocument())
      $b.prop('class','zoom'+z+' '+$b.prop('class').split(/\s+/).filter(function(s){return!/^zoom-?\d+$/.test(s)}).join(' '))
      wins[x].refresh()
    }
    wins[0].scrollCursorIntoView()
  })
}

D.open=D.open||function(url,o){
  var x=o.x,y=o.y,width=o.width,height=o.height,spec='resizable=1'
  if(width!=null&&height!=null)spec+=',width='+width+',height='+height
  if(x!=null&&y!=null)spec+=',left='+x+',top='+y+',screenX='+x+',screenY='+y
  return!!open(url,'_blank',spec)
}
D.openExternal=D.el?D.el.shell.openExternal:function(x){open(x,'_blank')}
var urlParams={},ref=(location+'').replace(/^[^\?]*($|\?)/,'').split('&')
for(var i=0;i<ref.length;i++){var m=/^([^=]*)=?(.*)$/.exec(ref[i]);urlParams[unescape(m[1]||'')]=unescape(m[2]||'')}
var win=urlParams.win
if(D.floating&&win){
  $('body').addClass('floating-window')
  $(window).resize(function(){ed&&ed.updSize()})
  var pe=opener.D.pendingEditors[win], editorOpts=pe.editorOpts, ee=pe.ee, ide=pe.ide
  D.ide=opener.D.ide
  var ed=D.ide.wins[win]=new D.Ed(ide,$(document.body),editorOpts)
  ed.open(ee);ed.updSize();document.title=ed.name
  window.onbeforeunload=function(){return ed.onbeforeunload()}
  setTimeout(function(){ed.refresh()},500) //work around a rendering issue on Ubuntu
  D.ide.unblock()
}else{
  if(D.el){
    node_require(__dirname+'/src/cn')()
  }else{
    var ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host)
    var q=[],flush=function(){while(ws.readyState===1&&q.length)ws.send(q.shift())} //q:send queue
    D.skt={emit:function(x,y){q.push(JSON.stringify([x,y]));flush()}}
    ws.onopen=function(){ws.send('SupportedProtocols=2')
                         ws.send('UsingProtocol=2')
                         ws.send('["Identify",{"identity":1}]')
                         ws.send('["Connect",{"remoteId":2}]')
                         ws.send('["GetWindowLayout",{}]')}
    ws.onmessage=function(x){if(x.data[0]==='['){var[c,h]=JSON.parse(x.data);D.skt.recv(c,h)}}
    ws.onerror=function(x){console.info('ws error:',x)}
    new D.IDE
  }
  if(!D.quit)D.quit=close
}

if(!D.prf.theme()){
  D.prf.theme(D.mac||/^(darwin|mac|ipad|iphone|ipod)/i.test(navigator?navigator.platform:'')?'cupertino':
              D.win||/^win/.test(navigator?navigator.platform:'')?'redmond':'classic')
}
var updThm=function(){document.getElementById('thm').innerHTML='@import url(_/thm/'+D.prf.theme()+'.css);'}
updThm();D.prf.theme(updThm)

if(D.el)document.body.className+=D.mac?' platform-mac':D.win?' platform-windows':''

$(window).on('focus blur',function(e){window.focused=e.type==='focus'})
window.focused=true

// migrations
var db=D.db||localStorage
db.version=db.version||'[3,0]' // localStorage.version defaults to current version
var v=JSON.parse(db.version)
if(v[0]<3&&db.favs){
  try{db.favs=JSON.strigify(JSON.parse(db.favs).map(function(x){x.type='connect';x.port===4502&&delete x.port}))}
  catch(_){delete db.favs}
  db.version='[3,0]'
}

//Implement access keys (Alt-X) using <u></u>.
//HTML's accesskey=X doesn't handle duplicates well -- it doesn't always favour a visible input over a hidden one.
//Also, browsers like Firefox and Opera use different shortcuts (such as Alt-Shift-X or Ctrl-X) for accesskey-s.
D.mac||$(document).keydown(function(e){ // Alt-A...Alt-Z or Alt-Shift-A...Alt-Shift-Z
  if(!e.altKey||e.ctrlKey||e.metaKey||e.which<65||e.which>90)return
  var c=String.fromCharCode(e.which).toLowerCase(),C=c.toUpperCase()
  var $ctx=$('.ui-widget-overlay').length?$('.ui-dialog:visible').last():$('body') // modal dialogs take priority
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
})

if(D.el){
  //context menu
  let cmenu=D.el.Menu.buildFromTemplate(
    ['Cut','Copy','Paste'].map(function(x){return{label:x,role:x.toLowerCase()}})
    .concat({type:'separator'})
    .concat(['Undo','Redo'].map(function(x){return{label:x,click:function(){
      let u=D.ide;u&&(u=u.focusedWin)&&(u=u.cm)&&u[x.toLowerCase()]&&u[x.toLowerCase()]()}}})))
  window.oncontextmenu=function(e){e.preventDefault();cmenu.popup(D.elw)}

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
  var path=node_require('path')
  env.RIDE_JS&&env.RIDE_JS.split(path.delimiter)
                          .forEach(function(x){x&&$.getScript('file://'+path.resolve(process.cwd(),x))})
  env.RIDE_CSS&&$('<style>').text(env.RIDE_CSS.split(path.delimiter)
                                              .map(function(x){return'@import url("'+x+'");'})).appendTo('head')
}

}())
