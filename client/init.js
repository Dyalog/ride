'use strict'
var conn=require('./conn'),Editor=require('./editor').Editor,IDE=require('./ide').IDE,prefs=require('./prefs')
require('./prefs-colours');require('./demo');require('./cm-foldgutter') // require() these to initialise them
$(function(){
  CodeMirror.defaults.dragDrop=false;window.ondragover=window.ondrop=function(e){e.preventDefault();return!1}
  // don't use Alt- keystrokes on the Mac (see email from 2015-09-01)
  var h=CodeMirror.keyMap.emacsy;for(var k in h)if(/^alt-[a-z]$/i.test(k))delete h[k]
  if(D.nwjs){
    var zM=11 // zoom level can be between -zM and zM inclusive
    function ZMI(){prefs.zoom(Math.min( zM,prefs.zoom()+1));updatePW()}
    function ZMO(){prefs.zoom(Math.max(-zM,prefs.zoom()-1));updatePW()}
    function ZMR(){prefs.zoom(0);updatePW()}
    function updatePW(){D.ide&&D.ide.wins&&D.ide.wins[0]&&D.ide.wins[0].updatePW()}
    $.extend(CodeMirror.commands,{ZMI:ZMI,ZMO:ZMO,ZMR:ZMR})
    $(document).bind('mousewheel',function(e){
      var d=e.originalEvent.wheelDelta;d&&e.ctrlKey&&!e.shiftKey&&!e.altKey&&(d>0?ZMI:ZMO)()
    })
    $('body').addClass('zoom'+prefs.zoom())
    prefs.zoom(function(z){
      if(!D.ide)return
      var wins=D.ide.wins
      for (var x in wins){
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
  D.openExternal||(D.openExternal=function(x){open(x,'_blank')})
  D.setTitle||(D.setTitle=function(s){document.title=s})
  var urlParams={},ref=(location+'').replace(/^[^\?]*($|\?)/,'').split('&')
  for(var i=0;i<ref.length;i++){var m=/^([^=]*)=?(.*)$/.exec(ref[i]);urlParams[unescape(m[1]||'')]=unescape(m[2]||'')}
  var win=urlParams.win
  if(D.floating&&win){
    $('body').addClass('floating-window')
    $(window).resize(function(){ed&&ed.updateSize()})
    var pe=opener.D.pendingEditors[win], editorOpts=pe.editorOpts, ee=pe.ee, ide=pe.ide
    D.ide=opener.D.ide
    var ed=D.ide.wins[win]=new Editor(ide,$(document.body),editorOpts)
    ed.open(ee);ed.updateSize();D.setTitle(ed.name)
    window.onbeforeunload=function(){return ed.onbeforeunload()}
    setTimeout(function(){ed.refresh()},500) // work around a rendering issue on Ubuntu
    D.ide.unblock()
  }else{
    D.socket=(D.createSocket||function(){
      var skt=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host)
      var l={},q=[],io={} // l:listeners, q:send queue, io:socket.io-like API
      function flush(){while(skt.readyState===1&&q.length)skt.send(q.shift())}
      var io={
        emit:function(x,y){q.push(JSON.stringify([x,y]));flush();return this},
        on:function(e,f){(l[e]=l[e]||[]).push(f);return this},
        onevent:function(x){var a=l[x.data[0]]||[];for(var i=0;i<a.length;i++)a[i].apply(null,x.data.slice(1))}
      }
      skt.onopen=flush
      skt.onerror=function(e){console.info('ws error:',e)}
      skt.onmessage=function(m){io.onevent({data:JSON.parse(m.data)})}
      return io
    })()
    if(!D.quit)D.quit=close
    var e=D.process?D.process.env:{}
    if(e.DYALOG_IDE_LISTEN)conn().listen(e.DYALOG_IDE_LISTEN)
    else if(e.DYALOG_IDE_CONNECT)conn().connect(e.DYALOG_IDE_CONNECT)
    else if(+e.DYALOG_IDE_SPAWN){ // the value of this env var should be '0' or '1'
      new IDE;D.socket.emit('*spawn') // '*error' is handled in ide.coffee
      window.onbeforeunload=function(){D.socket.emit('Exit',{code:0})}
    }
    else conn()
  }

  if(!prefs.theme()){
    prefs.theme(D.mac||/^(darwin|mac|ipad|iphone|ipod)/i.test(navigator?navigator.platform:'')?'cupertino':
                D.win||/^win/.test(navigator?navigator.platform:'')?'redmond':'classic')
  }
  $('body').addClass('theme-'+prefs.theme())
  prefs.theme(function(x,old){$('body').removeClass('theme-'+old).addClass('theme-'+x);D.ide&&D.ide.layout.resizeAll()})

  D.nwjs&&$('body').addClass(D.mac?'platform-mac':D.win?'platform-windows':'')

  $(window).on('focus blur',function(e){$('body').toggleClass('window-focused',window.focused=e.type==='focus')})
  window.focused=true

  // Some library is doing "localStorage.debug=undefined" instead of "delete localStorage.debug".
  // It doesn't work that way.  It may work for other objects, but the values in localStorage
  // are always strings and that leaves us with 'undefined' as a string.  So, let's clean up...
  delete localStorage.debug

  localStorage.version||(localStorage.version='[2,0]') // for migrations to later versions of RIDE

  // Implement access keys (Alt-X) using a custom attribute: data-accesskey=X
  // The built-in accesskey=X doesn't handle duplicates well -- it doesn't always focus the visible one.
  $(document).keydown(function(e){
    if(e.altKey&&!e.ctrlKey&&!e.metaKey&&64<e.which&&e.which<91){ // Alt-A...Alt-Z or Alt-Shift-A...Alt-Shift-Z
      var $a=$('[data-accesskey='+String.fromCharCode(e.which).toLowerCase()+']:visible'), n=$a.length
      $a.eq(($a.index(':focus')+1)%$a.length).focus();n===1&&$a.click();return!1
    }
  })
})
