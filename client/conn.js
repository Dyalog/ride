'use strict'
require('./jq-list');var IDE=require('./ide').IDE,prefs=require('./prefs'),esc=require('./util').esc
var $sel=$(),sel,$d // sel:selected item, sel: .data('cn') of the selected item (only if it's unique), $d:dialog
var MIN_VER=[14,1] // minimum supported version
function cmpVer(x,y){return x[0]-y[0]||x[1]-y[1]||0} // compare two versions of the form [major,minor]
function save(){prefs.favs($('#cn-favs>*').map(function(){var h=$(this).data('cn');return h.tmp?null:h}).toArray())}
function favText(x){return x.tmp?'temp':x.name||'new'}
function favDOM(x){return $('<div><a href=# class=go>'+esc(favText(x))+'</a></div>').data('cn',x)}
function updateFormDetail(){$('#cn-detail>*').hide();$('#cn-'+$('#cn-type').val()).show()} // the part below "Type"
function fmtKey(e){return[e.modKey?'Cmd-':'',e.ctrlKey?'Ctrl-':'',e.altKey?'Alt-':'',e.shiftKey?'Shift-':'',
                          CodeMirror.keyNames[e.which]||''].join('')}
module.exports=function(){
  $('#cn-page').show();document.title='RIDE - Connect'
  $('#cn-fav-cb').change(function(){
    var c=this.checked;c?delete sel.tmp:(sel.tmp=1);$sel.find('a').text(favText(sel))
    $('#cn-fav-name-wr').toggle(c);c&&$('#cn-fav-name').focus();save()
  })
  $('#cn-fav-name').on('change keyup',function(e){
    if(sel.name!==this.value){sel.name=this.value;$sel.find('a').text(favText(sel));save()}
  })
  $('#cn-type').change(function(){sel.type=this.value;updateFormDetail();save()})
  updateFormDetail()
  $('#cn-ssh [name=user]').val(process.env.USER||'')
  $('#cn-exe').on('change keyup',function(){$('#cn-exes').val()||prefs.otherExe($(this).val())})
  $('#cn-exes').change(function(){
    var v=$(this).val(),$e=$('#cn-exe').val(v||prefs.otherExe()).prop('readonly',!!v).change();v||$e.focus()
    prefs.selectedExe(v) // todo: do we still need this pref?
  })
  $('#cn-env-add').on('click','a',function(e){
    var t=$(this).text(), e=$('#cn-env')[0], k=t.split('=')[0], s=e.value, m=RegExp('^'+k+'=(.*)$','m').exec(s)
    if(m){e.setSelectionRange(m.index+k.length+1,m.index+m[0].length)}
    else{e.value=s=s.replace(/([^\n])$/,'$1\n')+t+'\n';e.setSelectionRange(s.length-t.length+k.length,s.length-1)}
    return!1
  })
  prefs.favs().forEach(function(x){$('#cn-favs').append(favDOM(x))})
  $('#cn-favs').list().sortable({cursor:'move',revert:true,axis:'y',stop:save})
    .on('click','.go',function(e){$('#cn-go').click()}) // todo: setTimeout?
    .keydown(function(e){switch(fmtKey(e)){
      case'Enter':$('#cn-go:visible').click();return!1
      case'Insert':case'Ctrl-N':$('#cn-new').click();return!1
      case'Delete':$('#cn-del').click();return!1
      case'Ctrl-D':$('#cn-clone').click();return!1
    }})
    .on('list-selection-changed',function(){
      $sel=$('#cn-favs .list-selection')
      var u=$sel.length===1 // is selection unique?
      $('#cn-clone').attr('disabled',!u);$('#cn-del').attr('disabled',!$sel.length);$('#cn-rhs').toggle(u)
      sel=u?$sel.data('cn'):null
      if(u){
        $('#cn-type').val(sel.type||'tcp');updateFormDetail()
        $('#cn-fav-cb').prop('checked',!sel.tmp);$('#cn-fav-name').val(sel.name);$('#cn-fav-name-wr').toggle(!sel.tmp)
        $('#cn-rhs [name]').each(function(){$(this).val(sel[this.name])})
        $('#cn-exes').val(sel.exe).val()||$('#cn-exes').val('') // use sel.exe if available, otherwise use "Other..."
        $('#cn-rhs :text').elastic()
      }
    })
    .list('select',0).find('a').eq(0).focus()
  $('#cn-new').click(function(){
    var $e=favDOM({});$('#cn-favs').append($e).list('select',$e.index());$('#cn-fav-name').focus()
  })
  $('#cn-clone').click(function(){
    if(sel){favDOM($.extend({},sel)).insertBefore($sel);$sel.find('a').focus();save();$('#cn-fav-name').focus()}
  })
  $('#cn-del').click(function(){
    var n=$sel.length
    if(n&&confirm('Are you sure you want to delete the selected connection'+(n>1?'s':'')+'?')){
      var $a=$('#cn-favs .list-selection'),i=$a.eq(0).index();$a.remove();$('#cn-favs').list('select',i,1);save()
    }
  })
  $('#cn-go').click(go)
  $('#cn-lhs').resizable({handles:'e',resize:function(e,ui){$('#cn-rhs').css({left:ui.size.width+10})}})
  $('#cn-rhs :text').elastic()
    .on('keyup change',function(){if(sel[this.name]!==this.value){sel[this.name]=this.value;save()}})
  D.socket
    .on('*proxyInfo',function(x){
      $('#cn-exes').html(
        x.interpreters
         .sort(function(a,b){
            return cmpVer(b.version,a.version)||+b.bits-+a.bits||(b.edition==='unicode')-(a.edition==='unicode')
         })
         .map(function(x){
           var s='v'+x.version.join('.')+', '+x.bits+'-bit, '+x.edition[0].toUpperCase()+x.edition.slice(1)
           var supported=cmpVer(x.version,MIN_VER)>=0;supported||(s+=' (unsupported)')
           return'<option value="'+esc(x.exe)+'"'+(supported?'':' disabled')+'>'+esc(s)
         }).join('')+'<option value="">Other...'
      ).val($('#cn-exe').val()).val()||$('#cn-exes').val('')
    })
    .on('*connected',function(x){if($d){$d.dialog('close');$d=null};new IDE().setHostAndPort(x.host,x.port)})
    .on('*connectError',function(x){if($d){$d.dialog('close');$d=null};$.alert(x.err,'Error')})
    .on('*spawned',function(x){D.lastSpawnedExe=x.exe})
    .on('*spawnedError',function(x){alert(x.message)})
    .on('*spawnedExited',function(x){alert(x.code!=null?'exited with code '+x.code:'received '+x.signal)})
    .on('*listenError',function(x){if($d){$d.dialog('close');$d=null};$.alert(x.err,'Error')})
    .emit('*getProxyInfo')
  return{
    listen:function(port){port&&$listenPort.val(port);$listen.click()},
    connect:function(s){hp=parseFav(s);D.socket.emit('*connect',{host:hp.host,port:hp.port||4502})}
  }
}
function go(){
  var h={};$('#cn-rhs [name]:visible').each(function(){h[this.name]=this.value}) // form data as a hash
  var t=$('#cn-type').val()
  $d&&$d.dialog('close')
  try{
    if(t==='spawn'){
      D.socket.emit('*spawn',{exe:$('#cn-exe').val()})
    }else if(t==='tcp'){
      $d=$('<div class=cn-dialog><div class=visual-distraction></div></div>')
        .dialog({modal:1,width:350,title:'Connecting...',buttons:{Cancel:function(){$(this).dialog('close')}}})
      D.socket.emit('*connect',{host:sel.host,port:+sel.port})
    }else if(t==='listen'){
      $d=$(
        '<div class=listen>'+
          '<div class=visual-distraction></div>'+
          'Please start the remote interpreter with'+
          '<div class=tt>RIDE_INIT=\'CONNECT:host:port\'</div>'+
          ' in its environment, so it connects here.'+
        '</div>'
      ).dialog({modal:1,width:450,title:'Waiting for connection...',
                buttons:{Cancel:function(){$d.dialog('close')}},
                close:function(){D.socket.emit('*listenCancel')}})
      D.socket.emit('*listen',{host:sel.host,port:+sel.port})
    }else{
      alert('nyi')
    }
  }catch(e){
    alert(e)
  }
  return!1
}
