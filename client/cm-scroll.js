'use strict'
var CM=CodeMirror
function addClass(e,c){e.className+=' '+c}
function rmClass(e,c){e.className=e.className.replace(RegExp(' *\\b'+c+'\\b','gi'),'')}
function Bar(o,scroll){ // o:orientation(0=vertical,1=horizontal)
  var scrn=1,total=1,size=1,pos=0,node=document.createElement('div');node.className='cm-scroll-'+'vh'[o]
  var inner=node.appendChild(document.createElement('div'))
  CM.on(inner,'mouseover',function(){addClass(inner,'hover')})
  CM.on(inner,'mouseout',function(){rmClass(inner,'hover')})
  CM.on(inner,'mousedown',function(e){
    if(e.which!==1)return
    CM.e_preventDefault(e);var axis=o?'pageX':'pageY',start=e[axis],pos0=pos
    function done(){CM.off(document,'mousemove',move);CM.off(document,'mouseup',done);rmClass(inner,'drag')}
    function move(e){e.which!==1?done():moveTo(pos0+(e[axis]-start)*total/size)}
    CM.on(document,'mousemove',move);CM.on(document,'mouseup',done)
    addClass(inner,'drag')
  })
  CM.on(node,'click',function(e){
    CM.e_preventDefault(e);var x=e.clientX,y=e.clientY,r=inner.getBoundingClientRect()
    moveTo(pos+scrn*(o?(x>r.right)-(x<r.left):(y>r.bottom)-(y<r.top)))
  })
  function wheel(e){var p=pos;moveTo(p+CM.wheelEventPixels(e)['xy'[o]]);pos!==p&&CM.e_preventDefault(e)}
  CM.on(node,'mousewheel',wheel);CM.on(node,'DOMMouseScroll',wheel)
  function moveTo(p,skipUpdate){
    p=Math.max(0,Math.min(total-scrn,p))
    if(p!==pos){pos=p;inner.style[o?'left':'top']=(p*size/total)+'px';skipUpdate||scroll(p,o?'horizontal':'vertical')}
  }
  function update(total1,scrn1,size1){
    scrn=scrn1;total=total1;size=size1
    var t=scrn*(size/total),m=20;if(t<m){size-=m-t;t=m} // t:thumb size, m:min thumb size
    inner.style[o?'width':'height']=t+'px';inner.style[o?'left':'top']=pos*(size/total)+'px'
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
      if(vb){v.update(m.scrollHeight,m.clientHeight,m.viewHeight-(hb?w:0));vs.display='';vs.bottom=hb?w+'px':'0'}
      if(hb){h.update(m.scrollWidth,m.clientWidth,m.viewWidth-(vb?w:0)-m.barLeft);hs.right=vb?w+'px':'0';hs.left=m.barLeft+'px'}
      return{right:vb?w:0,bottom:hb?w:0}
    }
  }
}
