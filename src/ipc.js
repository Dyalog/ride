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
    getSIS:   function(x){D.ipc.of.ride_master.emit('getSIS',x);}
  };
  D.ipc.connectTo('ride_master',function(){
    D.ipc.of.ride_master.on('connect',function(){
      D.ipc.log('## connected to ride_master ##'.rainbow, D.ipc.config.delay);
      D.ipc.of.ride_master.emit('browserCreated',winId);
    });
    D.ipc.of.ride_master.on('disconnect',function(){
      D.ipc.log('disconnected from ride_master'.notice);
      close();
    });
    D.ipc.of.ride_master.on('die',()=>D.ed.die());
    D.ipc.of.ride_master.on('processAutocompleteReply',x=>D.ed.processAutocompleteReply(x));
    D.ipc.of.ride_master.on('ReplyFormatCode',x=>D.ed.ReplyFormatCode(x));
    D.ipc.of.ride_master.on('getUnsaved',x=>{
      D.ipc.of.ride_master.emit('getUnsavedReply',{win:D.ed.id,unsaved:D.ed.getUnsaved()});
    });
    D.ipc.of.ride_master.on('blockCursor',x=>D.ed.blockCursor(x));
    D.ipc.of.ride_master.on('blinkCursor',x=>D.ed.blinkCursor(x));
    D.ipc.of.ride_master.on('insert',x=>D.ed.insert(x));
    D.ipc.of.ride_master.on('autoCloseBrackets',x=>D.ed.autoCloseBrackets(x));
    D.ipc.of.ride_master.on('indent',x=>D.ed.indent(x));
    D.ipc.of.ride_master.on('fold',x=>D.ed.fold(x));
    D.ipc.of.ride_master.on('matchBrackets',x=>D.ed.matchBrackets(x));
    
    D.ipc.of.ride_master.on('open',x=>D.ed.open(x));
    D.ipc.of.ride_master.on('close',x=>D.ed.close(x));
    D.ipc.of.ride_master.on('saved',x=>D.ed.saved(x));
    D.ipc.of.ride_master.on('SetHighlightLine',x=>D.ed.SetHighlightLine(x));
    D.ipc.of.ride_master.on('setLN',x=>D.ed.setLN(x));
    D.ipc.of.ride_master.on('setTC',x=>D.ed.setTC(x));
    D.ipc.of.ride_master.on('stateChanged',x=>D.ed.stateChanged(x));
    D.ipc.of.ride_master.on('ValueTip',x=>D.ed.ValueTip(x));
    D.ipc.of.ride_master.on('pendingEditor',function(pe){
      D.ipc.log('got pendingEditor from ride_master : '.debug);
      var editorOpts=pe.editorOpts, ee=pe.ee;
      var ed=D.ed=new D.Ed(D.ide,editorOpts);
      I.ide.append(ed.dom);
      ed.open(ee);ed.updSize();document.title=ed.name
      window.onresize=function(){ed&&ed.updSize()}
      window.onfocus=()=>ed.focus();
      window.onbeforeunload=function(e){ed.onbeforeunload(e)}
      setTimeout(function(){ed.refresh()},500) //work around a rendering issue on Ubuntu
      D.ipc.of.ride_master.emit('unblock',ed.id);
    });
  });  
};

