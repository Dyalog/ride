'use strict'
var prefs=require('./prefs'),esc=require('./util').esc,cmds=require('./cmds').cmds
this.tabTitle='Shortcuts'
var $sc // <input> for search
function keyHTML(k){
  return'<span class=shc-key><span class=shc-text>'+k+'</span><a href=# class=shc-del>×</a></span> '
}
this.init=function($e){
  $e.html(
    '<div>'+
      '<input id=shc-search placeholder=Search>'+
      '<a id=shc-search-clear href=# style=display:none title="Clear search">×</a>'+
    '</div>'+
    '<div id=shc-tbl-wr>'+
      '<table>'+
        cmds.map(function(x){var c=x[0],s=x[1];return(
          '<tr data-code='+c+'>'+
            '<td>'+s+'<td class=shc-code>'+c+'<td id=shc-'+c+'><td><a href=# class=shc-rst title=Reset>↶</a>'
        )}).join('')+
      '</table>'+
    '</div>'+
    '<div id=shc-no-results style=display:none>No results</div>'
  )
    .on('mouseover','.shc-del',function(){$(this).parent().addClass   ('shc-del-hover')})
    .on('mouseout' ,'.shc-del',function(){$(this).parent().removeClass('shc-del-hover')})
    .on('click','.shc-del',function(){$(this).parent().remove();updateDups();return!1})
    .on('click','.shc-add',function(){
      var $b=$(this);getKeystroke(function(k){k&&$b.parent().append(keyHTML(k)).append($b);updateDups()});return!1
    })
    .on('click','.shc-rst',function(){
      var $tr=$(this).closest('tr'),c=$tr.data('code')
      for(var i=0;i<cmds.length;i++)if(cmds[i][0]===c){
        $tr.find('.shc-key').remove()
        $tr.find('.shc-add').parent().prepend(cmds[i][2].map(keyHTML).join(''))
        updateDups()
      }
    })
  $sc=$('#shc-search').on('keyup change',function(){
    var q=this.value.toLowerCase(),found=0
    $('#shc-search-clear').toggle(!!q)
    $('#shc-tbl-wr tr').each(function(){
      var x;$(this).toggle(x=0<=$(this).text().toLowerCase().indexOf(q));found|=x
    })
    $('#shc-no-results').toggle(!found)
  })
  $('#shc-search-clear').click(function(){$(this).hide();$sc.val('').change().focus();return!1})
}
function getKeystroke(callback){
  var $d=$('<p><input class=shc-input placeholder=...>')
    .dialog({title:'New Shortcut',modal:1,buttons:{Cancel:function(){$d.dialog('close');callback()}}})
  $('input',$d)
    .focus(function(){$(this).addClass   ('shc-input')})
    .blur (function(){$(this).removeClass('shc-input')})
    .on('keypress keyup',function(e){
      var kn=CodeMirror.keyNames[e.which]||''
      if(kn!=='Shift'&&kn!=='Ctrl'&&kn!=='Alt'){$d.dialog('close');callback(this.value);return!1}
      $(this).val((e.shiftKey?'Shift-':'')+(e.ctrlKey?'Ctrl-':'')+(e.altKey&&'Alt-'||''));return!1
    })
    .keydown(function(e){
      var kn=CodeMirror.keyNames[e.which]||''
      if(kn==='Shift'||kn==='Ctrl'||kn==='Alt')kn=''
      $(this).val((e.shiftKey?'Shift-':'')+(e.ctrlKey?'Ctrl-':'')+(e.altKey?'Alt-':'')+kn);return!1
    })
}
this.load=function(){
  var h=prefs.keys()
  for(var i=0;i<cmds.length;i++){
    var c=cmds[i][0],d=cmds[i][2]
    $('#shc-'+c).html((h[c]||d).map(keyHTML).join('')).append('<a href=# class=shc-add>+</a>')
  }
  updateDups();$sc.val()&&$sc.val('').change()
}
this.validate=function(){var $d=$('#shc-tbl-wr .shc-dup');if($d.length)return{msg:'Duplicate shortcuts',el:$d[0]}}
this.save=function(){
  var h={}
  for(var i=0;i<cmds.length;i++){
    var c=cmds[i][0],d=cmds[i][2],a=$('#shc-'+c+' .shc-text').map(function(){return $(this).text()}).toArray()
    if(JSON.stringify(a)!==JSON.stringify(d))h[c]=a
  }
  prefs.keys(h)
}
this.activate=function(){$sc.focus()}
function updateKeys(x){
  var h=CodeMirror.keyMap.dyalog={fallthrough:'dyalogDefault'}
  for(var i=0;i<cmds.length;i++){var c=cmds[i][0],d=cmds[i][2],ks=x[c]||d;for(var j=0;j<ks.length;j++)h[ks[j]]=c}
}
prefs.keys(updateKeys);updateKeys(prefs.keys())
function updateDups(){var h={} // h: maps keystrokes to jQuery objects
  $('#shc-tbl-wr .shc-text').each(function(){var $t=$(this),k=$t.text();$t.add(h[k]).toggleClass('shc-dup',!!h[k]);h[k]=$t})
}
