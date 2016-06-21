D.IDE=function(){'use strict'
  var ide=D.ide=this
  document.body.innerHTML=
    '<div class=ide></div>'+
    '<div class=lb style=display:none><a class=lb-prf href=#></a>'+D.lb.html+'</div>'+
    '<div class=lb-tip style=display:none><div class=lb-tip-desc></div><pre class=lb-tip-text></pre></div>'+
    '<div class=lb-tip-triangle style=display:none></div>'
  ide.$ide=$('.ide')
  ide.pending=[] // lines to execute: AtInputPrompt consumes one item from the queue, HadError empties it
  ide.exec=function(l,tc){ // l:lines, tc:trace
    if(l&&l.length){tc||(ide.pending=l.slice(1));ide.emit('Execute',{trace:tc,text:l[0]+'\n'})}
  }
  ide.host=ide.port=ide.wsid='';D.prf.title(ide.updTitle.bind(ide))
  D.wins=ide.wins={0:new D.Se(ide,{id:0,emit:ide.emit.bind(ide),exec:ide.exec.bind(ide)})}
  ide.focusedWin=ide.wins[0] // last focused window, it might not have the focus right now

  var handlers=this.handlers={ // for RIDE protocol messages
    '*connected':function(x){ide.setHostAndPort(x.host,x.port)},
    '*error':function(x){ide.die();setTimeout(function(){$.err(x.msg)},100)},
    '*spawnedExited':function(x){
      if(x.code){ide.die();setTimeout(function(){$.err('Interpreter process exited\nwith code '+x.code)},100)}
      if(D.el&&!x.code){process.exit(0)}
    },
    '*disconnected':function(){if(!ide.dead){$.err('Interpreter disconnected');ide.die()}},
    Identify:function(x){D.remoteIdentification=x;ide.updTitle();ide.connected=1;ide.wins[0].updPW(1)},
    Disconnect:function(x){
      if(ide.dead)return
      ide.die()
      if(x.message==='Dyalog session has ended'){try{close()}catch(e){};D.el&&process.exit(0)}
      else $.err(x.message,'Interpreter disconnected')
    },
    SysError:function(x){$.err(x.text,'SysError');ide.die()},
    InternalError:function(x){$.err('An error ('+x.error+') occurred processing '+x.message,'Internal Error')},
    NotificationMessage:function(x){$.alert(x.message,'Notification')},
    UpdateDisplayName:function(a){ide.wsid=a.displayName;ide.updTitle()},
    EchoInput:function(x){ide.wins[0].add(x.input)},
    AppendSessionOutput:function(x){var r=x.result;ide.wins[0].add(typeof r==='string'?r:r.join('\n'))},
    SetPromptType:function(x){
      var t=x.type;t&&ide.pending.length?ide.emit('Execute',{trace:0,text:ide.pending.shift()+'\n'}):ide.wins[0].prompt(t)
      t===4&&ide.wins[0].focus() // ⍞ input
    },
    HadError:function(){ide.pending.splice(0,ide.pending.length);ide.wins[0].focus()},
    GotoWindow:function(x){var w=ide.wins[x.win];w&&w.focus()},
    WindowTypeChanged:function(x){return ide.wins[x.win].setTracer(x.tracer)},
    ReplyGetAutocomplete:function(x){var w=ide.wins[x.token];w&&w.processAutocompleteReply(x)},
    ValueTip:function(x){ide.wins[x.token].vt.processReply(x)},
    SetHighlightLine:function(x){var w=ide.wins[x.win];w&&w.highlight(x.line)},
    UpdateWindow:function(x){var w=ide.wins[x.token];if(w){w.container&&w.container.setTitle(x.name);w.open(x)}},
    ReplySaveChanges:function(x){var w=ide.wins[x.win];w&&w.saved(x.err)},
    CloseWindow:function(x){
      var w=ide.wins[x.win];if(w){w.closePopup&&w.closePopup();w.vt.clear();w.container&&w.container.close()}
      delete ide.wins[x.win];ide.wins[0].focus()
    },
    OpenWindow:function(ee){
      if(!ee['debugger']&&D.openInExternalEditor){
        D.openInExternalEditor(ee,function(s){
          ide.emit('SaveChanges',{win:ee.token,text:s.split('\n'),stop:ee.stop,trace:ee.trace,monitor:ee.monitor})
          ide.emit('CloseWindow',{win:ee.token})
        })
        return
      }
      var w=ee.token, done, editorOpts={id:w,name:ee.name,tracer:ee['debugger'],emit:this.emit.bind(this)}
      if(D.prf.floating()&&!D.floating&&!this.dead){
        var p=ee['debugger']?D.prf.posTracer():D.prf.posEditor()
        if(!p[4]){var d=ee.token-1;p[0]+=d*(process.env.RIDE_XOFFSET||32);p[1]+=d*(process.env.RIDE_YOFFSET||32)}
        var ph={x:p[0],y:p[1],width:p[2],height:p[3]}
        var url='ed.html?win='+w+'&x='+p[0]+'&y='+p[1]+'&width='+p[2]+
                '&height='+p[3]+'&maximized='+(p[4]||0)+'&token='+w+'&tracer='+(+!!ee['debugger'])
        if(D.open(url,$.extend({title:ee.name},ph))){
          this.block() // the popup will create D.wins[w] and unblock the message queue
          ;(D.pendingEditors=D.pendingEditors||{})[w]={editorOpts:editorOpts,ee:ee,ide:this};done=1
        }else{
          $.err('Popups are blocked.')
        }
      }
      if(!done){
        var dir=ee['debugger']?'south':'east', size=ee['debugger']?D.prf.tracerHeight():D.prf.editorWidth()
        ;(this.wins[w]=new D.Ed(this,editorOpts)).open(ee)
        ide.gl.root.contentItems[0]
          .addChild({type:'component',componentName:'w',componentState:{id:ee.token},title:ee.name})
      }
    },
    ShowHTML:ide.showHTML.bind(ide),
    OptionsDialog:function(x){
      var text=typeof x.text==='string'?x.text:x.text.join('\n') // todo: clean up after transition to json protocol
      if(D.el){
        var i=D.el.dialog.showMessageBox(D.elw,{message:text,title:x.title||'',buttons:x.options,cancelId:-1})
        ide.emit('ReplyOptionsDialog',{index:i,token:x.token})
      }else{
        var i=-1;var f=function(e){i=$(e.target).closest('.ui-button').index();$(this).dialog('close')} // i:clicked index
        $('<p>').text(text).dialog({modal:1,title:x.title,buttons:x.options.map(function(s){return{text:s,click:f}}),
                                    close:function(){ide.emit('ReplyOptionsDialog',{index:i,token:x.token})}})
      }
    },
    StringDialog:function(x){
      var ok,$i=$('<input>').val(x.initialValue||'')
      $('<p>').text(x.text||'').append('<br>').append($i).dialog({
        modal:1,title:x.title,buttons:[
          {html:'<u>O</u>K'    ,click:function(){ok=1;$(this).dialog('close')}},
          {html:'<u>C</u>ancel',click:function(){     $(this).dialog('close')}}
        ],
        close:function(){ide.emit('ReplyStringDialog',{value:ok?$i.val():x.defaultValue||null,token:x.token})}
      })
    },
    TaskDialog:function(x){
      var esc=D.util.esc, i=-1 // i:the result
      var $d=$('<div class=task-dialog><p>'+esc(x.text||'')+'<p class=subtext>'+esc(x.subtext||'')+'<div>'+
                 x.buttonText.map(function(s){return'<button class=task>'+esc(s)+'</button>'}).join('')+
               '</div><p class=footer>'+esc(x.footer||'')+'</div>')
      $d.on('click','.task',function(e){i=100+$(e.target).index();$d.dialog('close')})
        .dialog({modal:1,title:x.title,close:function(){ide.emit('ReplyTaskDialog',{index:i,token:x.token})},
                 buttons:x.options.map(function(s){return{text:s,click:function(e){
                   i=$(e.target).closest('.ui-button').index();$d.dialog('close')
                 }}})})
    },
    ReplyTreeList:function(x){ide.wse.replyTreeList(x)},
    UnknownRIDECommand:function(){}, // todo
    UnknownCommand:function(){}
  }
  // We need to be able to temporarily block the stream of messages coming from socket.io
  // Creating a floating window can only be done asynchronously and it's possible that a message
  // for it comes in before the window is ready.
  var mq=[],blk=0,tid=0,last=0 // mq:message queue, blk:blocked?, tid:timeout id, last:when last rundown finished
  function rd(){ // run down the queue
    ide.wins[0].cm.operation(function(){
      while(mq.length&&!blk){
        var a=mq.shift(),f=handlers[a[0]];f?f.apply(ide,a.slice(1)):ide.emit('UnknownCommand',{name:a[0]})
      }
      last=+new Date;tid=0
    })
  }
  function rrd(){tid||(new Date-last<20?(tid=setTimeout(rd,20)):rd())} // request rundown
  D.skt.recv=function(x,y){mq.push([x,y]);rrd()}
  ide.block=function(){blk++}
  ide.unblock=function(){--blk||rrd()}

  // language bar
  $('.lb-prf').click(function(){D.prf_ui('layout')})
  var $tip=$('.lb-tip'),$tipDesc=$('.lb-tip-desc'),$tipText=$('.lb-tip-text'),$tipTriangle=$('.lb-tip-triangle')
  var ttid=null // tooltip timeout id
  function requestTooltip(e,desc,text){ // e:element
    clearTimeout(ttid);var $t=$(e.target),p=$t.position()
    ttid=setTimeout(function(){
      ttid=null;$tipDesc.text(desc);$tipText.text(text)
      $tipTriangle.css({left:3+p.left+($t.width()-$tipTriangle.width())/2,top:p.top+$t.height()+3}).show()
      var x0=p.left-21,x1=x0+$tip.width(),y0=p.top+$t.height()
      $tip.css(x1>$(document).width()?{left:'',right:0,top:y0}:{left:Math.max(0,x0),right:'',top:y0}).show()
    },200)
  }
  $('.lb')
    .on('mousedown',function(){return!1})
    .on('mousedown','b',function(e){var c=$(this).text(),w=ide.focusedWin;(w.hasFocus()?w:$(':focus')).insert(c);return!1})
    .on('mouseout','b,.lb-prf',function(){clearTimeout(ttid);ttid=null;$tip.add($tipTriangle).hide()})
    .on('mouseover','b',function(e){
      var c=$(this).text(),k=D.getBQKeyFor(c),s=k&&c.charCodeAt(0)>127?'Keyboard: '+D.prf.prefixKey()+k+'\n\n':''
      var h=D.lb.tips[c]||[c,''];requestTooltip(e,h[0],s+h[1])
    })
    .on('mouseover','.lb-prf',function(e){
      var h=D.prf.keys(),s=''
      for(var i=0;i<D.cmds.length;i++){
        var cmd=D.cmds[i],code=cmd[0],desc=cmd[1],defaults=cmd[2]
        if(/^(BK|BT|ED|EP|FD|QT|RP|SC|TB|TC|TL)$/.test(code)){
          var pad=Array(Math.max(0,25-desc.length)).join(' '),ks=h[code]||defaults
          s+=code+':'+desc+':'+pad+' '+(ks[ks.length-1]||'none')+'\n'
        }
      }
      requestTooltip(e,'Keyboard Shortcuts',s+'...')
    })

  var eachWin=function(f){for(var k in ide.wins){var w=ide.wins[k];w.cm&&f(w)}}
  ide.gl=new GoldenLayout({labels:{minimise:'unmaximise'},
                           content:[{type:'row',content:[{type:'component',componentName:'w',
                                                          componentState:{id:0},title:'Session'}]}]},
                          ide.$ide)
  ide.gl.registerComponent('w',function(c,h){var w=ide.wins[h.id];w.container=c;c.getElement().append(w.$e);return w})
  ide.gl.registerComponent('wse',function(c,h){
    var u=ide.wse||(ide.wse=new D.WSE(ide));u.container=c;c.getElement().append(u.$e);return u})
  ide.gl.on('stateChanged',function(){eachWin(function(w){w.updSize();w.cm.refresh();w.updGutters&&w.updGutters()})})
  ide.gl.on('tabCreated',function(x){if(x.contentItem.componentName==='w'){
    var id=x.contentItem.config.componentState.id
    id?x.closeElement.off('click').click(function(){var w=ide.wins[id];w.EP(w.cm)})
      :x.closeElement.remove()
  }})
  ide.gl.on('stackCreated',function(x){x.header.controlsContainer.find('.lm_close').remove()})
  ide.gl.init()

  var updTopBtm=function(){ide.$ide.css({top:(D.prf.lbar()?$('.lb').height():0)+(D.el?1:22)})
                           ide.gl.updateSize(ide.$ide.width(),ide.$ide.height())}
  $('.lb').toggle(!!D.prf.lbar());updTopBtm();$(window).resize(updTopBtm)
  D.prf.lbar(function(x){$('.lb').toggle(!!x);updTopBtm()})
  setTimeout(function(){
    try{D.installMenu(D.parseMenuDSL(D.prf.menu()))}
    catch(e){$.err('Invalid menu configuration -- the default menu will be used instead')
             console.error(e);D.installMenu(D.parseMenuDSL(D.prf.menu.getDefault()))}
  },100)
  D.prf.autoCloseBrackets(function(x){eachWin(function(w){w.cm.setOption('autoCloseBrackets',!!x&&D.Ed.ACB_VALUE)})})
  D.prf.indent(function(x){eachWin(function(w){if(w.id){w.cm.setOption('smartIndent',x>=0);w.cm.setOption('indentUnit',x)}})})
  D.prf.fold(function(x){eachWin(function(w){if(w.id){w.cm.setOption('foldGutter',!!x);w.updGutters()}})})
  D.prf.matchBrackets(function(x){eachWin(function(w){w.cm.setOption('matchBrackets',!!x)})})
  var updWSE=function(){
    D.prf.wse()
      ?ide.gl.root.contentItems[0].addChild({type:'component',componentName:'wse',title:'Workspace Explorer'})
      :ide.gl.root.getComponentsByName('wse').forEach(function(x){x.container.close()})
  }
  D.prf.wse(updWSE);D.prf.wse()&&setTimeout(updWSE,500)
  D.mac&&setTimeout(function(){ide.wins[0].focus()},500) // OSX is stealing our focus.  Let's steal it back!  Bug #5
}
D.IDE.prototype={
  setHostAndPort:function(h,p){this.host=h;this.port=p;this.updTitle()},
  emit:function(x,y){this.dead||D.skt.emit(x,y)},
  die:function(){ // don't really, just pretend
    if(this.dead)return
    this.dead=1;this.connected=0;this.$ide.addClass('disconnected');for(var k in this.wins)this.wins[k].die()
  },
  updTitle:function(){ // change listener for D.prf.title
    var ide=this,ri=D.remoteIdentification||{},v=D.versionInfo
    document.title=D.prf.title().replace(/\{\w+\}/g,function(x){var X=x.toUpperCase();return(
      X==='{WSID}'?ide.wsid:
      X==='{HOST}'?ide.host:
      X==='{PORT}'?ide.port:
      X==='{PID}'?ri.pid:
      X==='{CHARS}'?(ri.arch||'').split('/')[0]:
      X==='{BITS}' ?(ri.arch||'').split('/')[1]:
      X==='{VER_A}'?(ri.version||'').split('.')[0]:
      X==='{VER_B}'?(ri.version||'').split('.')[1]:
      X==='{VER_C}'?(ri.version||'').split('.')[2]:
      X==='{VER}'?ri.version:
      X==='{RIDE_VER_A}'?(v.version||'').split('.')[0]:
      X==='{RIDE_VER_B}'?(v.version||'').split('.')[1]:
      X==='{RIDE_VER_C}'?(v.version||'').split('.')[2]:
      X==='{RIDE_VER}'?v.version:
      x
    )||''})||'Dyalog'
  },
  showHTML:function(x){
    var ide=this
    var init=function(){
      ide.w3500.document.body.innerHTML=x.html
      ide.w3500.document.getElementsByTagName('title')[0].innerHTML=D.util.esc(x.title||'3500⌶')
    }
    if(ide.w3500&&!ide.w3500.closed){ide.w3500.focus();init()}
    else{ide.w3500=open('empty.html','3500 I-beam','width=800,height=500');ide.w3500.onload=init}
  },
  focusMRUWin:function(){ // most recently used
    var t=0,w;for(var k in this.wins){var x=this.wins[k];if(x.id&&t<=x.focusTimestamp){w=x;t=x.focusTimestamp}}
    w&&w.focus()
  },
  LBR:D.prf.lbar      .toggle,
  FLT:D.prf.floating  .toggle,
  WRP:D.prf.wrap      .toggle,
  TOP:D.prf.floatOnTop.toggle,
  THM:function(){},
  UND:function(){this.focusedWin.cm.undo()},
  RDO:function(){this.focusedWin.cm.redo()},
  getUnsaved:function(){
    var r={};for(var k in this.wins){var cm=this.wins[k].cm,v=cm.getValue();if(+k&&v!==cm.oText)r[k]=v}
    return r
  }
}
CodeMirror.commands.WSE=function(){D.prf.wse.toggle()}
