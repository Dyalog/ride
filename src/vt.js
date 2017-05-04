//value tips: hover over a name to see a pop-up with its current value
D.vt=function(w){'use strict' //.init(w) gets called for every window w (session or editor)
  var i,p,rf //i:timeout id, p:position as {line,ch}, rf:function that processes the reply
  var mrk //marker from https://codemirror.net/doc/manual.html#markText
  //╭─────────────╮
  //│             │ I.vt_bln   balloon
  //╰────.  .─────╯
  //      ╲╱        I.vt_tri   triangle, centred horizontally on the token
  // ┌ ─ ─ ─ ─ ┐
  //  t o k e n                rectangle around the token
  // └ ─ ─ ─ ─ ┘
  var MW=64,MH=32 //maxWidth and maxHeight for the character matrix displayed in the tooltip
  var cl=function(){ //clear all
    mrk&&mrk.clear();mrk=null;i&&clearTimeout(i);I.vt_bln.hidden=I.vt_tri.hidden=1;i=p=null
  }
  w.cm.on('cursorActivity',cl)
  var show=function(p0,force){ //p0:{line,ch}
    cl();p0.outside||(i=setTimeout(function(){ //send a request (but not too often)
      i=0;p=p0;var s=w.cm.getLine(p.line),c=s[p.ch]||' ',lbt=D.lb.tips[c]
      if((force||D.prf.squiggleTips())&&lbt&&!'⍺⍵'.includes(c)&&!(c==='⎕'&&/[áa-z]/i.test(s[p.ch+1]||''))){
        rf({tip:lbt.join('\n\n').split('\n'),startCol:p.ch,endCol:p.ch+1}) //show tooltip from language bar
      }else if((force||D.prf.valueTips())&&/[^ \(\)\[\]\{\}':;]/.test(c)){
        D.send('GetValueTip',{win:w.id,line:s,pos:p.ch,token:w.id,maxWidth:MW,maxHeight:MH}) //ask interpreter
      }
    },500))
  }
  var oldX=0,oldY=0 //ignore "mousemove" when it's the result of the user pressing <ER> at the end of session
                    //without moving the mouse
  w.cm.display.wrapper.onmouseout=cl
  w.cm.display.wrapper.onmousemove=function(e){var x=e.clientX,y=e.clientY;if(x===oldX&&y===oldY)return
                                               show(w.cm.coordsChar({left:oldX=x,top:oldY=y}))}
  return{clear:cl,show:show,processReply:rf=function(x){
    if(!p)return
    var d=w.getDocument(),ce=w.cm.display.wrapper                 //ce:CodeMirror element
    ,cw=ce.clientWidth,cx=ce.clientLeft,cy=ce.clientTop           //CodeMirror's dimensions and coordinates
    ,de=d.documentElement,ww=de.clientWidth,wh=de.clientHeight    //window dimensions
    ,p0={line:p.line,ch:x.startCol}
    ,p1={line:p.line,ch:x.endCol}
    ,r0=w.cm.charCoords(p0)                                       //r0:bounding rectangle for start of token
    ,r1=w.cm.charCoords({line:p.line,ch:x.endCol-1})              //r1:                   for end   of token
    ,rx=r0.left,ry=r0.top,rw=r1.right-r0.left,rh=r1.bottom-r0.top //bounding rectangle for whole token
    ,s=(x.tip.length<MH?x.tip:x.tip.slice(0,MH-1).concat('…'))
            .map(function(s){return s.length<MW?s:s.slice(0,MW-1)+'…'}).join('\n')
    ,be=I.vt_bln,te=I.vt_tri
    cl();be.hidden=te.hidden=0;be.textContent=s
    mrk=w.cm.markText(p0,p1,{className:'vt_marker',inclusiveRight:0})
    var th=6,tw=2*th,inv=ry<wh-ry-rh                              //tw,th:triangle dimensions, inv:is upside-down?
    ,bp=0,bw=be.clientWidth,bh=be.clientHeight                    //balloon padding and dimensions
    ,bx=Math.max(0,Math.min(ww-bw,rx+(rw-bw)/2-bp))               //balloon coordinates
    ,by=inv?ry+rh+th:ry-bh-2*bp-th
    ,tx=rx+(rw-tw)/2,ty=inv?ry+rh:ry-th                           //triangle coordinates
    var bs=be.style;bs.left=bx+'px';bs.top=by<0?0:by+'px';bs.height=by<0?(ry-th-2*bp)+'px':'auto'
    var ts=te.style;ts.left=tx+'px';ts.top=ty+'px';te.className=inv?'inv':''
  }}
}
