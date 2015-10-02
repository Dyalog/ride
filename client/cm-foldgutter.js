'use strict'
CodeMirror.defineOption('foldGutter',false,function(cm,val,old){
  if(old&&old!==CodeMirror.Init){
    cm.clearGutter(cm.state.foldGutter.options.gutter)
    cm.state.foldGutter=null
    cm.off('gutterClick',   onGutterClick)
    cm.off('change',        onChange)
    cm.off('viewportChange',onViewportChange)
    cm.off('fold',          onFold)
    cm.off('unfold',        onFold)
    cm.off('swapDoc',       updateInViewport)
  }
  if(val){
    cm.state.foldGutter=new State(parseOptions(val))
    updateInViewport(cm)
    cm.on('gutterClick',   onGutterClick)
    cm.on('change',        onChange)
    cm.on('viewportChange',onViewportChange)
    cm.on('fold',          onFold)
    cm.on('unfold',        onFold)
    cm.on('swapDoc',       updateInViewport)
  }
})
var Pos=CodeMirror.Pos
function State(x){this.options=x;this.from=this.to=0}
function parseOptions(o) {
  if(o===true)o={}
  if(o.gutter         ==null)o.gutter         ='CodeMirror-foldgutter'
  if(o.indicatorOpen  ==null)o.indicatorOpen  ='CodeMirror-foldgutter-open'
  if(o.indicatorFolded==null)o.indicatorFolded='CodeMirror-foldgutter-folded'
  if(o.indicatorCont  ==null)o.indicatorCont  ='CodeMirror-foldgutter-cont'
  if(o.indicatorEnd   ==null)o.indicatorEnd   ='CodeMirror-foldgutter-end'
  return o
}
function isFolded(cm,line){
  var m=cm.findMarksAt(Pos(line))
  for(var i=0;i<m.length;i++)if(m[i].__isFold&&m[i].find().from.line===line)return m[i]
}
function marker(spec){
  if(typeof spec==='string'){
    var elt=document.createElement('div');elt.className=spec+' CodeMirror-guttermarker-subtle';return elt
  }else{
    return spec.cloneNode(true)
  }
}
function updateFoldInfo(cm,a,b){ // a:from line, b:to line
  var o=cm.state.foldGutter.options,i=a, // i:current line
      mfs=cm.foldOption(o,'minFoldSize'),f=cm.foldOption(o,'rangeFinder'),ends=[]
  cm.eachLine(a,b,function(l){
    var m=null
    if(isFolded(cm,i)){
      m=marker(o.indicatorFolded)
    }else{
      var range=f&&f(cm,Pos(i,0))
      if(range&&range.to.line-range.from.line>=mfs){m=marker(o.indicatorOpen);ends.push(range.to.line)}
      else if(ends.indexOf(i)>=0){m=marker(o.indicatorEnd);ends=ends.filter(function(x){return x>i})}
      else if(ends.length){m=marker(o.indicatorCont)}
    }
    cm.setGutterMarker(l,o.gutter,m);++i
  })
}
function updateInViewport(cm){
  var vp=cm.getViewport(),h=cm.state.foldGutter
  if(h){cm.operation(function(){updateFoldInfo(cm,vp.from,vp.to)});h.from=vp.from;h.to=vp.to}
}
function onGutterClick(cm,l,gutter){ // l:line
  var h=cm.state.foldGutter;if(!h||gutter!==h.options.gutter)return
  var u=isFolded(cm,l);u?u.clear():cm.foldCode(Pos(l,0),h.options.rangeFinder)
}
function onChange(cm){
  var h=cm.state.foldGutter;if(!h)return
  h.from=h.to=0;clearTimeout(h.changeUpdate)
  h.changeUpdate=setTimeout(function(){updateInViewport(cm)},h.options.foldOnChangeTimeSpan||600)
}
function onViewportChange(cm){
  var h=cm.state.foldGutter;if(!h)return
  clearTimeout(h.changeUpdate)
  h.changeUpdate=setTimeout(function(){
    var vp=cm.getViewport()
    if(h.from===h.to||vp.from-h.to>20||h.from-vp.to>20){
      updateInViewport(cm)
    }else{
      cm.operation(function(){
        if(vp.from<h.from){updateFoldInfo(cm,vp.from,h.from);h.from=vp.from}
        if(vp.to  >h.to  ){updateFoldInfo(cm,h.to,vp.to);    h.to  =vp.to  }
      })
    }
  },h.options.updateViewportTimeSpan||400)
}
function onFold(cm,a){ // a:from line
  var h=cm.state.foldGutter;if(!h)return
  var l=a.line;if(h.from<=l&&l<h.to)updateFoldInfo(cm,l,l+1)
}
