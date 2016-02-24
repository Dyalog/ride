'use strict'
// value tips: hover over a name to see a pop-up with its current value
var MW=50,MH=10 // maxWidth and maxHeight for the character matrix displayed in the tooltip
this.init=function(w){ // .init(w) gets called for every window w (session or editor)
  var i,p,$b,$t,$r // i:timeout id, p:position as {line,ch}
  // ╭───────────╮
  // │           │  balloon ($b)
  // ╰──.  .─────╯
  //     ╲╱         triangle ($t)
  //   ┌ ─ ─ ─ ┐
  //    n a m e     rectangle around the name ($r)
  //   └ ─ ─ ─ ┘
  function cl(){clearTimeout(i);$($b).add($t).add($r).remove();i=p=$b=$t=$r=null} // clear everything
  $(w.cm.display.wrapper).mouseout(cl).mousemove(function(e){
    cl();var p0=w.cm.coordsChar({left:e.clientX,top:e.clientY})
    p0.outside||(i=setTimeout(function(){ // send a request (not too often)
      i=0;p=p0;w.emit('GetValueTip',{win:w.id,line:w.cm.getLine(p.line),pos:p.ch,token:w.id,maxWidth:MW,maxHeight:MH})
    },500))
  })
  return function(x){ // return a function that processes the reply
    if(!p)return
    var d=w.getDocument()
    var r0=w.cm.charCoords({line:p.line,ch:x.startCol})    // bounding rectangle for start of token
    var r1=w.cm.charCoords({line:p.line,ch:x.endCol-1})    //                        end   of token
    var rx=r0.left, ry=r0.top, rw=r1.right-rx, rh=r1.bottom-ry  // whole token
    rx-=$(w.cm.display.wrapper).offset().left              // correct for CodeMirror's own offset
    ry-=$(w.cm.display.wrapper).offset().top
    var dw=w.cm.display.wrapper.clientWidth, dx=$(w.cm.display.wrapper).offset().left // CodeMirror's width and x coord
    var s=(x.tip.length<MH?x.tip:x.tip.slice(0,MH-1).concat('...'))
            .map(function(s){return s.length<MW?s:s.slice(0,MW-3)+'...'}).join('\n')
    cl();$b=$('<div id=vtip-balloon>',d).text(s);$t=$('<div id=vtip-triangle>',d);$r=$('<div id=vtip-rect>',d)
    $b.add($t).add($r).hide().appendTo(w.cm.display.wrapper)
    var th=6,tw=2*th                                       // triangle dimensions
    var bp=8,bw=$b.width(),bh=$b.height()                  // balloon padding and dimensions
    var bx=Math.max(dx,Math.min(dx+dw-bw,rx+(rw-bw)/2-bp)) // bx,by:balloon coordinates
    var by=ry-bh-2*bp-th, inv=by<0;if(inv)by=ry+rh+th      // inv:is the tooltip upside-down?
    var tx=rx+(rw-tw)/2, ty=inv?ry+rh:ry-th                // triangle coordinates
    $b.css({left:bx,top:by});$t.css({left:tx,top:ty});$b.add($t).toggleClass('inv',inv).show()
    $r.css({left:rx,width:rw,top:ry,height:rh}).show()
  }
}
