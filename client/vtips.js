// value tips: hover over a name to see a pop-up with its current value
var i,t=0,p,w // i:timeout id, t:token counter, p:position as {line,ch}, w:session or editor
var $b,$t // jQuery wrappers for balloon and triangle
function cl(){clearTimeout(i);$b&&$b.remove();$t&&$t.remove();i=p=w=$b=$t=null}
this.init=function(w0){ // w0:session or editor
  $(w0.cm.display.wrapper).mouseout(cl).mousemove(function(e){
    cl();var p0=w0.cm.coordsChar({left:e.clientX,top:e.clientY})
    p0.outside||(i=setTimeout(function(){
      i=0;w=w0;p=p0;w.emit('GetValueTip',{win:w.id,line:w.cm.getLine(p.line),pos:p.ch,token:++t})
    },500))
  })
}
this.processReply=function(x){
  if(x.token!==t||!w)return
  var d=w.getDocument(), dw=w.cm.display.wrapper.clientWidth, r=w.cm.charCoords(p) // r:bounding rect for hovered char
  cl();$b=$('<div id=vtip>',d).text(x.tip);$t=$('<div id=vtip-triangle>',d);$b.add($t).hide().appendTo(d.body)
  var th=6,tw=2*th // triangle dimensions
  var bp=8,bw=$b.width(),bh=$b.height() // bp,bw,bh:balloon padding and dimensions
  var bx=Math.max(0,Math.min(dw-bw,(r.right+r.left-bw)/2-bp)) // bx,by:balloon coordinates
  var by=r.top-bh-2*bp-th, inv=by<0;if(inv)by=r.bottom+th // inv:is the tooltip upside-down?
  var tx=(r.right+r.left-tw)/2, ty=inv?r.bottom:r.top-th
  $b.css({left:bx,top:by});$t.css({left:tx,top:ty});$b.add($t).toggleClass('inv',inv).show()
}
