;(function(){'use strict'

var q={} //DOM elements
D.prf_tabs.push({
  name:'Shortcuts',id:'shc',
  init:function($e){
    var t=$e[0]
    t.innerHTML='<div><input id=shc-sc placeholder=Search>'+
                     '<a id=shc-sc-clr href=# hidden title="Clear search">×</a></div>'+
                '<div id=shc-tbl-wr></div>'+
                '<div id=shc-no-res hidden>No results</div>'
    var a=t.querySelectorAll('[id^="shc-"]')
    for(var i=0;i<a.length;i++)q[a[i].id.replace(/^shc-/,'').replace(/-/g,'_')]=a[i]
    t.onmouseover=function(e){var u=e.target.closest('.shc-del');if(u)u.parentNode.className+=' shc-del-hover'}
    t.onmouseout =function(e){var u=e.target.closest('.shc-del'),p=u&&u.parentNode
                              if(p)p.className=p.className.replace(/(^|\s+)shc-del-hover($|\s+)/,' ')}
    t.onclick=function(e){
      var u=e.target.closest('.shc-del'),p=u&&u.parentNode
      if(p){p.parentNode.removeChild(p);updDups()return!1}
      var u=e.target.closest('.shc-add'),p=u&&u.parentNode
      if(p){getKeystroke(function(k){k&&u.insertAdjacentHTML('beforebegin',keyHTML(k));updDups()});return!1}
      var u=e.target.closest('.shc-rst'),p=u&&u.parentNode
      if(p){
        var tr=u.closest('tr'),c=$(tr).data('code')
        for(var i=0;i<D.cmds.length;i++)if(D.cmds[i][0]===c){
          var a=tr.getElementsByClassName('shc-key');for(var j=a.length-1;j>=0;j--)a[j].parentNode.removeChild(a[j])
          tr.getElementsByClassName('shc-add')[0].parentNode
            .insertAdjacentHTML('beforebegin',D.cmds[i][2].map(keyHTML).join(''))
          updDups()
        }
        return!1
      }
    }
    q.sc.onkeyup=q.sc.onchange=function(){
      var a=q.tbl_wr.querySelectorAll('tr'),s=this.value.toLowerCase(),empty=1;q.sc_clr.hidden=!s
      for(var i=0;i<a.length;i++)empty&=a[i].hidden=a[i].textContent.toLowerCase().indexOf(s)<0
      q.no_res.hidden=!empty
    }
    q.sc_clr.onclick=function(){this.hidden=1;q.sc.value='';$(q.sc).change();q.sc.focus();return!1}
  },
  load:function(){
    var h=D.prf.keys(),html='<table>',cmds=D.cmds
    for(var i=0;i<cmds.length;i++){
      var x=cmds[i],c=x[0],s=x[1],d=x[2] //c:code,s:description,d:default
      html+='<tr data-code='+c+'>'+
              '<td>'+s+'<td class=shc-code>'+c+
              '<td id=shc-'+c+'>'+((h[c]||d).map(keyHTML).join(''))+'<a href=# class=shc-add>+</a>'+
              '<td><a href=# class=shc-rst title=Reset>↶</a>'
    }
    document.getElementById('shc-tbl-wr').innerHTML=html+'</table>'
    updDups();if(q.sc.value){q.sc.value='';$(q.sc).change()}
  },
  validate:function(){var a=q.tbl_wr.getElementsByClassName('shc-dup');if(a.length)return{msg:'Duplicate shortcuts',el:a[0]}},
  save:function(){
    var h={}
    for(var i=0;i<D.cmds.length;i++){
      var c=D.cmds[i][0],d=D.cmds[i][2],a=$('#shc-'+c+' .shc-text').map(function(){return $(this).text()}).toArray()
      if(JSON.stringify(a)!==JSON.stringify(d))h[c]=a
    }
    D.prf.keys(h)
  },
  activate:function(){q.sc.focus()}
})
function keyHTML(k){return'<span class=shc-key><span class=shc-text>'+k+'</span><a href=# class=shc-del>×</a></span> '}
function updKeys(x){
  var h=CodeMirror.keyMap.dyalog={fallthrough:'dyalogDefault'}
  for(var i=0;i<D.cmds.length;i++){var c=D.cmds[i][0],d=D.cmds[i][2],ks=x[c]||d;for(var j=0;j<ks.length;j++)h[ks[j]]=c}
}
D.prf.keys(updKeys);updKeys(D.prf.keys())
function updDups(){var h={} // h: maps keystrokes to jQuery objects
  $('#shc-tbl-wr .shc-text').each(function(){var $t=$(this),k=$t.text();$t.add(h[k]).toggleClass('shc-dup',!!h[k]);h[k]=$t})
}
function getKeystroke(callback){
  var $d=$('<p><input class=shc-input placeholder=...>')
    .dialog({title:'New Shortcut',modal:1,buttons:{Cancel:function(){$d.dialog('close');callback()}}})
  $('input',$d)
    .focus(function(){$(this).addClass   ('shc-input')})
    .blur (function(){$(this).removeClass('shc-input')})
    .on('keypress keyup',function(e){
      var kn=CodeMirror.keyNames[e.which]||''
      if(kn!=='Shift'&&kn!=='Ctrl'&&kn!=='Alt'&&kn!=='Cmd'){$d.dialog('close');callback(this.value);return!1}
      $(this).val((e.shiftKey?'Shift-':'')+(e.ctrlKey?'Ctrl-':'')+(e.altKey&&'Alt-'||'')+(e.metaKey&&'Cmd-'||''));return!1
    })
    .keydown(function(e){
      var kn=CodeMirror.keyNames[e.which]||''
      if(kn==='Shift'||kn==='Ctrl'||kn==='Alt'||kn==='Cmd')kn=''
      $(this).val((e.shiftKey?'Shift-':'')+(e.ctrlKey?'Ctrl-':'')+(e.altKey?'Alt-':'')+(e.metaKey?'Cmd-':'')+kn);return!1
    })
}

}())
