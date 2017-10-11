;(function(){'use strict'
D.ipc.config.silent=true;
D.IPC_Client=function(winId){
  // start IPC client  
  D.ipc.config.id   = 'editor'+winId;
  D.ipc.config.retry= 1500;
  D.ide={};
  D.ipc.connectTo('ride_master',function(){
    D.ipc.of.ride_master.on('connect',function(){
      D.ipc.log('## connected to ride_master ##'.rainbow, D.ipc.config.delay);
      D.ipc.of.ride_master.emit('pendingEditor',winId)
    });
    D.ipc.of.ride_master.on('disconnect',function(){
      D.ipc.log('disconnected from ride_master'.notice);
      close();
    });
    D.ipc.of.ride_master.on('die',()=>D.ed.die());
    D.ipc.of.ride_master.on('processAutocompleteReply',x=>D.ed.processAutocompleteReply(x));
    D.ipc.of.ride_master.on('ReplyFormatCode',x=>D.ed.ReplyFormatCode(x));
    D.ipc.of.ride_master.on('getUnsaved',x=>{
      let r=D.ed.getUnsaved();
      D.ipc.of.ride_master.emit('getUnsavedReply',{win:D.ed.id,unsaved:r});
    });
    D.ipc.of.ride_master.on('blockCursor',x=>D.ed.blockCursor(x));
    D.ipc.of.ride_master.on('blinkCursor',x=>D.ed.blinkCursor(x));
    D.ipc.of.ride_master.on('insert',x=>D.ed.insert(x));
    D.ipc.of.ride_master.on('autoCloseBrackets',x=>D.ed.autoCloseBrackets(x));
    D.ipc.of.ride_master.on('indent',x=>D.ed.indent(x));
    D.ipc.of.ride_master.on('fold',x=>D.ed.fold(x));
    D.ipc.of.ride_master.on('matchBrackets',x=>D.ed.matchBrackets(x));
    
    D.ipc.of.ride_master.on('open',x=>D.ed.open(x));
    D.ipc.of.ride_master.on('saved',x=>D.ed.saved(x));
    D.ipc.of.ride_master.on('SetHighlightLine',x=>D.ed.SetHighlightLine(x));
    D.ipc.of.ride_master.on('setLN',x=>D.ed.setLN(x));
    D.ipc.of.ride_master.on('setTC',x=>D.ed.setTC(x));
    D.ipc.of.ride_master.on('stateChanged',x=>D.ed.stateChanged(x));
    D.ipc.of.ride_master.on('ValueTip',x=>D.ed.ValueTip(x));
    D.ipc.of.ride_master.on('pendingEditor',function(pe){
      D.ipc.log('got pendingEditor from ride_master : '.debug);
      window.onresize=function(){ed&&ed.updSize()}
      var editorOpts=pe.editorOpts, ee=pe.ee
      D.send=(type,payload)=>D.ipc.of.ride_master.emit('RIDE',[type,payload]);
      D.ide.Edit=function(x){D.ipc.of.ride_master.emit('Edit',x);};
      D.ide.switchWin=function(x){D.ipc.of.ride_master.emit('switchWin',x);};
      D.ide.getSIS=function(x){D.ipc.of.ride_master.emit('getSIS',x);};
      Object.defineProperty(D.ide,'focusedWin',{
          set:x=>D.ipc.of.ride_master.emit('focusedWin',x.id)
      });
      var ed=D.ed=new D.Ed(D.ide,editorOpts);
      I.ide.append(ed.dom);
      ed.open(ee);ed.updSize();document.title=ed.name
      window.onfocus=()=>ed.focus();
      window.onbeforeunload=function(){return ed.onbeforeunload()}
      setTimeout(function(){ed.refresh()},500) //work around a rendering issue on Ubuntu
      D.ipc.of.ride_master.emit('unblock');
    });
  });  
};

D.IPC_Server=function(){
  // start IPC server
  D.ipc.config.id   = 'ride_master';
  D.ipc.config.retry= 1500;
  D.ipc.serve(function(){
    D.ipc.server.on('pendingEditor',function(winId,socket){
      let pe=D.pendingEditors[winId];
      let wp={
        id:winId,
        die:()=>D.ipc.server.emit(socket,'die'),
        blockCursor:x=>D.ipc.server.emit(socket,'blockCursor',x),
        blinkCursor:x=>D.ipc.server.emit(socket,'blinkCursor',x),
        focus:()=>D.el.BrowserWindow.fromId(pe.bw_id).focus(),
        hasFocus:()=>D.el.BrowserWindow.fromId(pe.bw_id).isFocused(),
        insert:x=>D.ipc.server.emit(socket,'insert',x),
        autoCloseBrackets:x=>D.ipc.server.emit(socket,'autoCloseBrackets',x),
        indent:x=>D.ipc.server.emit(socket,'indent',x),
        fold:x=>D.ipc.server.emit(socket,'fold',x),
        matchBrackets:x=>D.ipc.server.emit(socket,'matchBrackets',x),
        processAutocompleteReply:x=>D.ipc.server.emit(socket,'processAutocompleteReply',x),
        ReplyFormatCode:x=>D.ipc.server.emit(socket,'ReplyFormatCode',x),
        open:x=>D.ipc.server.emit(socket,'open',x),
        saved:x=>D.ipc.server.emit(socket,'saved',x),
        SetHighlightLine:x=>D.ipc.server.emit(socket,'SetHighlightLine',x),
        setLN:x=>{D.ipc.server.emit(socket,'setLN',x)},
        setTC:x=>{D.ipc.server.emit(socket,'setTC',x);wp.tc=x},
        stateChanged:()=>{D.ipc.server.emit(socket,'stateChanged')},
        ValueTip:x=>{D.ipc.server.emit(socket,'ValueTip',x)},
        socket:socket,
        bw_id:pe.bw_id
      };
      D.wins[winId]=wp;
      D.ipc.server.emit(socket,'pendingEditor',pe);
  //    setTimeout(()=>{wp.focus()},1000);
    });
    D.ipc.server.on('Edit',(data,socket)=>{D.ide.Edit(data)});
    D.ipc.server.on('focusedWin',(id,socket)=>{var w=D.ide.focusedWin=D.ide.wins[id];w&&(w.focusTS=+new Date);});
    D.ipc.server.on('getSIS',(data,socket)=>{D.ide.getSIS();});
    D.ipc.server.on('getUnsavedReply',(data,socket)=>{
      if(data.unsaved){ 
        D.pendingEdit.unsaved[data.win]=data.unsaved;
      } else {
        delete D.pendingEdit.unsaved[data.win];
      }
      var ready=true;
      for(var k in D.pendingEdit.unsaved){ready=ready&&D.pendingEdit.unsaved[k]}
      if (ready){
        D.send('Edit',D.pendingEdit);
        delete D.pendingEdit;
      }
    });
    D.ipc.server.on('switchWin',(data,socket)=>{D.ide.switchWin(data);});
    D.ipc.server.on('unblock',(x,socket)=>{D.ide.unblock()});
    D.ipc.server.on('RIDE',([type,payload],socket)=>{D.send(type,payload);});
  });
  D.ipc.server.start();
};
}())