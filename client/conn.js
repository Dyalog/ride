'use strict'
require('./jq-list');var IDE=require('./ide').IDE,prefs=require('./prefs'),esc=require('./util').esc
var $sel=$(),sel,$d // $sel:selected item(s), sel: .data('cn') of the selected item (only if it's unique), $d:dialog
var DFLT_NAME='[New Connection]',TMP_NAME='[Temporary Connection]',MIN_VER=[14,1] // minimum supported version
var proxyInfo={interpreters:[]}
function cmpVer(x,y){return x[0]-y[0]||x[1]-y[1]||0} // compare two versions of the form [major,minor]
function save(){prefs.favs($('#cn-favs>*').map(function(){var h=$(this).data('cn');return h.tmp?null:h}).toArray())}
function favText(x){return x.tmp?TMP_NAME:x.name||DFLT_NAME}
function favDOM(x){return $('<div><a href=# class=go>'+esc(favText(x))+'</a></div>').data('cn',x)}
function fmtKey(e){return[e.modKey?'Cmd-':'',e.ctrlKey?'Ctrl-':'',e.altKey?'Alt-':'',e.shiftKey?'Shift-':'',
                          CodeMirror.keyNames[e.which]||''].join('')}
function updateFormDetail(){$('#cn-detail>*').hide();$('#cn-'+$('#cn-type').val()).show()} // the part below "Type"
function updateExes(){
  var h=$('#cn-ssh')[0].checked?'':
    proxyInfo.interpreters
      .sort(function(a,b){
         return cmpVer(b.version,a.version)||+b.bits-+a.bits||(b.edition==='unicode')-(a.edition==='unicode')
      })
      .map(function(x){
        var s='v'+x.version.join('.')+', '+x.bits+'-bit, '+x.edition[0].toUpperCase()+x.edition.slice(1)
        var supported=cmpVer(x.version,MIN_VER)>=0;supported||(s+=' (unsupported)')
        return'<option value="'+esc(x.exe)+'"'+(supported?'':' disabled')+'>'+esc(s)
      }).join('')
  $('#cn-exes').html(h+'<option value="">Other...').val($('#cn-exe').val()).val()||$('#cn-exes').val('')
  $('#cn-exe').prop('readonly',!!$('#cn-exes').val())
}
module.exports=function(){
  $('#cn-page').show();document.title='RIDE - Connect'
  $('#cn-fav-cb').change(function(){
    var c=this.checked;c?delete sel.tmp:(sel.tmp=1);$sel.find('a').text(favText(sel))
    $('#cn-fav-name-wr').toggle(c);c&&$('#cn-fav-name').focus();save()
  })
  $('#cn-fav-name').prop('placeholder',DFLT_NAME).on('change keyup',function(e){
    if(sel.name!==this.value){sel.name=this.value;$sel.find('a').text(favText(sel));save()}
  })
  $('#cn-type').change(function(){sel.type=this.value;updateFormDetail();save()})
  updateFormDetail()
  $('#cn-ssh').change(function(){$('#cn-ssh-detail').toggle(this.checked);updateExes()})
  $('#cn-ssh-detail [name=user]').prop('placeholder',process.env.USER||'')
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
  $('#cn-ssl-cb').change(function(){$('#cn-ssl-detail').toggle(this.checked)})
  $('#cn-cert-cb').change(function(){$('#cn-cert').prop('disabled',!this.checked).val('')})
  $('#cn-subj-cb').change(function(){$('#cn-subj').prop('disabled',!this.checked).val('')})
                  .click(function(){this.checked&&$('#cn-subj').focus()})
  prefs.favs().forEach(function(x){$('#cn-favs').append(favDOM(x))})
  $('#cn-favs').list().sortable({cursor:'move',revert:true,axis:'y',stop:save})
    .on('click','.go',function(e){
      $('#conn-favs').list('select',$(this).parentsUntil('#conn-favs').last().index())
      setTimeout(function(){$('#cn-go').click()},1) // todo
    })
    .keydown(function(e){switch(fmtKey(e)){
      case'Enter' :$('#cn-go:visible').click();return!1
      case'Ctrl-N':$('#cn-new       ').click();return!1
      case'Delete':$('#cn-del       ').click();return!1
      case'Ctrl-D':$('#cn-clone     ').click();return!1
    }})
    .on('list-order-changed',save)
    .on('list-selection-changed',function(){
      $sel=$('#cn-favs .list-selection')
      var u=$sel.length===1 // is selection unique?
      $('#cn-clone').attr('disabled',!u);$('#cn-del').attr('disabled',!$sel.length);$('#cn-rhs').toggle(u)
      sel=u?$sel.data('cn'):null
      if(u){
        $('#cn-type').val(sel.type||'tcp');updateFormDetail();updateExes()
        $('#cn-fav-cb').prop('checked',!sel.tmp);$('#cn-fav-name').val(sel.name);$('#cn-fav-name-wr').toggle(!sel.tmp)
        $('#cn-rhs :text[name],#cn-rhs textarea[name]').each(function(){$(this).val(sel[this.name])})
        $('#cn-rhs :checkbox[name]').each(function(){$(this).prop('checked',+sel[this.name])})
        $('#cn-exes').val(sel.exe).val()||$('#cn-exes').val('') // use sel.exe if available, otherwise use "Other..."
        $('#cn-rhs :text').elastic()
        $('#cn-ssl-detail').toggle(!!sel.ssl)
        $('#cn-ssh-detail').toggle(!!sel.ssh)
        $('#cn-cert-cb').prop('checked',!!sel.cert);$('#cn-cert').prop('disabled',!sel.cert)
        $('#cn-subj-cb').prop('checked',!!sel.subj);$('#cn-subj').prop('disabled',!sel.subj)
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
    n&&$.confirm('Are you sure you want to delete the selected connection'+(n>1?'s':'')+'?','Confirmation',
      function(r){if(r){var i=$sel.eq(0).index();$sel.remove();$('#cn-favs').list('select',i,1);save()}})
  })
  $('#cn-go').click(go)
  $('#cn-lhs').resizable({handles:'e',resize:function(e,ui){$('#cn-rhs').css({left:ui.size.width+10})}})
  $('#cn-rhs :text').elastic()
  $('#cn-rhs :text[name],#cn-rhs textarea[name]')
    .on('keyup change',function(){var k=this.name,v=this.value;if(sel[k]!==v){sel[k]=v;save()}})
  $('#cn-rhs :checkbox[name]').change(function(){var k=this.name,v=+this.checked;if(sel[k]!==v){sel[k]=v;save()}})
  D.socket
    .on('*proxyInfo',function(x){proxyInfo=x;updateExes()})
    .on('*connected',function(x){if($d){$d.dialog('close');$d=null};new IDE().setHostAndPort(x.host,x.port)})
    .on('*spawned',function(x){D.lastSpawnedExe=x.exe})
    .on('*spawnedExited',function(x){$.alert(x.code!=null?'exited with code '+x.code:'received '+x.sig)})
    .on('*error',function(x){$d&&$d.dialog('close');$d=null;$.alert(x.msg,'Error')})
    .emit('*getProxyInfo')
  return{
    listen:function(port){port&&$listenPort.val(port);$listen.click()},
    connect:function(s){hp=parseFav(s);D.socket.emit('*connect',{host:hp.host,port:hp.port||4502})}
  }
}
function go(){
  $d&&$d.dialog('close')
  try{
    // validate host&port if present
    var $host=$('[name=host]:visible'),$port=$('[name=port]:visible')
    if($host.length&&!sel.host){$.alert('"host" is required','Error',function(){$host.select()});return}
    if($port.length&&sel.port&&(!/^\d*$/.test(sel.port)||+sel.port<1||+sel.port>0xffff)){
      $.alert('Invalid port','Error',function(){$port.select()});return
    }
    // validate rest of the form
    var t=$('#cn-type').val()
    if(t==='tcp'){
      $d=$('<div class=cn-dialog><div class=visual-distraction></div></div>')
        .dialog({modal:1,width:350,title:'Connecting...'})
      D.socket.emit('*connect',{host:sel.host,port:+sel.port||4502})
      // TODO: SSL
    }else if(t==='listen'){
      var port=sel.port||4502
      $d=$(
        '<div class=listen>'+
          '<div class=visual-distraction></div>'+
          'Please start the remote interpreter with'+
          '<div class=tt>RIDE_INIT=\'CONNECT:<i>host</i>:'+port+'\'</div>'+
          ' in its environment, so it connects here.'+
        '</div>'
      ).dialog({modal:1,width:450,title:'Waiting for connection...',
                buttons:{Cancel:function(){$d.dialog('close')}},
                close:function(){D.socket.emit('*listenCancel')}})
      D.socket.emit('*listen',{host:sel.host,port:port})
    }else if(t==='start'){
      var env={},a=$('#cn-env').val().split('\n'),m
      for(var i=0;i<a.length;i++){
        if(m=/^([a-z_]\w*)=(.*)$/i.exec(a[i])){
          env[m[1]]=m[2]
        }else if(!/^\s*$/.test(a[i])){
          $.alert('Invalid environment variables','Error',function(){$('#cn-env').focus()});return
        }
      }
      if(sel.ssh){
        var pw=$('#cn-ssh-pass').val()
        if(!pw){$.alert('"password" is required','Error',function(){$('#cn-ssh-pass').focus()});return}
        $d=$('<div class=cn-dialog><div class=visual-distraction></div></div>')
          .dialog({modal:1,width:350,title:'Connecting...'})
        D.socket.emit('*ssh',{host:sel.host,port:+sel.port||22,user:sel.user||process.env.USER,pass:pw,env:env})
      }else{
        D.socket.emit('*launch',{exe:sel.exe,env:env})
      }
    }else{
      $.alert('nyi')
    }
  }catch(e){
    $.alert(e,'Error')
  }
  return!1
}
