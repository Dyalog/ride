D.modules.prf_title=function(require){'use strict'

var prf=require('./prf')
var wt // <input> element for Window Title
this.tabTitle='Title'
this.init=function($e){
  var e=$e[0]
  e.innerHTML=
    '<button class=rst><u>R</u>eset</button>'+
    '<label for=title-input>Window title:</label>'+
    '<input id=title-input>'+
    '<pre>'+
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
  $e.on('click','pre a',function(e){$(wt).insert($(e.target).text())})
  $('pre a',e).attr('title','Insert')
  $('.rst',e).click(function(){wt.value=prf.title.getDefault()})
}
this.load=function(){wt.value=prf.title()}
this.save=function(){prf.title(wt.value)}

}
