'use strict'
var CM=CodeMirror
CM.defineOption('foldGutter',false,function(cm,v,o){ // v:new value, o:old value
  if(o&&o!==CM.Init){cm.clearGutter('cm-foldgutter');cm.state.foldGutter=null;for(var k in eh)cm.off(k,eh[k])}
  if(v){cm.state.foldGutter={from:0,to:0};updInViewport(cm);for(var k in eh)cm.on(k,eh[k])}
})
function getFold(cm,l){var m=cm.findMarksAt(CM.Pos(l))
                       for(var i=0;i<m.length;i++)if(m[i].__isFold&&m[i].find().from.line===l)return m[i]}
function updMarkers(cm,a,b){ // a/b: from/to line -- ignored, we always update the whole editor
  // there's room for optimisation here
  a=0;b=cm.lineCount();var f=cm.foldOption({},'rangeFinder'),e=[],i=a // e:ends, i:current line
  cm.eachLine(a,b,function(lh){var t='folded' // t:marker type
    if(!getFold(cm,i)){var r=f&&f(cm,CM.Pos(i,0)) // r:range
                       if(r){var t='open';e.push(r.to.line)}
                       else if(e.indexOf(i)>=0){var t='end',j=0;while(j<e.length)e[j]>i?j++:e.splice(j,1)}
                       else if(e.length){var t='cont'}
                       else{t=''}}
    i++;if(t){var m=document.createElement('div') // marker
              m.className='cm-foldgutter-'+t+' CodeMirror-guttermarker-subtle';cm.setGutterMarker(lh,'cm-foldgutter',m)}
  })
}
var eh={} // event handlers
var updInViewport=eh.swapDoc=function(cm){
  var vp=cm.getViewport(),h=cm.state.foldGutter
  if(h){cm.operation(function(){updMarkers(cm,vp.from,vp.to)});h.from=vp.from;h.to=vp.to}
}
eh.gutterClick=function(cm,l,g){ // l:line, g:gutter
  if(cm.state.foldGutter&&g==='cm-foldgutter'){var u=getFold(cm,l);u?u.clear():cm.foldCode(CM.Pos(l,0))}
}
eh.change=function(cm){var h=cm.state.foldGutter;if(!h)return
                       h.from=h.to=0;clearTimeout(h.tid);h.tid=setTimeout(function(){updInViewport(cm)},600)}
eh.viewportChange=function(cm){
  var h=cm.state.foldGutter;if(!h)return
  clearTimeout(h.tid);h.tid=setTimeout(function(){
    var vp=cm.getViewport()
    h.from===h.to||vp.from-h.to>20||h.from-vp.to>20
      ?updInViewport(cm)
      :cm.operation(function(){if(vp.from<h.from){updMarkers(cm,vp.from,h.from);h.from=vp.from}
                               if(vp.to  >h.to  ){updMarkers(cm,h.to   ,vp.to );h.to  =vp.to  }})
  },100)
}
eh.fold=eh.unfold=function(cm,lh){var h=cm.state.foldGutter;if(h){var l=lh.line;h.from<=l&&l<h.to&&updMarkers(cm,l,l+1)}}
