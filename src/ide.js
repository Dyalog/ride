D.IDE=function(){'use strict'
  var ide=D.ide=this;I.cn.hidden=1;I.lb.insertAdjacentHTML('beforeend',D.lb.html);ide.dom=I.ide;I.ide.hidden=0
  ide.pending=[] //lines to execute: AtInputPrompt consumes one item from the queue, HadError empties it
  ide.exec=function(a,tc){if(a&&a.length){tc||(ide.pending=a.slice(1));D.send('Execute',{trace:tc,text:a[0]+'\n'})}}
  ide.host=ide.port=ide.wsid='';D.prf.title(ide.updTitle.bind(ide))
  D.wins=ide.wins={0:new D.Se(ide)}
  ide.focusedWin=ide.wins[0] //last focused window, it might not have the focus right now
  var handlers=this.handlers={ //for RIDE protocol messages
    Identify:function(x){D.remoteIdentification=x;ide.updTitle();ide.connected=1;ide.wins[0].updPW(1)},
    Disconnect:function(x){
      if(ide.dead)return
      ide.die();if(x.message==='Dyalog session has ended'){try{close()}catch(e){};D.el&&process.exit(0)}
      $.err(x.message,'Interpreter disconnected')
    },
    SysError:function(x){$.err(x.text,'SysError');ide.die()},
    InternalError:function(x){$.err('An error ('+x.error+') occurred processing '+x.message,'Internal Error')},
    NotificationMessage:function(x){$.alert(x.message,'Notification')},
    UpdateDisplayName:function(a){ide.wsid=a.displayName;ide.updTitle()},
    EchoInput:function(x){ide.wins[0].add(x.input)},
    SetPromptType:function(x){
      var t=x.type;t&&ide.pending.length?D.send('Execute',{trace:0,text:ide.pending.shift()+'\n'})
                                        :ide.wins[0].prompt(t)
      t===4&&ide.wins[0].focus() //⍞ input
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
      if(!ee['debugger']&&D.el&&process.env.RIDE_EDITOR){
        var fs=node_require('fs'),os=node_require('os'),cp=node_require('child_process')
        var d=os.tmpDir()+'/dyalog';fs.existsSync(d)||fs.mkdirSync(d,7*8*8) //rwx------
        var f=d+'/'+ee.name+'.dyalog';fs.writeFileSync(f,ee.text,{encoding:'utf8',mode:6*8*8}) //rw-------
        var p=cp.spawn(process.env.RIDE_EDITOR,[f],{env:$.extend({},process.env,{LINE:''+(1+(ee.currentRow||0))})})
        p.on('error',function(x){$.err(x)})
        p.on('exit',function(){
          var s=fs.readFileSync(f,'utf8');fs.unlinkSync(f)
          D.send('SaveChanges',{win:ee.token,text:s.split('\n'),stop:ee.stop,trace:ee.trace,monitor:ee.monitor})
          D.send('CloseWindow',{win:ee.token})
        })
        return
      }
      var w=ee.token, done, editorOpts={id:w,name:ee.name,tc:ee['debugger']}
      if(D.prf.floating()&&!D.floating&&!this.dead){
        var p=ee['debugger']?D.prf.posTracer():D.prf.posEditor()
        if(!p[4]){var d=ee.token-1;p[0]+=d*(process.env.RIDE_XOFFSET||32);p[1]+=d*(process.env.RIDE_YOFFSET||32)}
        var ph={x:p[0],y:p[1],width:p[2],height:p[3]}
        var url='ed.html?win='+w+'&x='+p[0]+'&y='+p[1]+'&width='+p[2]+
                '&height='+p[3]+'&maximized='+(p[4]||0)+'&token='+w+'&tracer='+(+!!ee['debugger'])
        if(D.open(url,$.extend({title:ee.name},ph))){
          this.block() //the popup will create D.wins[w] and unblock the message queue
          ;(D.pendingEditors=D.pendingEditors||{})[w]={editorOpts:editorOpts,ee:ee,ide:this};done=1
        }else{
          $.err('Popups are blocked.')
        }
      }
      if(done)return
      ;(this.wins[w]=new D.Ed(this,editorOpts)).open(ee)
      ide.gl.root.contentItems[0].addChild({type:'component',componentName:'win',componentState:{id:w},title:ee.name})
    },
    ShowHTML:function(x){
      if(D.el){
        var w=ide.w3500;if(!w||w.isDestroyed())w=ide.w3500=new D.el.BrowserWindow({width:800,height:500})
        w.loadURL(`file://${__dirname}/empty.html`)
        w.webContents.executeJavaScript('document.body.innerHTML='+JSON.stringify(x.html))
        w.setTitle(x.title||'3500 I-beam')
      }else{
        var init=function(){
          ide.w3500.document.body.innerHTML=x.html
          ide.w3500.document.getElementsByTagName('title')[0].innerHTML=D.util.esc(x.title||'3500⌶')
        }
        if(ide.w3500&&!ide.w3500.closed){ide.w3500.focus();init()}
        else{ide.w3500=open('empty.html','3500 I-beam','width=800,height=500');ide.w3500.onload=init}
      }
    },
    OptionsDialog:function(x){
      var text=typeof x.text==='string'?x.text:x.text.join('\n')
      if(D.el&&process.env.RIDE_NATIVE_DIALOGS){
        r=D.el.dialog.showMessageBox(D.elw,{message:text,title:x.title||'',buttons:x.options||[''],cancelId:-1})
        D.send('ReplyOptionsDialog',{index:r,token:x.token})
      }else{
        I.gd_title_text.textContent=x.title||'';I.gd_content.textContent=text
        I.gd_btns.innerHTML=(x.options||[]).map(function(y){return'<button>'+D.util.esc(y)+'</button>'}).join('')
        var ret=function(r){I.gd_btns.onclick=I.gd_close.onclick=null;I.gd.hidden=1
                            D.send('ReplyOptionsDialog',{index:r,token:x.token})}
        I.gd_close.onclick=function(){ret(-1)}
        I.gd_btns.onclick=function(e){if(e.target.nodeName==='BUTTON'){
                                        var i=0,t=e.target;while(t){t=t.previousSibling;i++}ret(i)}}
        D.util.dlg(I.gd,{w:400,h:300})
      }
    },
    StringDialog:function(x){
      I.gd_title_text.textContent=x.title||'';I.gd_content.innerText=x.text||''
      I.gd_content.insertAdjacentHTML('beforeend','<br><input>')
      var inp=I.gd_content.querySelector('input');inp.value=x.initialValue||''
      I.gd_btns.innerHTML='<button>OK</button><button>Cancel</button>'
      var ret=function(r){I.gd_btns.onclick=I.gd_close.onclick=null;I.gd.hidden=1
                          D.send('ReplyStringDialog',{value:r,token:x.token})}
      I.gd_close.onclick=function(){ret(x.defaultValue||null)}
      I.gd_btns.onclick=function(e){if(e.target.nodeName==='BUTTON'){
                                        ret(e.target.previousSibling?x.defaultValue||null:inp.value)}}
      D.util.dlg(I.gd,{w:400,h:300});setTimeout(function(){inp.focus()},1)
    },
    TaskDialog:function(x){
      var esc=D.util.esc
      I.gd_title_text.textContent=x.title||''
      I.gd_content.innerHTML=esc(x.text||'')+(x.subtext?'<div class=task_subtext>'+esc(x.subtext)+'</div>':'')
      I.gd_btns.innerHTML=
        (x.buttonText||[]).map(function(y){return'<button class=task>'+D.util.esc(y)+'</button>'}).join('')+
        (x.footer?'<div class=task_footer>'+esc(x.footer)+'</div>':'')
      var ret=function(r){I.gd_btns.onclick=I.gd_close.onclick=null;I.gd.hidden=1
                          D.send('ReplyTaskDialog',{index:r,token:x.token})}
      I.gd_close.onclick=function(){ret(-1)}
      I.gd_btns.onclick=function(e){if(e.target.nodeName==='BUTTON'){
                                      var t=e.target,i=-1;while(t){t=t.previousSibling;i++}ret(i)}}
      D.util.dlg(I.gd,{w:400,h:300})
    },
    ReplyTreeList:function(x){ide.wse.replyTreeList(x)},
    UnknownCommand:function(){}
  }
  //We need to be able to temporarily block the stream of messages coming from socket.io
  //Creating a floating window can only be done asynchronously and it's possible that a message
  //for it comes in before the window is ready.
  var mq=[],blk=0,tid=0,last=0 //mq:message queue, blk:blocked?, tid:timeout id, last:when last rundown finished
  function rd(){ //run down the queue
    while(mq.length&&!blk){
      var a=mq.shift() //a[0]:command name, a[1]:command args
      if(a[0]==='AppendSessionOutput'){ //special case: batch sequences of AppendSessionOutput together
        ide.wins[0].cm.operation(function(){
          var s=a[1].result,nq=Math.min(mq.length,64)
          for(var i=0;i<nq&&mq[i][0]==='AppendSessionOutput';i++){
            var r=mq[i][1].result;s+=typeof r==='string'?r:r.join('\n')
          }
          i&&mq.splice(0,i);ide.wins[0].add(s)
        })
      }else{
        var f=handlers[a[0]];f?f.apply(ide,a.slice(1)):D.send('UnknownCommand',{name:a[0]})
      }
    }
    last=+new Date;tid=0
  }
  function rrd(){tid||(new Date-last<20?(tid=setTimeout(rd,20)):rd())} //request rundown
  D.recv=function(x,y){mq.push([x,y]);rrd()}
  ide.block=function(){blk++}
  ide.unblock=function(){--blk||rrd()}

  //language bar
  var ttid //tooltip timeout id
  ,reqTip=function(x,desc,text,delay){ //request tooltip, x:event
    clearTimeout(ttid);var t=x.target
    ttid=setTimeout(function(){
      ttid=0;I.lb_tip_desc.textContent=desc;I.lb_tip_text.textContent=text;I.lb_tip.hidden=I.lb_tip_tri.hidden=0
      var s=I.lb_tip_tri.style
      s.left=(t.offsetLeft+(t.offsetWidth-I.lb_tip_tri.offsetWidth)/2)+'px';s.top=(t.offsetTop+t.offsetHeight)+'px'
      var s=I.lb_tip.style,x0=t.offsetLeft-21,x1=x0+I.lb_tip.offsetWidth,y0=t.offsetTop+t.offsetHeight-3
      s.top=y0+'px';if(x1>document.body.offsetWidth){s.left='';s.right='0'}else{s.left=Math.max(0,x0)+'px';s.right=''}
    },delay||20)
  }
  I.lb.onmousedown=function(x){
    if(x.target.nodeName==='B'){var w=ide.focusedWin,s=x.target.textContent
                                w.hasFocus()?w.insert(s):D.util.insert(document.activeElement,s)}
    return!1
  }
  I.lb.onmouseout=function(x){if(x.target.nodeName==='B'||x.target.id==='lb_prf'){
    clearTimeout(ttid);ttid=0;I.lb_tip.hidden=I.lb_tip_tri.hidden=1
  }}
  I.lb.onmouseover=function(x){if(x.target.nodeName==='B'){
    var c=x.target.textContent,k=D.getBQKeyFor(c),s=k&&c.charCodeAt(0)>127?'Keyboard: '+D.prf.prefixKey()+k+'\n\n':''
    var h=D.lb.tips[c]||[c,''];reqTip(x,h[0],s+h[1])
  }}
  I.lb_prf.onmouseover=function(x){
    var h=D.prf.keys(),s='',r=/^(BK|BT|ED|EP|FD|QT|RP|SC|TB|TC|TL)$/
    for(var i=0;i<D.cmds.length;i++){
      var cmd=D.cmds[i],c=cmd[0],d=cmd[1],df=cmd[2] //c:code,ds:description,df:defaults
      r.test(c)&&(s+=c+': '+d+':'+' '.repeat(Math.max(1,25-d.length))+((h[c]||df).slice(-1)[0]||'none')+'\n')
    }
    reqTip(x,'Keyboard Shortcuts',s+'...',1000)
  }
  I.lb_prf.onmousedown=function(){D.prf_ui();return!1}
  I.lb_prf.onclick=function(){return!1} //prevent # appearing in the URL bar

  var eachWin=function(f){for(var k in ide.wins){var w=ide.wins[k];w.cm&&f(w)}}
  ide.gl=new GoldenLayout({labels:{minimise:'unmaximise'},settings:{showPopoutIcon:0},
                           content:[{type:'row',content:[{type:'component',componentName:'win',
                                                          componentState:{id:0},title:'Session'}]}]},
                          $(ide.dom))
  ide.gl.registerComponent('win',function(c,h){var w=ide.wins[h.id];w.container=c;c.getElement().append(w.dom)
                                               setTimeout(function(){w.focus()},1);return w})
  ide.gl.registerComponent('wse',function(c,h){var u=ide.wse=new D.WSE();u.container=c
                                               c.getElement().append(u.dom);return u})
  var sctid //stateChanged timeout id
  ide.gl.on('stateChanged',function(){
    clearTimeout(sctid)
    sctid=setTimeout(function(){eachWin(function(w){w.updSize();w.cm.refresh();w.updGutters&&w.updGutters()})},50)
  })
  ide.gl.on('tabCreated',function(x){switch(x.contentItem.componentName){
    case'wse':x.closeElement.off('click').click(D.prf.wse.toggle);break
    case'win':var id=x.contentItem.config.componentState.id,cls=x.closeElement
              if(id){cls.off('click').click(function(){var w=ide.wins[id];w.EP(w.cm)})}
              else{cls.remove();x.titleElement[0].closest('.lm_tab').style.paddingRight='10px'}
              break
  }})
  ide.gl.on('stackCreated',function(x){x.header.controlsContainer.find('.lm_close').remove()})
  ide.gl.init()

  var updTopBtm=function(){ide.dom.style.top=((D.prf.lbar()?I.lb.offsetHeight:0)+(D.el?1:22))+'px'
                           ide.gl.updateSize(ide.dom.clientWidth,ide.dom.clientHeight)}
  I.lb.hidden=!D.prf.lbar();updTopBtm();$(window).resize(updTopBtm)
  D.prf.lbar(function(x){I.lb.hidden=!x;updTopBtm()})
  setTimeout(function(){try{D.installMenu(D.parseMenuDSL(D.prf.menu()))}
                        catch(e){$.err('Invalid menu configuration -- the default menu will be used instead')
                                 console.error(e);D.installMenu(D.parseMenuDSL(D.prf.menu.getDefault()))}},100)
  D.prf.autoCloseBrackets(function(x){eachWin(function(w){w.cm.setOption('autoCloseBrackets',!!x&&D.Ed.ACB_VALUE)})})
  D.prf.indent(function(x){eachWin(function(w){if(w.id){w.cm.setOption('smartIndent',x>=0);w.cm.setOption('indentUnit',x)}})})
  D.prf.fold(function(x){eachWin(function(w){if(w.id){w.cm.setOption('foldGutter',!!x);w.updGutters()}})})
  D.prf.matchBrackets(function(x){eachWin(function(w){w.cm.setOption('matchBrackets',!!x)})})
  var updWSE=function(){
    if(!D.prf.wse()){ide.gl.root.getComponentsByName('wse').forEach(function(x){x.container.close()});return}
    var p=ide.gl.root.contentItems[0]
    if(p.type!=='row'){var row=ide.gl.createContentItem({type:'row'},p);p.parent.replaceChild(p,row)
                       row.addChild(p,0,true);row.callDownwards('setSize');p=row}
    p.addChild({type:'component',componentName:'wse',title:'Workspace Explorer'},0)
  }
  D.prf.wse(updWSE);D.prf.wse()&&setTimeout(updWSE,500)
  D.mac&&setTimeout(function(){ide.wins[0].focus()},500) //OSX is stealing our focus.  Let's steal it back!  Bug #5
}
D.IDE.prototype={
  setHostAndPort:function(h,p){this.host=h;this.port=p;this.updTitle()},
  die:function(){ //don't really, just pretend
    if(this.dead)return
    this.dead=1;this.connected=0;this.dom.className+=' disconnected';for(var k in this.wins)this.wins[k].die()
  },
  updTitle:function(){ //change listener for D.prf.title
    var ide=this,ri=D.remoteIdentification||{},v=D.versionInfo
    document.title=D.prf.title().replace(/\{\w+\}/g,function(x){var X=x.toUpperCase();return(
      X==='{WSID}'?ide.wsid:                         X==='{PID}'?ri.pid:
      X==='{HOST}'?ide.host:                         X==='{CHARS}'?(ri.arch||'').split('/')[0]:
      X==='{PORT}'?ide.port:                         X==='{BITS}' ?(ri.arch||'').split('/')[1]:
      X==='{VER_A}'?(ri.version||'').split('.')[0]:  X==='{RIDE_VER_A}'?(v.version||'').split('.')[0]:
      X==='{VER_B}'?(ri.version||'').split('.')[1]:  X==='{RIDE_VER_B}'?(v.version||'').split('.')[1]:
      X==='{VER_C}'?(ri.version||'').split('.')[2]:  X==='{RIDE_VER_C}'?(v.version||'').split('.')[2]:
      X==='{VER}'?ri.version:                        X==='{RIDE_VER}'?v.version:
      x
    )||''})||'Dyalog'
  },
  focusMRUWin:function(){ //most recently used
    var t=0,w;for(var k in this.wins){var x=this.wins[k];if(x.id&&t<=x.focusTS){w=x;t=x.focusTS}}
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
  },
  _disconnected:function(){if(!this.dead){$.err('Interpreter disconnected');this.die()}} //invoked from cn.js
}
CM.commands.WSE=function(){D.prf.wse.toggle()}
CM.commands.ZM=function(){var w=D.ide.focusedWin;w.container.parent.toggleMaximise()
                          setTimeout(function(){w.cm&&w.cm.focus()},100)}
