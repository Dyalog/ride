;(function(){'use strict'

var wt //<input> element for Window Title
D.prf_tabs.push({
  name:'Title',id:'title',
  init:function($e){
    var e=$e[0]
    e.innerHTML=
      '<button id=title-rst class=rst><u>R</u>eset</button>'+
      '<label for=title-input>Window title:</label>'+
      '<input id=title-input>'+
      '<pre id=title-subs>'+
      '\n<a href=#>{WSID}</a>            workspace name'+
      '\n<a href=#>{HOST}</a>:<a href=#>{PORT}</a>     interpreter\'s TCP endpoint'+
      '\n<a href=#>{PID}</a>             PID of the interpreter process'+
      '\n<a href=#>{CHARS}</a>           Unicode or Classic'+
      '\n<a href=#>{BITS}</a>            64 or 32'+
      '\n<a href=#>{VER}</a>             interpreter version'+
      '\n  <a href=#>{VER_A}</a>           major'+
      '\n  <a href=#>{VER_B}</a>           minor'+
      '\n  <a href=#>{VER_C}</a>           svn revision'+
      '\n<a href=#>{RIDE_VER}</a>        RIDE version'+
      '\n  <a href=#>{RIDE_VER_A}</a>      major'+
      '\n  <a href=#>{RIDE_VER_B}</a>      minor'+
      '\n  <a href=#>{RIDE_VER_C}</a>      git commit number'+
      '</pre>'
    wt=document.getElementById('title-input')
    var subs=document.getElementById('title-subs')
    subs.onclick=function(x){$(wt).insert(x.target.textContent)}
    subs.querySelectorAll('a').forEach(function(x){x.title='Insert'})
    document.getElementById('title-rst').onclick=function(){wt.value=D.prf.title.getDefault()}
  },
  load:function(){wt.value=D.prf.title()},
  save:function(){D.prf.title(wt.value)}
})

}())
