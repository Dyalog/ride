;(function(){'use strict'
D.IPC_Client=function(winId){
  // start IPC client  
  D.ipc.config.id   = 'editor'+winId;
  D.ipc.config.retry= 1500;
  D.ipc.config.silent=true;
  D.send=(type,payload)=>D.ipc.of.ride_master.emit('RIDE',[type,payload]);
  D.ide={
    set focusedWin(w){D.ipc.of.ride_master.emit('focusedWin',w.id)},
    Edit:     function(x){D.ipc.of.ride_master.emit('Edit',x);},
    switchWin:function(x){D.ipc.of.ride_master.emit('switchWin',x);},
    getSIS:   function(x){D.ipc.of.ride_master.emit('getSIS',x);},
    updPW(x) { D.ipc.of.ride_master.emit('updPW', x); },
    connected:1,
    dead:0
  };
  D.ipc.connectTo('ride_master',function(){
    const rm = D.ipc.of.ride_master;
    rm.on('connect',function(){
      D.ipc.log('## connected to ride_master ##'.rainbow, D.ipc.config.delay);
      rm.emit('browserCreated',winId);
    });
    rm.on('disconnect',function(){
      D.ipc.log('disconnected from ride_master'.notice);
      D.ide.connected=0;close();
    });
    const pm = 'die processAutocompleteReply ReplyFormatCode blockCursor blinkCursor ' +
               'insert autoCloseBrackets indent fold matchBrackets open close prompt saved ' +
               'SetHighlightLine setBP setLN setTC stateChanged ValueTip zoom';
    pm.split(' ').forEach(k=>rm.on(k,x=>D.ed[k](x)));
    
    rm.on('getUnsaved',x=>{rm.emit('getUnsavedReply',{win:D.ed.id,unsaved:D.ed.getUnsaved()})});
    rm.on('prf',([k,x])=>{D.prf[k](x,1)});
    rm.on('ED',x=>D.ed.ED(D.ed.cm));
    rm.on('pendingEditor',function(pe){
      D.ipc.log('got pendingEditor from ride_master : '.debug);
      var editorOpts=pe.editorOpts, ee=pe.ee;
      var ed=D.ed=new D.Ed(D.ide,editorOpts);
      I.ide.append(ed.dom);
      ed.me_ready.then(_=>{
        ed.open(ee);ed.updSize();document.title=ed.name
        window.onresize=function(){ed&&ed.updSize()}
        window.onfocus=()=>ed.focus();
        window.onbeforeunload=function(e){ed.onbeforeunload(e)}
        ed.refresh();
        rm.emit('unblock',ed.id);
      })
    });
  });  
};

D.IPC_Prf=function(){
  // start IPC client - preferences
  D.ipc.config.id   = 'prf';
  D.ipc.config.retry= 1500;
  D.ipc.config.silent=true;
  D.ipc.connectTo('ride_master',x=>{
    const rm = D.ipc.of.ride_master;
    rm.on('connect',x=>{
      D.ipc.log('## connected to ride_master ##'.rainbow, D.ipc.config.delay);
      window.onbeforeunload=e=>{
        e.returnValue=false;
        rm.emit('prfClose')
      }
      rm.emit('prfCreated');
    });
    rm.on('disconnect',x=>{
      D.ipc.log('disconnected from ride_master'.notice);
      D.onbeforeunload=null;close();
    });
    rm.on('show',x=>D.prf_ui());
    rm.on('prf',([k,x])=>D.prf[k](x,1));
  });
};

D.IPC_Server=function(){
  // start IPC server
  D.pwins=[];D.pendingEditors=[];
  D.ipc.config.id   = 'ride_master';
  D.ipc.config.retry= 1500;
  D.ipc.config.silent=true;
  D.ipc.serve(function(){
    const srv = D.ipc.server;
    srv.on('prfCreated',(data,socket)=>D.prf_bw.socket=socket);
    srv.on('prfShow',(data,socket)=>D.prf_ui()),
    srv.on('prfClose',(data,socket)=>{
      D.el.BrowserWindow.fromId(D.prf_bw.id).hide();
      D.ide.focusMRUWin()
    });
    srv.on('browserCreated',(bw_id,socket)=>{
      let wp=new D.IPC_WindowProxy(bw_id,socket);D.pwins.push(wp);
      D.IPC_LinkEditor();
    });
    srv.on('Edit',(data,socket)=>{D.ide.Edit(data)});
    srv.on('focusedWin',(id,socket)=>{var w=D.ide.focusedWin=D.ide.wins[id];w&&(w.focusTS=+new Date);});
    srv.on('getSIS',(data,socket)=>{D.ide.getSIS();});
    srv.on('getUnsavedReply',(data,socket)=>{
      if(!D.pendingEdit)return;
      if(data.unsaved&&D.pendingEdit.unsaved[data.win]===-1) 
        D.pendingEdit.unsaved[data.win]=data.unsaved;
      else delete D.pendingEdit.unsaved[data.win];
      var ready=true;for(var k in D.pendingEdit.unsaved){ready=ready&&D.pendingEdit.unsaved[k]}
      if (ready){D.send('Edit',D.pendingEdit);delete D.pendingEdit;}
    });
    srv.on('prf',([k,x],socket)=>{D.prf[k](x)});
    srv.on('switchWin',(data,socket)=>{D.ide.switchWin(data);});
    srv.on('updPW', (data, socket) => { D.ide.updPW(data); });
    srv.on('unblock',(id,socket)=>{
      let pw=D.ide.wins[id],bw=D.el.BrowserWindow.fromId(pw.bw_id);
      bw.show();
      if(D.ide.hadErr&&pw.tc&&!D.elw.isFocused()) {
        D.elw.focus();
        D.ide.hadErr=0;
      }
      D.ide.unblock()}
    );
    srv.on('zoom',(z,socket)=>{D.ide.zoom(z)})
    srv.on('RIDE',([type,payload],socket)=>{D.send(type,payload);});
  });
  D.ipc.server.start();
  D.prf.floatOnTop(function(x){
    for(var k in D.pwins){
      D.el.BrowserWindow.fromId(D.pwins[k].bw_id).setAlwaysOnTop(!!x) 
    }
  });
};
function WindowRect(id,prf){
  var {x,y,width,height}=prf;
  x+=prf.ox*(id-1);y+=prf.oy*(id-1);
  const b=D.el.screen.getDisplayMatching({x,y,width,height}).bounds
  const vw=Math.max(0,Math.min(x+width ,b.x+b.width )-Math.max(x,b.x))
  const vh=Math.max(0,Math.min(y+height,b.y+b.height)-Math.max(y,b.y))
  if(width*height>2*vw*vh){
    //saved window position is now mostly off screen
    x=y=null;width=Math.min(width,b.width);height=Math.min(height,b.height)
  }
  return{x,y,width,height};
}
D.IPC_LinkEditor=function(pe){
  pe&&D.pendingEditors.push(pe);
  if(!D.pendingEditors.length)return;
  let wp=D.pwins.find(w=>w.id<0);
  if(!wp){
    let bw,opts={
      icon: `${__dirname}/D.png`,
      show: false,
      fullscreen: false,
      fullscreenable: true,
      alwaysOnTop: !!D.prf.floatOnTop(),
    };
    opts=Object.assign(opts,WindowRect(pe.editorOpts.id,D.prf.editWins()))
    bw=new D.el.BrowserWindow(opts);
    bw.loadURL(location+'?'+bw.id);
    return;
  }
  pe=D.pendingEditors.shift();
  wp.id=pe.editorOpts.id;
  wp.tc=pe.editorOpts.tc;
  D.wins[wp.id]=wp;
  D.ipc.server.emit(wp.socket,'pendingEditor',pe);
}

D.IPC_WindowProxy=function(bw_id,socket){
  var ed=this;
  ed.bw_id=bw_id;
  ed.socket=socket;
  ed.id=-1;
  ed.me={dyalogCmds:ed};
  ed.tc=0;
  ed.focusTS=+new Date();
};
D.IPC_WindowProxy.prototype={
  die:function(){D.ipc.server.emit(this.socket,'die')},
  blockCursor:function(x){D.ipc.server.emit(this.socket,'blockCursor',x)},
  blinkCursor:function(x){D.ipc.server.emit(this.socket,'blinkCursor',x)},
  focus:function(){D.el.BrowserWindow.fromId(this.bw_id).focus()},
  hasFocus:function(){return D.el.BrowserWindow.fromId(this.bw_id).isFocused()},
  insert:function(x){D.ipc.server.emit(this.socket,'insert',x)},
  autoCloseBrackets:function(x){D.ipc.server.emit(this.socket,'autoCloseBrackets',x)},
  indent:function(x){D.ipc.server.emit(this.socket,'indent',x)},
  fold:function(x){D.ipc.server.emit(this.socket,'fold',x)},
  matchBrackets:function(x){D.ipc.server.emit(this.socket,'matchBrackets',x)},
  processAutocompleteReply:function(x){D.ipc.server.emit(this.socket,'processAutocompleteReply',x)},
  ReplyFormatCode:function(x){D.ipc.server.emit(this.socket,'ReplyFormatCode',x)},
  open:function(x){D.ipc.server.emit(this.socket,'open',x)},
  close:function(x){
    if(this===D.pwins[0]&&D.prf.editWinsRememberPos()){
      let b=D.el.BrowserWindow.fromId(this.bw_id).getBounds();
      D.prf.editWins(Object.assign(D.prf.editWins(),b))
    }
    D.ipc.server.emit(this.socket,'close',x)
  },
  prompt:function(x){D.ipc.server.emit(this.socket,'prompt',x)},
  saved:function(x){D.ipc.server.emit(this.socket,'saved',x)},
  SetHighlightLine:function(x){D.ipc.server.emit(this.socket,'SetHighlightLine',x)},
  setBP:function(x){D.ipc.server.emit(this.socket,'setBP',x)},
  setLN:function(x){D.ipc.server.emit(this.socket,'setLN',x)},
  setTC:function(x){D.ipc.server.emit(this.socket,'setTC',x);this.tc=x},
  ED:function(){D.ipc.server.emit(this.socket,'ED')},
  LN: function(x){D.prf.lineNums.toggle()},
  TVO:function(x){D.prf.fold    .toggle()},
  TVB:function(x){D.prf.breakPts.toggle()},
  stateChanged:function(){D.ipc.server.emit(this.socket,'stateChanged')},
  zoom:function(z){D.ipc.server.emit(this.socket,'zoom',z)},
  ValueTip:function(x){D.ipc.server.emit(this.socket,'ValueTip',x)},
};
  

}())