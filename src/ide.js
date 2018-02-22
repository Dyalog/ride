// represents the main screen of a connected RIDE
// holds refs to the session (.win[0]), editors/tracers (.win[i])
// and an instance of the workspace explorer (.wse) defined in wse.js
// manages the language bar, its tooltips, and the insertion of characters
// processes incoming RIDE protocol messages
D.IDE = function () {'use strict'
  var ide=D.ide=this;I.cn.hidden=1;this.lbarRecreate();
  ide.zoom2fs = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    16, 17, 18, 19, 20, 22, 24, 26, 28, 32, 36, 42, 48];

  ide.dom=I.ide;I.ide.hidden=0
  ide.pending=[] //lines to execute: AtInputPrompt consumes one item from the queue, HadError empties it
  ide.exec=function(a,tc){if(a&&a.length){
    tc||(ide.pending=a.slice(1));
    D.send('Execute',{trace:tc,text:a[0]+'\n'});
    ide.getThreads();ide.getSIS();
  }}
  ide.host=ide.port=ide.wsid='';D.prf.title(ide.updTitle.bind(ide))
  D.wins=ide.wins={0:new D.Se(ide)}
  // ide.wins[0].me.setModel(monaco.editor.createModel('', 'apl-session'));

  ide.focusedWin=ide.wins[0] //last focused window, it might not have the focus right now
  ide.switchWin=function(x){ //x: +1 or -1
    let a=[],i=-1,j,wins=D.ide.wins,w;
    for(var k in wins){wins[k].hasFocus()&&(i=a.length);a.push(wins[k])}
    j=i<0?0:(i+a.length+x)%a.length;w=a[j];
    if(!w.bw_id)D.elw.focus();
    w.focus();return!1
  }

  ide.handlers = { // for RIDE protocol messages
    Identify(x) {
      D.remoteIdentification = x;
      ide.updTitle();
      ide.connected = 1;
      ide.wins[0].updPW(1);
      clearTimeout(D.tmr);
      delete D.tmr;
    },
    Disconnect(x) {
      const m = x.message.toLowerCase(); ide.die();
      if (m === 'dyalog session has ended') {
        ide.connected = 0; window.close();
      } else { $.err(x.message, 'Interpreter disconnected'); }
    },
    SysError(x) { $.err(x.text, 'SysError'); ide.die(); },
    InternalError(x) { $.err(`An error (${x.error}) occurred processing ${x.message}`, 'Internal Error'); },
    NotificationMessage(x) { $.alert(x.message, 'Notification'); },
    UpdateDisplayName(x) {
      ide.wsid = x.displayName; ide.updTitle(); ide.wse && ide.wse.refresh();
    },
    EchoInput(x) { ide.wins[0].add(x.input); },
    SetPromptType(x) {
      const t = x.type;
      if (t && ide.pending.length) D.send('Execute', { trace: 0, text: `${ide.pending.shift()}\n` });
      else eachWin((w) => { w.prompt(t); });
      t === 4 && ide.wins[0].focus(); // ⍞ input
      if (t === 1 && ide.bannerDone === 0) {
        // arrange for the banner to appear at the top of the session window
        ide.bannerDone = 1;
        const { me } = ide.wins[0];
        const txt = me.getValue().split('\n');
        let i = txt.length;
        while (--i) { if (/^Dyalog APL/.test(txt[i])) break; }
        me.revealRangeAtTop(new monaco.Range(i + 1, 1, i + 1, 1));
      }
    },
    HadError() { ide.pending.splice(0, ide.pending.length); ide.wins[0].focus(); ide.hadErr = 1; },
    GotoWindow(x) { const w = ide.wins[x.win]; w && w.focus(); },
    WindowTypeChanged(x) { return ide.wins[x.win].setTC(x.tracer); },
    ReplyGetAutocomplete(x) { const w = ide.wins[x.token]; w && w.processAutocompleteReply(x); },
    ValueTip(x) { ide.wins[x.token].ValueTip(x); },
    SetHighlightLine(x) { D.wins[x.win].SetHighlightLine(x.line); },
    UpdateWindow(x) {
      const w = ide.wins[x.token];
      if (w) {
        w.container && w.container.setTitle(x.name);
        w.open(x);
      }
    },
    ReplySaveChanges(x) { const w = ide.wins[x.win]; w && w.saved(x.err); },
    CloseWindow(x) {
      const w = ide.wins[x.win];
      if (w.bw_id) {
        w.id = -1; w.close();
      } else if (w) {
        w.container && w.container.close();
      }
      delete ide.wins[x.win]; ide.focusMRUWin();
      ide.WSEwidth = ide.wsew; ide.DBGwidth = ide.dbgw;
      if (w.tc) { ide.getSIS(); ide.getThreads(); }
    },
    OpenWindow(ee) {
      if (!ee.debugger && D.el && process.env.RIDE_EDITOR) {
        const fs = node_require('fs');
        const os = node_require('os');
        const cp = node_require('child_process');
        const d = `${os.tmpDir()}/dyalog`;
        fs.existsSync(d) || fs.mkdirSync(d, 7 * 8 * 8); // rwx------
        const f = `${d}/${ee.name}.dyalog`;
        fs.writeFileSync(f, ee.text, { encoding: 'utf8', mode: 6 * 8 * 8 }); // rw-------
        const p = cp.spawn(
          process.env.RIDE_EDITOR,
          [f],
          { env: $.extend({}, process.env, { LINE: `${1 + (ee.currentRow || 0)}` }) },
        );
        p.on('error', (x) => { $.err(x); });
        p.on('exit', () => {
          const s = fs.readFileSync(f, 'utf8'); fs.unlinkSync(f);
          D.send('SaveChanges', {
            win: ee.token,
            text: s.split('\n'),
            stop: ee.stop,
            trace: ee.trace,
            monitor: ee.monitor,
          });
          D.send('CloseWindow', { win: ee.token });
        });
        return;
      }
      const w = ee.token;
      let done;
      const editorOpts = { id: w, name: ee.name, tc: ee.debugger };
      ide.hadErr = ide.hadErr && editorOpts.tc;
      if (D.el && D.prf.floating() && !ide.dead) {
        ide.block(); // the popup will create D.wins[w] and unblock the message queue
        D.IPC_LinkEditor({ editorOpts, ee });
        done = 1;
      } else if (D.elw && !D.elw.isFocused()) D.elw.focus();
      if (done) return;
      // (ide.wins[w]=new D.Ed(ide,editorOpts)).open(ee)
      const ed = new D.Ed(ide, editorOpts);
      ide.wins[w] = ed;
      ed.me_ready.then(() => ed.open(ee));
      // add to golden layout:
      const si = ide.wins[0].cm.getScrollInfo(); // remember session scroll position
      const tc = !!ee.debugger;
      const bro = gl.root.getComponentsByName('win').filter(x => x.id && tc === !!x.tc)[0]; // existing editor
      let p;
      if (bro) { // add next to existing editor
        p = bro.container.parent.parent;
      } else { // add to the right
        [p] = gl.root.contentItems;
        const t0 = tc ? 'column' : 'row';
        if (p.type !== t0) {
          const q = gl.createContentItem({ type: t0 }, p);
          p.parent.replaceChild(p, q);
          q.addChild(p); q.callDownwards('setSize'); p = q;
        }
      }
      const ind = p.contentItems.length - !(editorOpts.tc || !!bro || !D.prf.dbg());
      p.addChild({
        type: 'component',
        componentName: 'win',
        componentState: { id: w },
        title: ee.name,
      }, ind);
      ide.WSEwidth = ide.wsew; ide.DBGwidth = ide.dbgw;
      if (tc) {
        ide.getSIS();
        ide.wins[0].scrollCursorIntoView();
      } else ide.wins[0].cm.scrollTo(si.left, si.top);
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
        var r=D.el.dialog.showMessageBox(D.elw,{message:text,title:x.title||'',buttons:x.options||[''],cancelId:-1})
        D.send('ReplyOptionsDialog',{index:r,token:x.token})
      }else{
        text=text.replace(/\r?\n/g,'<br>')
        I.gd_title_text.textContent=x.title||'';I.gd_content.innerHTML=text
        I.gd_icon.style.display=''
        I.gd_icon.className='dlg_icon_'+['warn','info','query','error'][x.type-1]
        I.gd_btns.innerHTML=(x.options||[]).map(function(y){return'<button>'+D.util.esc(y)+'</button>'}).join('')
        var b=I.gd_btns.querySelector('button');
        var ret=function(r){I.gd_btns.onclick=I.gd_close.onclick=null;I.gd.hidden=1
                            D.send('ReplyOptionsDialog',{index:r,token:x.token})
                            D.ide.focusedWin.focus();
                          }
        I.gd_close.onclick=function(){ret(-1)}
        I.gd_btns.onclick=function(e){if(e.target.nodeName==='BUTTON'){
                                      var i=-1,t=e.target;while(t){t=t.previousSibling;i++}ret(i)}}
        D.util.dlg(I.gd,{w:400});setTimeout(function(){b.focus()},1)
      }
    },
    StringDialog:function(x){
      I.gd_title_text.textContent=x.title||'';I.gd_content.innerText=x.text||''
      I.gd_icon.style.display='none'
      I.gd_content.insertAdjacentHTML('beforeend','<br><input>')
      var inp=I.gd_content.querySelector('input');inp.value=x.initialValue||''
      I.gd_btns.innerHTML='<button>OK</button><button>Cancel</button>'
      var ret=function(r){I.gd_btns.onclick=I.gd_close.onclick=null;I.gd.hidden=1
                          D.send('ReplyStringDialog',{value:r,token:x.token})
                          D.ide.focusedWin.focus();
                        }
      I.gd_close.onclick=function(){ret(x.defaultValue||null)}
      I.gd_btns.onclick=function(e){if(e.target.nodeName==='BUTTON'){
                                        ret(e.target.previousSibling?x.defaultValue||null:inp.value)}}
      D.util.dlg(I.gd,{w:400,h:250});setTimeout(function(){inp.focus()},1)
    },
    TaskDialog:function(x){
      var esc=D.util.esc
      I.gd_title_text.textContent=x.title||''
      I.gd_icon.style.display='none'
      I.gd_content.innerHTML=esc(x.text||'')+(x.subtext?'<div class=task_subtext>'+esc(x.subtext)+'</div>':'')
      I.gd_btns.innerHTML=
        (x.buttonText||[]).map(function(y){return'<button class=task>'+D.util.esc(y)+'</button>'}).join('')+
        (x.footer?'<div class=task_footer>'+esc(x.footer)+'</div>':'')
      var ret=function(r){I.gd_btns.onclick=I.gd_close.onclick=null;I.gd.hidden=1
                          D.send('ReplyTaskDialog',{index:r,token:x.token});
                          D.ide.focusedWin.focus();
                        }
      var b=I.gd_btns.querySelector('button');
      I.gd_close.onclick=function(){ret(-1)}
      I.gd_btns.onclick=function(e){if(e.target.nodeName==='BUTTON'){
                                      var t=e.target,i=99;while(t){t=t.previousSibling;i++}ret(i)}}
      D.util.dlg(I.gd,{w:400,h:300});setTimeout(function(){b.focus()},1)
    },
    ReplyGetSIStack:function(x){ide.dbg&&ide.dbg.sistack.render(x.stack)},
    ReplyGetThreads:function(x){ide.dbg&&ide.dbg.threads.render(x.threads)},
    ReplyFormatCode:function(x){D.wins[x.win].ReplyFormatCode(x.text)},
    ReplyTreeList:function(x){ide.wse.replyTreeList(x)},
    StatusOutput:function(x){
      var w=ide.wStatus;if(!D.el)return
      if(!w){w=ide.wStatus=new D.el.BrowserWindow({width:600,height:400,parent:D.elw})
             w.setTitle('Status Output');w.loadURL('file://'+__dirname+'/status.html')
             w.on('closed',function(){delete ide.wStatus})}
      w.webContents.executeJavaScript('add('+JSON.stringify(x)+')')
    },
    ReplyGetLog:function(x){ide.wins[0].add(x.result.join('\n'));ide.bannerDone=0},
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
          var s=a[1].result,nq=Math.min(mq.length,256);
          if (typeof s==='object'){s=s.join('\n');ide.bannerDone=0}
          for(var i=0;i<nq&&mq[i][0]==='AppendSessionOutput';i++){
            var r=mq[i][1].result;s+=typeof r==='string'?r:r.join('\n')
          }
          i&&mq.splice(0,i);ide.wins[0].add(s)
        })
      }else{
        var f=ide.handlers[a[0]];
        f?f.apply(ide,a.slice(1)):D.send('UnknownCommand',{name:a[0]})
      }
    }
    last=+new Date;tid=0
  }
  function rrd(){tid||(new Date-last<20?(tid=setTimeout(rd,20)):rd())} //request rundown
  D.recv=function(x,y){mq.push([x,y]);rrd()}
  ide.block=function(){blk++}
  ide.unblock=function(){--blk||rrd()}
  ide.tracer=function(){var tc;for(var k in ide.wins){var w=ide.wins[k];if(w.tc){tc=w;break}};return tc}
  var prop_objs=[{comp_name:"wse",prop_name:"WSEwidth"},{comp_name:"dbg",prop_name:"DBGwidth"}]
  prop_objs.map(function(obj){
    Object.defineProperty(ide, obj.prop_name, {
      get:function() {
        var comp=this.gl.root.getComponentsByName(obj.comp_name)[0];
        return comp&&comp.container&&comp.container.width},
      set:function(w){
         var comp=this.gl.root.getComponentsByName(obj.comp_name)[0];
         comp&&comp.container&&comp.container.setSize(w)}
    })
  })

  //language bar
  var ttid //tooltip timeout id
  ,lbDragged
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
  I.lb.onclick=function(x){
    var s=x.target.textContent;if(lbDragged||x.target.nodeName!=='B'||/\s/.test(s))return!1
    // if(D.floating){
      var t=0,wins=ide.wins,w=wins[0],now=new Date;
      for(var k in wins){var x=wins[k];if((500<now-x.focusTS)&&t<=x.focusTS){w=x;t=x.focusTS}}
      w.insert(s);
      w.id&&w.focus();
    // } else {
    //   var w=ide.focusedWin;w.hasFocus()?w.insert(s):D.util.insert(document.activeElement,s);
    // }
    return!1;
  }
  I.lb.onmouseout=function(x){if(x.target.nodeName==='B'||x.target.id==='lb_prf'){
    clearTimeout(ttid);ttid=0;I.lb_tip.hidden=I.lb_tip_tri.hidden=1
  }}
  I.lb.onmouseover=function(x){
    if(lbDragged||x.target.nodeName!=='B')return
    var c=x.target.textContent,k=D.getBQKeyFor(c),s=k&&c.charCodeAt(0)>127?'Keyboard: '+D.prf.prefixKey()+k+'\n\n':''
    if(/\S/.test(c)){var h=D.lb.tips[c]||[c,''];reqTip(x,h[0],s+h[1])}
  }
  I.lb_prf.onmouseover=function(x){
    var h=D.prf.keys(),s='',r=/^(BK|BT|ED|EP|FD|QT|RP|SC|TB|TC|TL)$/
    for(var i=0;i<D.cmds.length;i++){
      var cmd=D.cmds[i],c=cmd[0],d=cmd[1],df=cmd[2] //c:code,ds:description,df:defaults
      r.test(c)&&(s+=c+': '+d+':'+' '.repeat(Math.max(1,25-d.length))+((h[c]||df).slice(-1)[0]||'none')+'\n')
    }
    reqTip(x,'Keyboard Shortcuts',s+'...',1000)
  }
  I.lb_prf.onmousedown=function(){D.prf_ui();return!1}
  I.lb_prf.onclick=function(){return!1} //prevent # from appearing in the URL bar
  $(I.lb_inner).sortable({forcePlaceholderSize:1,placeholder:'lb_placeholder',revert:1,distance:8,
                          start:function(){lbDragged=1},
                          stop:function(e){D.prf.lbarOrder(I.lb_inner.textContent);lbDragged=0}})
  D.prf.lbarOrder(this.lbarRecreate)

  var eachWin=function(f){for(var k in ide.wins){f(ide.wins[k])}}
  var gl=ide.gl=new GoldenLayout({
    settings:{showPopoutIcon:0},dimensions:{borderWidth:4},labels:{minimise:'unmaximise'},
    content:[{title:'Session',type:'component',componentName:'win',componentState:{id:0}}]
  },$(ide.dom))
  gl.registerComponent('win',function(c,h){
    var w=ide.wins[h.id];w.container=c;c.getElement().append(w.dom)
    c.on('tab',function(tab){
      tab.element.click(function(){
        w.cm && w.cm.focus();
        w.me && w.me.focus();
        w.focus();
      })
    })
    c.on('open',function(){
      $(c.getElement()).closest(".lm_item").find(".lm_maximise").onFirst('click',function(){
        w.saveScrollPos()
    })})
    setTimeout(function(){ide.wins[ide.hadErr?0:h.id].focus();ide.hadErr&=D.prf.ilf()},1);
    return w
  })
  gl.registerComponent('wse',function(c,h){
    var u=ide.wse=new D.WSE();u.container=c
    c.getElement().append(u.dom)
    ide.DBGwidth=ide.dbgw;return u
  })
  gl.registerComponent('dbg',function(c,h){
    var u=ide.dbg=new D.DBG();u.container=c
    c.getElement().append(u.dom)
    ide.getSIS();ide.getThreads();
    ide.WSEwidth=ide.wsew;return u
  })
  var sctid //stateChanged timeout id
  gl.on('stateChanged',function(){
    clearTimeout(sctid)
    sctid=setTimeout(function(){
      eachWin(function(w){w.stateChanged()})
    },50)
    ide.wsew=ide.WSEwidth;ide.dbgw=ide.DBGwidth
  })
  gl.on('itemDestroyed',function(x){ide.wins[0].saveScrollPos()})
  gl.on('tabCreated',function(x){
    x.element.off('mousedown',x._onTabClickFn); //remove default binding
    x.element.on('mousedown',function(e){
      if( event.button === 0 || event.type === 'touchstart' ) {
        this.header.parent.setActiveContentItem( this.contentItem );
      }
      else if( event.button === 1 && this.contentItem.config.isClosable ){
        if ( this.middleClick )this.middleClick();
        else this._onTabClick(e);
      }
    }.bind(x));
    switch(x.contentItem.componentName){
      case'dbg':
        x.middleClick=D.prf.dbg.toggle;
        x.closeElement.off('click').click(D.prf.dbg.toggle);
        break;
      case'wse':
        x.middleClick=D.prf.wse.toggle;
        x.closeElement.off('click').click(D.prf.wse.toggle);
        break;
      case'win':
        var id=x.contentItem.config.componentState.id,cls=x.closeElement
        if(id){
          x.middleClick=function(){var w=ide.wins[id];w.EP(w.me);}
          cls.off('click').click(function(){
            var w=ide.wins[id];w.EP(w.me)
          })
        }
        else{
          cls.remove();x.titleElement[0].closest('.lm_tab').style.paddingRight='10px'
        }
        break
    }
  })
  gl.init()

  var updTopBtm=function(){
    ide.dom.style.top=((D.prf.lbar()?I.lb.offsetHeight:0)+(D.el?0:22))+'px'
    gl.updateSize(ide.dom.clientWidth,ide.dom.clientHeight)
  }
  I.lb.hidden=!D.prf.lbar();updTopBtm();$(window).resize(updTopBtm)
  D.prf.lbar(function(x){I.lb.hidden=!x;updTopBtm()})
  D.prf.dark(function(x){x?$("body").addClass("newDark"):$("body").removeClass("newDark")})
  setTimeout(function(){try{D.installMenu(D.parseMenuDSL(D.prf.menu()))}
                        catch(e){$.err('Invalid menu configuration -- the default menu will be used instead')
                                 console.error(e);D.installMenu(D.parseMenuDSL(D.prf.menu.getDefault()))}},100)
  D.prf.autoCloseBrackets(function(x){eachWin(function(w){w.autoCloseBrackets(!!x&&D.Ed.ACB_VALUE)})})
  D.prf.ilf(function(x){var i=x?-1:D.prf.indent();eachWin(function(w){w.id&&w.indent(i)})})
  D.prf.indent(function(x){var i=D.prf.ilf()?-1:x;eachWin(function(w){w.id&&w.indent(i)})})
  D.prf.fold(function(x){eachWin(function(w){w.id&&w.fold(!!x)})})
  D.prf.matchBrackets(function(x){eachWin(function(w){w.matchBrackets(!!x)})})
  var togglePanel=function(comp_name,comp_title,left){
    if(!D.prf[comp_name]()){gl.root.getComponentsByName(comp_name).forEach(function(x){x.container.close()});return}
    var si=D.ide.wins[0].cm.getScrollInfo() //remember session scroll position
    var p=gl.root.contentItems[0]
    if(p.type!=='row'){var row=gl.createContentItem({type:'row'},p);p.parent.replaceChild(p,row)
                       row.addChild(p,0,true);row.callDownwards('setSize');p=row}
    p.addChild({type:'component',componentName:comp_name,title:comp_title,fixedSize:true},left?0:p.contentItems.length)
    D.ide.wins[0].cm.scrollTo(si.left,si.top)
    D.ide[comp_name.toUpperCase()+"width"]=D.ide[comp_name+"w"]=left?200:300;
  }
  var toggleWSE=function(){togglePanel('wse','Workspace Explorer',1)}
  var toggleDBG=function(){togglePanel('dbg','Debug',0)}
  D.prf.wse(toggleWSE);D.prf.wse()&&setTimeout(toggleWSE,500)
  D.prf.dbg(toggleDBG);D.prf.dbg()&&setTimeout(toggleDBG,500)
  D.mac&&setTimeout(function(){ide.wins[0].focus()},500) //OSX is stealing our focus.  Let's steal it back!  Bug #5
  D.prf.lineNums(function(x){eachWin(function(w){w.id&&w.setLN(x)})})
  D.prf.breakPts(function(x){eachWin(function(w){w.id&&w.setBP(x)})})
}
D.IDE.prototype={
  setConnInfo:function(x,y,z){var ide=this;ide.host=x;ide.port=y;ide.profile=z;ide.updTitle()},
  die:function(){ //don't really, just pretend
    var ide=this;if(ide.dead)return
    ide.dead=1;ide.connected=0;ide.dom.className+=' disconnected';for(var k in ide.wins)ide.wins[k].die()
  },
  getThreads:$.debounce(100,function(){D.prf.dbg()&&D.send('GetThreads',{})}),
  getSIS:    $.debounce(100,function(){D.prf.dbg()&&D.send('GetSIStack',{})}),
  updTitle:function(){ //change listener for D.prf.title
    var ide=this,ri=D.remoteIdentification||{},v=D.versionInfo||{}
    document.title=D.prf.title().replace(/\{\w+\}/g,function(x){var X=x.toUpperCase();return(
      X==='{WSID}'?ide.wsid:                         X==='{PID}'?ri.pid:
      X==='{HOST}'?ide.host:                         X==='{CHARS}'?(ri.arch||'').split('/')[0]:
      X==='{PORT}'?ide.port:                         X==='{BITS}' ?(ri.arch||'').split('/')[1]:
      X==='{VER_A}'?(ri.version||'').split('.')[0]:  X==='{RIDE_VER_A}'?(v.version||'').split('.')[0]:
      X==='{VER_B}'?(ri.version||'').split('.')[1]:  X==='{RIDE_VER_B}'?(v.version||'').split('.')[1]:
      X==='{VER_C}'?(ri.version||'').split('.')[2]:  X==='{RIDE_VER_C}'?(v.version||'').split('.')[2]:
      X==='{VER}'?ri.version:                        X==='{RIDE_VER}'?v.version:
      X==='{PROFILE}'?ide.profile:                   x
    )||''})||'Dyalog'
  },
  focusMRUWin:function(){ //most recently used
    var t=0,wins=this.wins,w=wins[0];
    for(var k in wins){var x=wins[k];if(x.id&&t<=x.focusTS){w=x;t=x.focusTS}}
    if(!w.bw_id)D.elw.focus();
    w.focus();
  },
  zoom:function(z){
    var wins=this.wins
    for(var x in wins){wins[x].zoom(z)}
    wins[0].restoreScrollPos();
    this.gl.container.resize();
  },
  LBR:D.prf.lbar      .toggle,
  FLT:D.prf.floating  .toggle,
  WRP:D.prf.wrap      .toggle,
  TOP:D.prf.floatOnTop.toggle,
  TVB:D.prf.breakPts  .toggle,
  LN :D.prf.lineNums  .toggle,
  TVO:D.prf.fold      .toggle,
  UND:function(){this.focusedWin.cm.undo()},
  RDO:function(){this.focusedWin.cm.redo()},
  CAW:function(){D.send('CloseAllWindows',{})},
  Edit:function(data){
    D.pendingEdit=D.pendingEdit||data;
    D.pendingEdit.unsaved=D.pendingEdit.unsaved||{};
    let u=D.pendingEdit.unsaved,v,w,bws=0;
    for(var k in this.wins){
      w=this.wins[k];
      v=+k&&(w.getUnsaved?w.getUnsaved():-1);
      if(v)u[k]=v;
      bws|=v===-1;
    }
    if (bws) {
      D.ipc.server.broadcast('getUnsaved');
    } else {
      D.send('Edit',D.pendingEdit);
      delete D.pendingEdit;
    }
  },
  getUnsaved:function(){
    var r={};for(var k in this.wins){var v=(+k&&this.wins[k].getUnsaved());if(v)r[k]=v}
    return r
  },
  _disconnected:function(){this.die()}, //invoked from cn.js
  lbarRecreate:function(){
    var d=D.lb.order, u=D.prf.lbarOrder() //d:default order, u:user's order
    var r='';if(d!==u)for(var i=0;i<d.length;i++)if(!u.includes(d[i])&&/\S/.test(d[i]))r+=d[i]; //r:set difference between d and u
    I.lb_inner.innerHTML=D.prf.lbarOrder()
      .replace(/\s*$/,'\xa0'+r+r&&'\xa0') // replace any trailing spaces with missing glyphs and final nbs
      .replace(/\s+/g,'\xa0').replace(/(.)/g,'<b>$1</b>')  // replace white spaces with single nbs and markup
  }
}
CM.commands.DBG=function(){D.prf.dbg.toggle()}
CM.commands.WSE=function(){D.prf.wse.toggle()}
CM.commands.ZM=function(){var w=D.ide.focusedWin;w.container.parent.toggleMaximise()
                          setTimeout(function(){w.cm&&w.cm.focus()},100)}
