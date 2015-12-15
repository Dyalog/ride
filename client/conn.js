'use strict'
require('./jq-list')
var IDE=require('./ide').IDE,prefs=require('./prefs'),esc=require('./util').esc
function cmpVersions(x,y){return x[0]-y[0]||x[1]-y[1]||0}
function isSupported(v){return cmpVersions(v,[14,1])>=0}
var $sel=$(),sel // sel:selected item, sel: .data('cn') of the selected item (only if it's unique)
function saveFavs(){prefs.favs($('#cn-favs>*').map(function(){return $(this).data('cn')}).toArray())}
function favText(x){return x.tmp?'temp':x.name||'new'}
function renderFav(x){return $('<div><a href=# class=go>'+esc(favText(x))+'</a></div>').data('cn',x)}
function updateFormDetail(){$('#cn-detail>*').hide();$('#cn-'+$('#cn-type').val()).show()}
var $d // dialog
module.exports=function(){
  $('#cn-page').show();document.title='RIDE - Connect'
  $('#cn-fav-cb').change(function(){
    var c=this.checked;c?delete sel.tmp:(sel.tmp=1);$sel.find('a').text(favText(sel))
    $('#cn-fav-name-wr').toggle(c);c&&$('#cn-fav-name').focus()
  })
  $('#cn-fav-name').on('change keyup',function(e){
    if(sel.name!==this.value){sel.name=this.value;$sel.find('a').text(favText(sel));saveFavs()}
  })
  $('#cn-type').change(function(){sel.type=this.value;updateFormDetail();saveFavs()})
  updateFormDetail()
  $('#cn-ssh [name=user]').val(process.env.USER||'')
  $('#cn-exe').on('change keyup',function(){$('#cn-exes').val()||prefs.otherExe($(this).val())})
  $('#cn-exes').change(function(){
    var v=$(this).val(),$e=$('#cn-exe').val(v||prefs.otherExe()).prop('readonly',!!v);v||$e.focus();prefs.selectedExe(v)
  })
  prefs.favs().forEach(function(x){$('#cn-favs').append(renderFav(x))})
  $('#cn-favs').list().sortable({cursor:'move',revert:true,axis:'y',stop:saveFavs})
    .on('click','.go',function(e){$('#cn-go').click()}) // todo: setTimeout?
    .keydown(function(e){
      var k=[e.modKey?'Cmd-':'',e.ctrlKey?'Ctrl-':'',e.altKey?'Alt-':'',e.shiftKey?'Shift-':'',
             CodeMirror.keyNames[e.which]||''].join('')
      switch(k){
        case'Enter':$('#cn-go:visible').click();return!1
        case'Insert':case'Ctrl-N':$('#cn-new').click();return!1
        case'Delete':$('#cn-del').click();return!1
        case'Ctrl-D':$('#cn-clone').click();return!1
      }
    })
    .on('list-selection-changed',function(){
      $sel=$('#cn-favs .list-selection')
      var u=$sel.length===1 // is selection unique?
      $('#cn-clone').attr('disabled',!u);$('#cn-del').attr('disabled',!$sel.length);$('#cn-rhs').toggle(u)
      sel=u?$sel.data('cn'):null
      if(u){
        $('#cn-type').val(sel.type||'tcp');updateFormDetail()
        $('#cn-fav-cb').prop('checked',!sel.tmp);$('#cn-fav-name').val(sel.name);$('#cn-fav-name-wr').toggle(!sel.tmp)
        $('#cn-rhs [name]').each(function(){$(this).val(sel[this.name])})
      }
    })
    .list('select',0).find('a').eq(0).focus()
  $('#cn-new').click(function(){
    var $e=renderFav({});$('#cn-favs').append($e).list('select',$e.index());$('#cn-fav-name').focus()
  })
  $('#cn-clone').click(function(){
    renderFav($.extend({},sel)).insertBefore($sel);$sel.find('a').focus();saveFavs();$('#cn-fav-name').focus()
  })
  $('#cn-del').click(function(){
    $('#cn-favs .list-selection').remove();$('#cn-favs').list('select',0,1);$('#cn-favs a').eq(0).focus();saveFavs()
  })
  $('#cn-go').click(go)
  $('#cn-lhs').resizable({handles:'e',resize:function(e,ui){$('#cn-rhs').css({left:ui.size.width+10})}})
  $('#cn-rhs :text').elastic()
  D.socket
    .on('*proxyInfo',function(x){
      $('#cn-exes').html(
        x.interpreters.sort(function(a,b){
          return cmpVersions(b.version,a.version)||+b.bits-+a.bits||(b.edition==='unicode')-(a.edition==='unicode')
        }).map(function(x){
          var s='v'+x.version.join('.')+', '+x.bits+'-bit, '+x.edition[0].toUpperCase()+x.edition.slice(1)
          var supported=isSupported(x.version);supported||(s+=' (unsupported)')
          return'<option value="'+esc(x.exe)+'"'+(supported?'':' disabled')+'>'+esc(s)
        }).join('')+'<option>Other...'
      ).val(prefs.selectedExe()).change()
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
  var h={};$('[name]:visible').each(function(){h[this.name]=this.value}) // form data as a hash
  var t=$('#cn-type').val()
  $d&&$d.dialog('close')
  try{
    if(t==='tcp'){
      $d=$('<div class=cn-dialog><div class=visual-distraction></div></div>')
        .dialog({modal:1,width:350,title:'Connecting...',buttons:{Cancel:function(){$(this).dialog('close')}}})
      D.socket.emit('*connect',{host:sel.host,port:+sel.port})
    }else if(t==='spawn'){
      D.socket.emit('*spawn',{exe:$('#cn-exe').val()})
    }else if(t==='listen'){
      D.socket.emit('*listen',{host:h.host,port:h.port})
      $d=$(
        '<div class=listen>'+
          '<div class=visual-distraction></div>'+
          'Please start the remote interpreter with'+
          '<div class=tt>RIDE_INIT=\'CONNECT:host:port\'</div>'+
          ' in its environment, so it connects here.'+
        '</div>'
      ).dialog({modal:1,width:450,title:'Waiting for connection...',close:function(){D.socket.emit('*listenCancel')},
                buttons:{Cancel:function(){$d.dialog('close')}}})
    }else{
      alert('nyi')
    }
  }catch(e){
    alert(e)
  }
  return!1
}
