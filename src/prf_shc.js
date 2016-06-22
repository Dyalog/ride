;(function(){'use strict'

var q={} //DOM elements
D.prf_tabs.push({
  name:'Shortcuts',id:'shc',
  init:function(t){
    t.innerHTML='<div><input id=shc_sc placeholder=Search>'+
                     '<a id=shc_sc_clr href=# hidden title="Clear search">×</a></div>'+
                '<div id=shc_tbl_wr></div>'+
                '<div id=shc_no_res hidden>No results</div>'
    var a=t.querySelectorAll('[id^="shc_"]')
    for(var i=0;i<a.length;i++)q[a[i].id.replace(/^shc_/,'').replace(/-/g,'_')]=a[i]
    t.onmouseover=function(e){var u=e.target.closest('.shc_del');if(u)u.parentNode.className+=' shc_del_hvr'}
    t.onmouseout =function(e){var u=e.target.closest('.shc_del'),p=u&&u.parentNode
                              if(p)p.className=p.className.replace(/(^|\s+)shc_del_hvr($|\s+)/,' ')}
    t.onclick=function(e){
      var u=e.target.closest('.shc_del'),p=u&&u.parentNode
      if(p){p.parentNode.removeChild(p);updDups();return!1}
      var u=e.target.closest('.shc_add'),p=u&&u.parentNode
      if(p){getKeystroke(function(k){k&&u.insertAdjacentHTML('beforebegin',keyHTML(k));updDups()});return!1}
      var u=e.target.closest('.shc_rst'),p=u&&u.parentNode
      if(p){
        var tr=u.closest('tr'),c=$(tr).data('code')
        for(var i=0;i<D.cmds.length;i++)if(D.cmds[i][0]===c){
          var a=tr.getElementsByClassName('shc_key');for(var j=a.length-1;j>=0;j--)a[j].parentNode.removeChild(a[j])
          tr.querySelector('.shc_add').insertAdjacentHTML('beforebegin',D.cmds[i][2].map(keyHTML).join(''))
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
              '<td>'+s+'<td class=shc_code>'+c+
              '<td id=shc_'+c+'>'+(h[c]||d).map(keyHTML).join('')+'<a href=# class=shc_add>+</a>'+
              '<td><a href=# class=shc_rst title=Reset>↶</a>'
    }
    document.getElementById('shc_tbl_wr').innerHTML=html+'</table>'
    updDups();if(q.sc.value){q.sc.value='';$(q.sc).change()}
  },
  validate:function(){var a=q.tbl_wr.getElementsByClassName('shc_dup');if(a.length)return{msg:'Duplicate shortcuts',el:a[0]}},
  save:function(){
    var h={}
    for(var i=0;i<D.cmds.length;i++){
      var c=D.cmds[i][0],d=D.cmds[i][2],a=$('#shc_'+c+' .shc_text').map(function(){return $(this).text()}).toArray()
      if(JSON.stringify(a)!==JSON.stringify(d))h[c]=a
    }
    D.prf.keys(h)
  },
  activate:function(){q.sc.focus()}
})
function keyHTML(k){return'<span class=shc_key><span class=shc_text>'+k+'</span><a href=# class=shc_del>×</a></span> '}
function updKeys(x){
  var h=CodeMirror.keyMap.dyalog={fallthrough:'dyalogDefault'}
  for(var i=0;i<D.cmds.length;i++){var c=D.cmds[i][0],d=D.cmds[i][2],ks=x[c]||d;for(var j=0;j<ks.length;j++)h[ks[j]]=c}
}
D.prf.keys(updKeys);updKeys(D.prf.keys())
function updDups(){var h={} // h: maps keystrokes to jQuery objects
  $('#shc_tbl_wr .shc_text').each(function(){var $t=$(this),k=$t.text();$t.add(h[k]).toggleClass('shc_dup',!!h[k]);h[k]=$t})
}
function getKeystroke(callback){
  var $d=$('<p><input class=shc_inp placeholder=...>')
    .dialog({title:'New Shortcut',modal:1,buttons:{Cancel:function(){$d.dialog('close');callback()}}})
  $('input',$d)
    .focus(function(){$(this).addClass   ('shc_inp')})
    .blur (function(){$(this).removeClass('shc_inp')})
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
