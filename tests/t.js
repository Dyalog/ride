// to run the tests: export DYALOG_IDE_JS=/path/to/t.js and start RIDE
var fs=require('fs')
require('nw.gui').Window.get().showDevTools()
function fail(x){console.error(x)}
$.expr[':'].t=function(e,i,m){ // custom selector, finds innermost elements by exact text, e.g. $(':t(OK)').click()
  // https://code.google.com/p/aost/wiki/CustomJQuerySelectorInTellurium#:te_text
  var r=(e.offsetWidth>0||e.offsetHeight>0)&&e.textContent===m[3]
  // none of e's child elements must have the exact same text content
  if(r)for(var c=e.firstElementChild;c;c=c.nextElementSibling)if(c.textContent===m[3]){r=0;break}
  return!!r
}
$.fn.only=function(){
  if(!this.length){console.info(this);fail('selector returned an empty result')}
  if(this.length>1){console.info(this);fail('selector returned a non-unique result')}
  return this
}
function find(x){return(x.constructor===$?x:$(x[0]==='$'?x.slice(1):':t("'+x+'")')).only()}
function click    (x){find(x).click    ()}
function mousedown(x){find(x).mousedown()}
function mouseup  (x){find(x).mouseup  ()}
function mouseover(x){find(x).mouseover()}
function mouseout (x){find(x).mouseout ()}
function assert(x,y){console.assert(x,y)}
function lastSessionLines(n){return D.ide.wins[0].cm.getValue().split('\n').slice(-n)}

var tUniversalDelay=200,tIndex=0,tLines=[]
function tStep(){
  var tLine=tLines[tIndex++],tDone
  try{
    console.info('['+tIndex+']',tLine)
    if(/^\d+$/.test(tLine)){setTimeout(tStep,+tLine);tDone=1}
    else{eval(tLine.replace(/^([a-z]+) +(.+)$/i,function(_,x,y){return x+'('+JSON.stringify(y)+')'}))}
  }catch(tException){
    fail(tException)
  }
  tDone||tIndex>=tLines.length||setTimeout(tStep,tUniversalDelay)
}
$(D.test=function(){
  tLines=fs.readFileSync(process.env.DYALOG_IDE_JS.replace(/\.js$/,'.txt'),'utf8').split('\n');tIndex=0;tStep()
})
