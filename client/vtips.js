// value tips: hover a name to see a pop-up with its current value
this.init=function(w){ // w:window (session or editor)
  var t // timeout id
  $(w.cm.display.wrapper)
    .mouseout(function(){clearTimeout(t);t=0})
    .mousemove(function(e){
      var p=w.cm.coordsChar({left:e.clientX,top:e.clientY},'page');clearTimeout(t);t=0;if(p.outside)return
      t=setTimeout(function(){t=0;w.emit('GetValueTip',{win:w.id,line:w.cm.getLine(p.line),pos:p.ch,token:0})},500)
    })
}