D.IPC_Server=function(){
  // start IPC server
  D.pwins=[];D.pendingEditors=[];
  D.ipc.config.id   = 'ride_master';
  D.ipc.config.retry= 1500;
  D.ipc.config.silent=true;
  D.ipc.serve(function(){
    D.ipc.server.on('browserCreated',function(bw_id,socket){
      let wp=new D.IPC_WindowProxy(bw_id,socket);D.pwins.push(wp);
      D.IPC_LinkEditor();
    });
    D.ipc.server.on('Edit',(data,socket)=>{D.ide.Edit(data)});
    D.ipc.server.on('focusedWin',(id,socket)=>{var w=D.ide.focusedWin=D.ide.wins[id];w&&(w.focusTS=+new Date);});
    D.ipc.server.on('getSIS',(data,socket)=>{D.ide.getSIS();});
    D.ipc.server.on('getUnsavedReply',(data,socket)=>{
      if(!D.pendingEdit)return;
      if(data.unsaved&&D.pendingEdit.unsaved[data.win]===false) 
        D.pendingEdit.unsaved[data.win]=data.unsaved;
      else delete D.pendingEdit.unsaved[data.win];
      var ready=true;for(var k in D.pendingEdit.unsaved){ready=ready&&D.pendingEdit.unsaved[k]}
      if (ready){D.send('Edit',D.pendingEdit);delete D.pendingEdit;}
    });
    D.ipc.server.on('switchWin',(data,socket)=>{D.ide.switchWin(data);});
    D.ipc.server.on('unblock',(id,socket)=>{
      let bw_id=D.ide.wins[id].bw_id,bw=D.el.BrowserWindow.fromId(bw_id);
      bw.show();
      D.ide.unblock()}
    );
    D.ipc.server.on('RIDE',([type,payload],socket)=>{D.send(type,payload);});
  });
  D.ipc.server.start();
};

D.IPC_LinkEditor=function(pe){
  pe&&D.pendingEditors.push(pe);
  if(!D.pendingEditors.length)return;
  let wp=D.pwins.find(w=>w.id<0);
  if(!wp){
    let bw=new D.el.BrowserWindow({icon:__dirname+'/D.png',show:false});
    bw.loadURL(location+'?'+bw.id);
    return;
  }
  pe=D.pendingEditors.shift();
  wp.id=pe.editorOpts.id;
  D.wins[wp.id]=wp;
  D.ipc.server.emit(wp.socket,'pendingEditor',pe);
}

D.IPC_WindowProxy=function(bw_id,socket){
  this.bw_id=bw_id;
  this.socket=socket;
  this.id=-1;
};
D.IPC_WindowProxy.prototype={
  die:function(){D.ipc.server.emit(this.socket,'die')},
  blockCursor:function(x){D.ipc.server.emit(this.socket,'blockCursor',x)},
  blinkCursor:function(x){D.ipc.server.emit(this.socket,'blinkCursor',x)},
  focus:function(){D.el.BrowserWindow.fromId(this.bw_id).focus()},
  hasFocus:function(){D.el.BrowserWindow.fromId(this.bw_id).isFocused()},
  insert:function(x){D.ipc.server.emit(this.socket,'insert',x)},
  autoCloseBrackets:function(x){D.ipc.server.emit(this.socket,'autoCloseBrackets',x)},
  indent:function(x){D.ipc.server.emit(this.socket,'indent',x)},
  fold:function(x){D.ipc.server.emit(this.socket,'fold',x)},
  matchBrackets:function(x){D.ipc.server.emit(this.socket,'matchBrackets',x)},
  processAutocompleteReply:function(x){D.ipc.server.emit(this.socket,'processAutocompleteReply',x)},
  ReplyFormatCode:function(x){D.ipc.server.emit(this.socket,'ReplyFormatCode',x)},
  open:function(x){D.ipc.server.emit(this.socket,'open',x)},
  close:function(x){D.ipc.server.emit(this.socket,'close',x)},
  saved:function(x){D.ipc.server.emit(this.socket,'saved',x)},
  SetHighlightLine:function(x){D.ipc.server.emit(this.socket,'SetHighlightLine',x)},
  setLN:function(x){D.ipc.server.emit(this.socket,'setLN',x)},
  setTC:function(x){D.ipc.server.emit(this.socket,'setTC',x);this.tc=x},
  stateChanged:function(){D.ipc.server.emit(this.socket,'stateChanged')},
  ValueTip:function(x){D.ipc.server.emit(this.socket,'ValueTip',x)},
};
  

}())