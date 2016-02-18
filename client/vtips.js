// value tips: hover a name to see a pop-up with its current value
var i,t=0,$e,b // i:timeout id, t:token for current request (a counter), $e:DOM element, b:bounding rect of hovered char
this.init=function(w){ // w:window (session or editor)
  $e=$e||$('<div id=vtip>').hide().appendTo('body')
  $(w.cm.display.wrapper)
    .mouseout(function(){clearTimeout(i);i=0;$e&&$e.hide()})
    .mousemove(function(e){
      var p=w.cm.coordsChar({left:e.clientX,top:e.clientY});clearTimeout(i);i=0;$e.hide()
      p.outside||(i=setTimeout(function(){
        i=0;b=w.cm.charCoords(p);w.emit('GetValueTip',{win:w.id,line:w.cm.getLine(p.line),pos:p.ch,token:++t})
      },500))
    })
}
this.processReply=function(x){
  var bp=8,th=6 // bp:balloon padding, th:triangle height
  x.token===t&&$e.text(x.tip).show().css({left:(b.right+b.left-$e.width())/2-bp,top:b.top-$e.height()-bp-th})
}
