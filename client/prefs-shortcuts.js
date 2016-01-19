'use strict'
var prefs=require('./prefs'),
esc=require('./util').esc,
cmds=require('./cmds').cmds

this.name='Shortcuts'

var $sc // <input> for search
function keyHTML(k){
  return'<span class=shortcuts-shortcut><span class=shortcuts-text>'+k+'</span><a href=# class=shortcuts-del>×</a></span> '
}
this.init=function($e){
  $e.html(
    '<div>'+
      '<input id=shortcuts-search placeholder=Search>'+
      '<a id=shortcuts-search-clear href=# style=display:none title="Clear search">×</a>'+
    '</div>'+
    '<div id=shortcuts-table-wrapper>'+
      '<table>'+
        cmds.map(function(x){
          var c=x[0],s=x[1]
          return'<tr data-code='+c+'>'+
                  '<td>'+s+'<td class=shortcuts-code>'+c+
                  '<td id=shortcuts-'+c+'>'+
                  '<td><a href=# class=shortcuts-reset title=Reset>↶</a>'
        }).join('')+
      '</table>'+
    '</div>'+
    '<div id=shortcuts-no-results style=display:none>No results</div>'
  )
    .on('mouseover','.shortcuts-del',function(){$(this).parent().addClass('shortcuts-del-hover')})
    .on('mouseout','.shortcuts-del',function(){$(this).parent().removeClass('shortcuts-del-hover')})
    .on('click','.shortcuts-del',function(){$(this).parent().remove();updateDups();return!1})
    .on('click','.shortcuts-add',function(){
      var $b=$(this);getKeystroke(function(k){k&&$b.parent().append(keyHTML(k)).append($b);updateDups()});return!1
    })
    .on('click','.shortcuts-reset',function(){
      var $tr=$(this).closest('tr'),c=$tr.data('code')
      for(var i=0;i<cmds.length;i++)if(cmds[i][0]===c){
        $tr.find('.shortcuts-shortcut').remove()
        $tr.find('.shortcuts-add').parent().prepend(cmds[i][2].map(keyHTML).join(''))
        updateDups()
      }
    })
  $sc=$('#shortcuts-search').on('keyup change',function(){
    var q=this.value.toLowerCase(),found=0
    $('#shortcuts-search-clear').toggle(!!q)
    $('#shortcuts-table-wrapper tr').each(function(){
      var x;$(this).toggle(x=0<=$(this).text().toLowerCase().indexOf(q));found|=x
    })
    $('#shortcuts-no-results').toggle(!found)
  })
  $('#shortcuts-search-clear').click(function(){$(this).hide();$sc.val('').change().focus();return!1})
}
function getKeystroke(callback){
  var $d=$('<p><input class=shortcuts-input placeholder=...>').dialog({
    title:'New Shortcut',modal:1,buttons:{Cancel:function(){$d.dialog('close');callback()}}
  })
  $('input',$d)
    .focus(function(){$(this).addClass('shortcuts-input')})
    .blur(function(){$(this).removeClass('shortcuts-input')})
    .on('keypress keyup',function(e){
      var kn=CodeMirror.keyNames[e.which]||''
      if(kn==='Shift'||kn==='Ctrl'||kn==='Alt'){
        $(this).val((e.shiftKey?'Shift-':'')+(e.ctrlKey?'Ctrl-':'')+(e.altKey&&'Alt-'||''))
      }else{
        $d.dialog('close');callback(this.value)
      }
      return!1
    })
    .keydown(function(e){
      var kn=CodeMirror.keyNames[e.which]||''
      if(kn==='Shift'||kn==='Ctrl'||kn==='Alt')kn=''
      $(this).val((e.shiftKey?'Shift-':'')+(e.ctrlKey?'Ctrl-':'')+(e.altKey?'Alt-':'')+kn)
      return!1
    })
}
this.load=function(){
  var h=prefs.keys()
  for(var i=0;i<cmds.length;i++){
    var c=cmds[i][0],d=cmds[i][2]
    $('#shortcuts-'+c).html((h[c]||d).map(keyHTML).join('')).append('<a href=# class=shortcuts-add>+</a>')
  }
  updateDups();$sc.val()&&$sc.val('').change()
}
this.validate=function(){
  var $dups=$('#shortcuts-table-wrapper .shortcuts-dup')
  if($dups.length)return{msg:'There are duplicate shortcuts.',el:$dups[0]}
}
this.save=function(){
  var h={}
  for(var i=0;i<cmds.length;i++){
    var c=cmds[i][0],d=cmds[i][2]
    var a=$('#shortcuts-'+c+' .shortcuts-text').map(function(){return $(this).text()}).toArray()
    if(JSON.stringify(a)!==JSON.stringify(d))h[c]=a
  }
  prefs.keys(h)
}
this.activate=function(){$sc.focus()}

function updateKeys(x){
  var h=CodeMirror.keyMap.dyalog={fallthrough:'dyalogDefault'}
  for(var i=0;i<cmds.length;i++){var c=cmds[i][0],d=cmds[i][2],ks=x[c]||d;for(var j=0;j<ks.length;j++)h[ks[j]]=c}
}
prefs.keys(updateKeys)
updateKeys(prefs.keys())

function updateDups(){
  var h={},r=[] // h: maps keystrokes to DOM objects
  for(var i=0;i<cmds.length;i++){
    var c=cmds[i][0],d=cmds[i][2]
    r.push($('#shortcuts-'+c+' .shortcuts-text').each(function(){
      var k=$(this).text()
      if(h[k]){$(this).add(h[k]).addClass('shortcuts-dup')}else{$(this).removeClass('shortcuts-dup');h[k]=this}
    }))
  }
  return r
}
