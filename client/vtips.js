'use strict'
// value tips: hover over a name to see a pop-up with its current value
var lbar=require('./lbar')
var MW=64,MH=32 // maxWidth and maxHeight for the character matrix displayed in the tooltip
this.init=function(w){ // .init(w) gets called for every window w (session or editor)
  var i,p,$b,$t,$r,rf // i:timeout id, p:position as {line,ch}, rf:function that processes the reply
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
      i=0;p=p0;var s=w.cm.getLine(p.line),lbt=lbar.tips[s[p.ch]]
      if(lbt){rf({tip:lbt.join('\n\n').split('\n'),startCol:p.ch,endCol:p.ch+1})}
      else{w.emit('GetValueTip',{win:w.id,line:s,pos:p.ch,token:w.id,maxWidth:MW,maxHeight:MH})}
    },500))
  })
  return rf=function(x){ // return a function that processes the reply
    if(!p)return
    var d=w.getDocument(),ce=w.cm.display.wrapper                // ce:CodeMirror element
    var cw=ce.clientWidth,co=$(ce).offset(),cx=co.left,cy=co.top // CodeMirror's dimensions and coords
    var r0=w.cm.charCoords({line:p.line,ch:x.startCol})          // bounding rectangle for start of token
    var r1=w.cm.charCoords({line:p.line,ch:x.endCol-1})          //                        end   of token
    var rx=r0.left-cx,ry=r0.top-cy,rw=r1.right-r0.left,rh=r1.bottom-r0.top // whole token
    var s=(x.tip.length<MH?x.tip:x.tip.slice(0,MH-1).concat('...'))
            .map(function(s){return s.length<MW?s:s.slice(0,MW-3)+'...'}).join('\n')
    cl();$b=$('<div id=vtip-balloon>',d).text(s);$t=$('<div id=vtip-triangle>',d);$r=$('<div id=vtip-rect>',d)
    $b.add($t).add($r).hide().appendTo(w.cm.display.wrapper)
    var th=6,tw=2*th                                             // triangle dimensions
    var bp=8,bw=$b.width(),bh=$b.height()                        // balloon padding and dimensions
    var bx=Math.max(cx,Math.min(cx+cw-bw,rx+(rw-bw)/2-bp))-cx    // bx,by:balloon coordinates
    var by=ry-bh-2*bp-th, inv=by<0;if(inv)by=ry+rh+th            // inv:is the tooltip upside-down?
    var tx=rx+(rw-tw)/2, ty=inv?ry+rh:ry-th                      // triangle coordinates
    $b.css({left:bx,top:by});$t.css({left:tx,top:ty});$b.add($t).toggleClass('inv',inv).show()
    $r.css({left:rx,width:rw,top:ry,height:rh}).show()
  }
}
