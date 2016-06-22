;(function(){'use strict'

var wt //<input> element for Window Title
D.prf_tabs.push({
  name:'Title',id:'title',
  init:function(t){
    t.innerHTML=
      '<button id=title_rst class=rst><u>R</u>eset</button>'+
      '<label for=title_inp>Window title:</label><input id=title_inp>'+
      '<pre id=title_subs>'+
      '\n<a>{WSID}</a>            workspace name'+
      '\n<a>{HOST}</a>:<a href=#>{PORT}</a>     interpreter\'s TCP endpoint'+
      '\n<a>{PID}</a>             PID of the interpreter process'+
      '\n<a>{CHARS}</a>           Unicode or Classic'+
      '\n<a>{BITS}</a>            64 or 32'+
      '\n<a>{VER}</a>             interpreter version'+
      '\n  <a>{VER_A}</a>           major'+
      '\n  <a>{VER_B}</a>           minor'+
      '\n  <a>{VER_C}</a>           svn revision'+
      '\n<a>{RIDE_VER}</a>        RIDE version'+
      '\n  <a>{RIDE_VER_A}</a>      major'+
      '\n  <a>{RIDE_VER_B}</a>      minor'+
      '\n  <a>{RIDE_VER_C}</a>      git commit number'+
      '</pre>'
    wt=document.getElementById('title_inp')
    var subs=document.getElementById('title_subs')
    subs.onclick=function(x){x.target.nodeName==='A'&&$(wt).insert(x.target.textContent)}
    var a=subs.querySelectorAll('a');for(var i=0;i<a.length;i++){a[i].href='#';a[i].title='Insert'}
    document.getElementById('title_rst').onclick=function(){wt.value=D.prf.title.getDefault();return!1}
  },
  load:function(){wt.value=D.prf.title()},
  save:function(){D.prf.title(wt.value)}
})

}())
