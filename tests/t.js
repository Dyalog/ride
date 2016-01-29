// to run the tests: export RIDE_JS=/path/to/t.js and start RIDE
var fs=require('fs'),CM=CodeMirror

;(function(){ // place windows near the right edge of the screen, try to avoid overlap
  var gui=require('nw.gui'),m=gui.Window.get(),t=m.showDevTools() // m:main window, t:developer tools window
  var a=gui.Screen.screens[0].work_area,x=a.width-m.width,dy=52
  t.moveTo(x,m.height+dy);t.resizeTo(m.width,a.height-m.height-dy);m.moveTo(x,0);m.focus()
}())

var nFailures=0
function fail(x){nFailures++;console.error(x)}
function assert(x,y){(typeof x==='string'?eval(x):x)||fail(y||'assertion failed')}
$.expr[':'].t=function(e,i,m){ // custom selector, finds innermost elements by exact text, e.g. $(':t(OK)').click()
  // https://code.google.com/p/aost/wiki/CustomJQuerySelectorInTellurium#:te_text
  function norm(x){return x.trim().replace(/:$/,'')}
  var q=norm(m[3]),r=(e.offsetWidth>0||e.offsetHeight>0)&&norm(e.innerText)===q
  // none of e's child elements must have the exact same text content
  if(r)for(var c=e.firstElementChild;c;c=c.nextElementSibling)if(norm(c.innerText)===q){r=0;break}
  return!!r
}
$.fn.assertUnique=function(){
  assert(this.length,'selector returned an empty result')
  assert(this.length<=1,'selector returned a non-unique result')
  return this
}
$.fn.dereferenceLabels=function(){
  if(!this.length||this[0].tagName.toLowerCase()!=='label')return this
  var id=this.attr('for');return(id?$('#'+id):this.find(':input')).assertUnique()
}
function testcase(x){}
function find(x){return $(':t('+JSON.stringify(x)+')').assertUnique().dereferenceLabels()}
function click    (x){find(x).click    ()}
function mousedown(x){find(x).mousedown()}
function mouseup  (x){find(x).mouseup  ()}
function mouseover(x){find(x).mouseover()}
function mouseout (x){find(x).mouseout ()}
function fillIn(x,y){find(x).val(y).change()}
function sessionLastLines(n){return D.ide.wins[0].cm.getValue().split('\n').slice(-n)}
function inSession(s){inWin(0,s)}
function inEditor(s){
  var ids=[];for(var id in D.ide.wins)+id&&ids.push(+id)
  ids.length===1?inWin(ids[0],s):fail((ids.length?'more than one':'no')+' editor is open')
}
function inWin(id,s){
  var w=D.ide.wins[id]
  s.replace(/<(.+?)>|(.)/g,function(_,x,y){
    y?w.insert(y):CM.commands[x]?w.cm.execCommand(x):w.cm.triggerOnKeyDown(fakeEvent(x))
  })
}
function fakeEvent(s){
  var e={type:'keydown',ctrlKey:false,shiftKey:false,altKey:false,preventDefault:nop,stopPropagation:nop}
  var h={C:'ctrlKey',A:'altKey',S:'shiftKey'}
  var s1=s.replace(/(\w+)-/g,function(_,type){e[h[type]||type.toLowerCase()+'Key']=true;return''})
  for(var k in CM.keyNames)if(CM.keyNames[k]===s1){e.keyCode=k;break}
  e.keyCode||fail('Unknown key:'+JSON.stringify(s))
  return e
}
function nop(){}

var tUniversalDelay=0,tIndex=0,tLines=[]
function tStep(){
  var tLine=tLines[tIndex++],tDone,tMatch
  try{
    console.info('['+tIndex+']',tLine)
    if(tMatch=/^\s*(\d+)\s*$/.exec(tLine)){setTimeout(tStep,+tMatch[1]);tDone=1}
    else{eval(tLine.replace(/^ *([a-z]+) +(.+)$/i,function(_,x,y){return x+'('+JSON.stringify(y)+')'}))}
  }catch(tException){
    fail(tException)
  }
  if(tIndex>=tLines.length){var n=nFailures;console.info(!n?'brilliant':n>1?n+' failures':'1 failure')}
  else if(!tDone)setTimeout(tStep,tUniversalDelay)
}
function tRun(){
  tLines=fs.readFileSync(process.env.RIDE_JS.replace(/\.js$/,'.txt'),'utf8').split('\n')
  tIndex=0;focus();tStep()
}
$(tRun)
