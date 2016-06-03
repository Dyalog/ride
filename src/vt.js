D.modules.vt=function(rq){'use strict'

// value tips: hover over a name to see a pop-up with its current value
var lb=rq('./lb'),prf=rq('./prf')
var MW=64,MH=32 // maxWidth and maxHeight for the character matrix displayed in the tooltip
this.init=function(w){ // .init(w) gets called for every window w (session or editor)
  var i,p,$b,$t,$r,rf // i:timeout id, p:position as {line,ch}, rf:function that processes the reply
  // ╭─────────────╮
  // │             │ $b: balloon
  // ╰────.  .─────╯
  //       ╲╱        $t: triangle, centred horizontally on the token
  //  ┌ ─ ─ ─ ─ ┐
  //   t o k e n     $r: rectangle around the token
  //  └ ─ ─ ─ ─ ┘
  var cl=function(){i&&clearTimeout(i);$b&&$b.remove();$t&&$t.remove();$r&&$r.remove();i=p=$b=$t=$r=null} // clear all
  w.cm.on('cursorActivity',cl)
  var show=function(p0,force){ // p0:{line,ch}
    cl();p0.outside||(i=setTimeout(function(){                                  // send a request (not too often)
      i=0;p=p0;var s=w.cm.getLine(p.line),c=s[p.ch]||' ',lbt=lb.tips[c]
      if((force||prf.squiggleTips())&&lbt&&!(c==='⎕'&&/[áa-z]/i.test(s[p.ch+1]||''))){
        rf({tip:lbt.join('\n\n').split('\n'),startCol:p.ch,endCol:p.ch+1}) // show tooltip from lbar
      }else if((force||prf.valueTips())&&/[^ \(\)\[\]\{\}':;]/.test(c)){
        w.emit('GetValueTip',{win:w.id,line:s,pos:p.ch,token:w.id,maxWidth:MW,maxHeight:MH}) // ask interpreter
      }
    },500))
  }
  $(w.cm.display.wrapper).mouseout(cl).mousemove(function(e){show(w.cm.coordsChar({left:e.clientX,top:e.clientY}))})
  return{
    clear:cl,show:show,
    processReply:rf=function(x){ // return a function that processes the reply
      if(!p)return
      var d=w.getDocument(),ce=w.cm.display.wrapper                    // ce:CodeMirror element
      var cw=ce.clientWidth,co=$(ce).offset(),cx=co.left,cy=co.top     // CodeMirror's dimensions and coordinates
      var de=d.documentElement,ww=de.clientWidth,wh=de.clientHeight    // window dimensions
      var r0=w.cm.charCoords({line:p.line,ch:x.startCol})              // bounding rectangle for start of token
      var r1=w.cm.charCoords({line:p.line,ch:x.endCol-1})              //                        end   of token
      var rx=r0.left,ry=r0.top,rw=r1.right-r0.left,rh=r1.bottom-r0.top // bounding rectangle for whole token
      var s=(x.tip.length<MH?x.tip:x.tip.slice(0,MH-1).concat('…'))
              .map(function(s){return s.length<MW?s:s.slice(0,MW-1)+'…'}).join('\n')
      cl();$b=$('<div id=vtip-balloon>',d).text(s);$t=$('<div id=vtip-triangle>',d);$r=$('<div id=vtip-rect>',d)
      $b.add($t).add($r).hide().appendTo(d.body)
      var th=6,tw=2*th                                                 // triangle dimensions
      var inv=ry<wh-ry-rh                                              // is tooltip upside-down below the token?
      var bp=8,bw=$b.width(),bh=$b.height()                            // balloon padding and dimensions
      var bx=Math.max(0,Math.min(ww-bw,rx+(rw-bw)/2-bp))               // balloon coordinates
      var by=inv?ry+rh+th:ry-bh-2*bp-th
      var tx=rx+(rw-tw)/2,ty=inv?ry+rh:ry-th                           // triangle coordinates
      $b.css({left:bx,top:by<0?0:by,height:by<0?ry-th-2*bp:'auto'}).show()
      $t.css({left:tx,top:ty}).toggleClass('inv',inv).show()
      $r.css({left:rx,top:ry,width:rw,height:rh}).show()
    }
  }
}

}
