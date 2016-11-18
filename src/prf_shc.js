//Preferences > Shortcuts
;(function(){'use strict'

var q //DOM elements whose ids start with "shc_", keyed by the rest of the id
D.prf_tabs.shc={
  name:'Shortcuts',
  init:function(t){
    q=J.shc
    t.onmouseover=function(e){var u=e.target.closest('.shc_del');if(u)u.parentNode.className+=' shc_del_hvr'}
    t.onmouseout =function(e){var u=e.target.closest('.shc_del'),p=u&&u.parentNode
                              if(p)p.className=p.className.replace(/(^|\s+)shc_del_hvr($|\s+)/,' ')}
    t.onclick=function(e){
      var u=e.target.closest('.shc_del'),p=u&&u.parentNode //the [x] button next to a keystroke
      if(p){p.parentNode.removeChild(p);updDups();return!1}
      var u=e.target.closest('.shc_add'),p=u&&u.parentNode //the [+] button
      if(p){getKeystroke(u,function(k){k&&u.insertAdjacentHTML('beforebegin',keyHTML(k));updDups()});return!1}
      var u=e.target.closest('.shc_rst'),p=u&&u.parentNode //the [↶] button ("reset")
      if(p){
        var tr=u.closest('tr'),c=tr.dataset.code
        for(var i=0;i<D.cmds.length;i++)if(D.cmds[i][0]===c){
          var a=tr.getElementsByClassName('shc_key');for(var j=a.length-1;j>=0;j--)a[j].parentNode.removeChild(a[j])
          tr.querySelector('.shc_add').insertAdjacentHTML('beforebegin',D.cmds[i][2].map(keyHTML).join(''))
          updDups()
        }
        return!1
      }
    }
    q.rst_all.onclick=function(){loadFrom({});return!1}
    q.sc.onkeyup=q.sc.onchange=updSC
    q.sc_clr.onclick=function(){this.hidden=1;q.sc.value='';updSC();q.sc.focus();return!1} //[x] button to clear search
  },
  load:function(){loadFrom(D.prf.keys())},
  validate:function(){var a=q.tbl_wr.getElementsByClassName('shc_dup');if(a.length)return{msg:'Duplicate shortcuts',el:a[0]}},
  save:function(){
    var h={},cmds=D.cmds,a=q.tbl_wr.querySelectorAll('.shc_text')
    for(var i=0;i<a.length;i++){var c=a[i].closest('td').id.replace(/^shc_/,'');(h[c]=h[c]||[]).push(a[i].textContent)}
    for(var i=0;i<cmds.length;i++){var c=cmds[i][0],d=cmds[i][2].slice(0).sort() //d:defaults
                                   if(h[c]&&JSON.stringify(h[c].sort())===JSON.stringify(d))delete h[c]}
    var a=[''];for(var i=1;i<=12;i++){a.push(document.getElementById('shc_val_PF'+i).value)}
    D.prf.keys(h);D.prf.pfkeys(a)
  },
  activate:function(){q.sc.focus()}
}
function loadFrom(h){
  var html='<table>',cmds=D.cmds
  for(var i=0;i<cmds.length;i++){
    var x=cmds[i],c=x[0],s=x[1],d=x[2] //c:code,s:description,d:default
    html+='<tr data-code='+c+'>'+
      '<td class=shc_code>'+c+
      '<td>'+(s||('<input class=shc_val id=shc_val_'+c+'>'))+ //pfkeys show an <input> for the commands mapped to them
      '<td id=shc_'+c+'>'+(h[c]||d).map(keyHTML).join('')+'<button class=shc_add title="Add shortcut">+</button>'+
      '<td><button class=shc_rst title="Reset &quot;'+c+'&quot; to its defaults">↶</button>'
  }
  q.tbl_wr.innerHTML=html+'</table>';updDups();if(q.sc.value){q.sc.value='';updSC()}
  var a=D.prf.pfkeys();for(var i=1;i<=12;i++)document.getElementById('shc_val_PF'+i).value=a[i]
}
function updSC(){var a=q.tbl_wr.querySelectorAll('tr'),s=q.sc.value.toLowerCase(),empty=1;q.sc_clr.hidden=!s
                 for(var i=0;i<a.length;i++){
                   var h=a[i].textContent.toLowerCase().indexOf(s)<0&&!a[i].querySelectorAll('.shc_dup').length
                   empty&=a[i].hidden=h
                 }
                 q.no_res.hidden=!empty}
function keyHTML(x){return'<span class=shc_key><span class=shc_text>'+x+'</span>'+
                                              '<a href=# class=shc_del title="Remove shortcut">×</a></span> '}
function updKeys(x){var h=CM.keyMap.dyalog={fallthrough:'dyalogDefault'}
                    for(var i=0;i<D.cmds.length;i++){var c=D.cmds[i][0],d=D.cmds[i][2],ks=x[c]||d
                                                     for(var j=0;j<ks.length;j++)h[ks[j]]=c}}
D.prf.keys(updKeys);CM.keyMap.dyalog={fallthrough:'dyalogDefault'} //temporarily set keyMap.dyalog to something
setTimeout(function(){updKeys(D.prf.keys())},1) //wait until D.db is initialised in init.js, then set the real keymap
function updDups(){ //check for duplicates and make them show in red
  var a=q.tbl_wr.querySelectorAll('.shc_text'),h={} //h:maps keystrokes to jQuery objects
  for(var i=0;i<a.length;i++){var k=a[i].textContent
                              a[i].className=h[k]?(h[k].className='shc_text shc_dup'):'shc_text';h[k]=a[i]}
}
function getKeystroke(b,f){ //b:"+" button,f:callback
  var e=document.createElement('input'),r //r:result
  var upd=function(x){ //update displayed text for new keystroke as you hold down/release keys
    var kn=CM.keyNames[x.which]||'';if(!kn||kn==='Shift'||kn==='Ctrl'||kn==='Alt'||kn==='Cmd')kn=''
    e.value=(x.shiftKey&&(x.type!=='keyup'||x.which)?'Shift-':'')+
            (x.ctrlKey?'Ctrl-':'')+(x.altKey?'Alt-':'')+(x.metaKey?'Cmd-':'')+kn
    if(kn){r=e.value;e.blur()};x.preventDefault();x.stopPropagation();return!1
  }
  CM.on(e,'keyup',upd);CM.on(e,'keydown',upd)
  e.onblur=function(){e.parentNode.removeChild(e);f(r)}
  e.placeholder='Press keystroke...';b.parentNode.insertBefore(e,b);e.focus()
}

}())
