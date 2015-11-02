'use strict'
var CM=CodeMirror
function addClass(e,c){e.className+=' '+c}
function rmClass(e,c){e.className=e.className.replace(RegExp(' *\\b'+c+'\\b','gi'),'')}
function Bar(o,scroll){ // o:orientation(0=vertical,1=horizontal), scroll:a callback function to request scrolling
  //                  ┏visible━part━┓
  // ┌all─content─────╂─────────────╂──────────────────────────┐
  // └────────────────╂─────────────╂──────────────────────────┘
  //                  ┗━━━━━━━━━━━━━┛
  // |<─────pos──────>|<───scrn────>|
  //                   |<──size──>|                               size:distance that the thumb can travel
  // |<───────────────────────total───────────────────────────>|
  var scrn=1,total=1,size=1,pos=0,w=1 // w:thickness of a scrollbar or, equivalently, size of a button
  // DOM structure of a scrollbar:
  // ┌─────────────────────node─────────────────────┐
  // │┌btn┐   ┌──────thumb──────┐              ┌btn┐│
  // ││ < │   │                 │              │ > ││
  // │└───┘   └─────────────────┘              └───┘│
  // └──────────────────────────────────────────────┘
  var node=document.createElement('div');node.className='cm-scroll cm-scroll-'+'vh'[o]
  var thumb=node.appendChild(document.createElement('a'));thumb.className='thumb'
  var btns=[]
  for(var i=0;i<2;i++){var b=node.appendChild(document.createElement('a'));b.className='btn btn'+i;btns.push(b)}
  CM.on(thumb,'mousedown',function(e){
    if(e.which!==1)return
    CM.e_preventDefault(e);var axis=o?'pageX':'pageY',start=e[axis],pos0=pos
    function done(){CM.off(document,'mousemove',move);CM.off(document,'mouseup',done);rmClass(thumb,'press')}
    function move(e){e.which!==1?done():moveTo(pos0+total*(e[axis]-start)/(size-2*w))}
    CM.on(document,'mousemove',move);CM.on(document,'mouseup',done)
    addClass(thumb,'press')
  })
  CM.on(node,'click',function(e){
    CM.e_preventDefault(e);var x=e.clientX,y=e.clientY,r=thumb.getBoundingClientRect()
    moveTo(pos+scrn*(o?(x>r.right)-(x<r.left):(y>r.bottom)-(y<r.top)))
  })
  function wheel(e){var p=pos;moveTo(p+CM.wheelEventPixels(e)['xy'[o]]);pos!==p&&CM.e_preventDefault(e)}
  CM.on(node,'mousewheel',wheel);CM.on(node,'DOMMouseScroll',wheel)
  function moveTo(p,skipUpdate){
    p=Math.max(0,Math.min(total-scrn,p))
    if(p!==pos){pos=p;thumb.style[o?'left':'top']=(w+(size-2*w)*p/total)+'px';skipUpdate||scroll(p,o?'horizontal':'vertical')}
  }
  function update(total1,scrn1,size1,w1){
    total=total1;scrn=scrn1;size=size1;w=w1
    var t=(size-2*w)*scrn/total,m=20;if(t<m){size-=m-t;t=m} // t:thumb size, m:min thumb size
    thumb.style[o?'width':'height']=t+'px';thumb.style[o?'left':'top']=(w+pos*(size-2*w)/total)+'px'
  }
  return{node:node,moveTo:moveTo,update:update}
}
CM.scrollbarModel.simple=function(place,scroll){
  var h=Bar(1,scroll),v=Bar(0,scroll),width;place(h.node);place(v.node)
  return{
    setScrollTop :function(p){v.moveTo(p,1)},
    setScrollLeft:function(p){h.moveTo(p,1)},
    clear:function(){var p=h.node.parentNode;p.removeChild(h.node);p.removeChild(v.node)},
    update:function(m){ // m:measure
      if(!width){
        var style=window.getComputedStyle?window.getComputedStyle(h.node):h.node.currentStyle
        if(style)width=parseInt(style.height)
      }
      var w=width||0,vs=v.node.style,hs=h.node.style
      var hb=m.scrollWidth >m.clientWidth +1;vs.display=vb?'':'none' // hb:needs horizontal bar?
      var vb=m.scrollHeight>m.clientHeight+1;hs.display=hb?'':'none' // vb:needs vertical bar?
      if(vb){v.update(m.scrollHeight,m.clientHeight,m.viewHeight-(hb?w:0),w);vs.display='';vs.bottom=hb?w+'px':'0'}
      if(hb){h.update(m.scrollWidth,m.clientWidth,m.viewWidth-(vb?w:0)-m.barLeft,w);hs.right=vb?w+'px':'0';hs.left=m.barLeft+'px'}
      return{right:vb?w:0,bottom:hb?w:0}
    }
  }
}
