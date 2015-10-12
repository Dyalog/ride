'use strict'
CodeMirror.defineOption('foldGutter',false,function(cm,val,old){
  if(old&&old!==CodeMirror.Init){
    cm.clearGutter('CodeMirror-foldgutter');cm.state.foldGutter=null;for(var k in eh)cm.off(k,eh[k])
  }
  if(val){cm.state.foldGutter={from:0,to:0};updateInViewport(cm);for(var k in eh)cm.on(k,eh[k])}
})
function isFolded(cm,line){
  var m=cm.findMarksAt(CodeMirror.Pos(line))
  for(var i=0;i<m.length;i++)if(m[i].__isFold&&m[i].find().from.line===line)return m[i]
}
function marker(x){
  var e=document.createElement('div');e.className='CodeMirror-foldgutter-'+x+' CodeMirror-guttermarker-subtle';return e
}
function updateFoldInfo(cm,a,b){ // a:from line, b:to line
  var mfs=cm.foldOption({},'minFoldSize'),f=cm.foldOption({},'rangeFinder'),ends=[],i=a // i:current line
  cm.eachLine(a,b,function(l){
    if(isFolded(cm,i)){
      var m=marker('folded')
    }else{
      var r=f&&f(cm,CodeMirror.Pos(i,0)) // r:range
      if(r&&r.to.line-r.from.line>=mfs){var m=marker('open');ends.push(r.to.line)}
      else if(ends.indexOf(i)>=0){var m=marker('end');ends=ends.filter(function(x){return x>i})}
      else if(ends.length){var m=marker('cont')}
    }
    cm.setGutterMarker(l,'CodeMirror-foldgutter',m);++i
  })
}
var eh={} // event handlers
var updateInViewport=eh.swapDoc=function(cm){
  var vp=cm.getViewport(),h=cm.state.foldGutter
  if(h){cm.operation(function(){updateFoldInfo(cm,vp.from,vp.to)});h.from=vp.from;h.to=vp.to}
}
eh.gutterClick=function(cm,l,gutter){ // l:line
  if(!cm.state.foldGutter||gutter!=='CodeMirror-foldgutter')return
  var u=isFolded(cm,l);u?u.clear():cm.foldCode(CodeMirror.Pos(l,0))
}
eh.change=function(cm){
  var h=cm.state.foldGutter;if(!h)return
  h.from=h.to=0;clearTimeout(h.changeUpdate)
  h.changeUpdate=setTimeout(function(){updateInViewport(cm)},600)
}
eh.viewportChange=function(cm){
  var h=cm.state.foldGutter;if(!h)return
  clearTimeout(h.changeUpdate)
  h.changeUpdate=setTimeout(function(){
    var vp=cm.getViewport()
    if(h.from===h.to||vp.from-h.to>20||h.from-vp.to>20){
      updateInViewport(cm)
    }else{
      cm.operation(function(){
        if(vp.from<h.from){updateFoldInfo(cm,vp.from,h.from);h.from=vp.from}
        if(vp.to  >h.to  ){updateFoldInfo(cm,h.to   ,vp.to );h.to  =vp.to  }
      })
    }
  },100)
}
eh.fold=eh.unfold=function(cm,a){ // a:from line
  var h=cm.state.foldGutter;if(h){var l=a.line;h.from<=l&&l<h.to&&updateFoldInfo(cm,l,l+1)}
}
