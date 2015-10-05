'use strict'
var IDE=require('./ide').IDE,about=require('./about'),prefs=require('./prefs'),esc=require('./util').esc

var DEFAULT_PORT=prefs.favs.getDefault()[0].port
if(typeof DEFAULT_PORT!=='number')throw Error('cannot determine DEFAULT_PORT')

function fmtFav(x){
  var s=x.port==null||+x.port===DEFAULT_PORT?x.host:/:/.test(x.host)?'['+x.host+':'+x.port+']':x.host+':'+x.port
  return x.name?x.name+' ('+s+')':s
}
function storeFavs(){
  prefs.favs($('#fav-list option').map(function(){
    var x=parseFav($(this).text());$(this).is(':selected')&&(x.sel=true);return x
  }).toArray())
}
function parseFav(s){
  var x={},m
  if(m=/^(.*) \((.*)\)$/.exec(s)){x.name=m[1];s=m[2]}      // eliminate the name from a named connection
  if(m=/^\[(.*)\]:(.*)$/.exec(s)){x.name=m[1];x.port=m[2]} // IPv6 [host]:port
  else if(/:.*:/.test(s)){x.host=s}                        // IPv6 host without port
  else{var hp=s.split(':');x.host=hp[0];x.port=hp[1]}      // IPv4 host:port or just host
  x.port=+(x.port||DEFAULT_PORT);return x
}

var proxyInfo={} // the proxy sends information about itself when the front-end connects to it

function cmpVersions(x,y){return x[0]-y[0]||x[1]-y[1]||0}
function isSupported(v){return cmpVersions(v,[14,1])>=0}

module.exports=function(opts){
  document.title='RIDE - Connect'
  $('body').html(
    '<fieldset id=connect-fieldset>'+
      '<legend>Connect to an interpreter</legend>'+
      '<div id=fav-buttons>'+
        '<a id=about href=#>About</a>'+
        '<a href=# id=fav-new accessKey=n><u>N</u>ew</a>'+
        '<a href=# id=fav-delete>Delete</a>'+
      '</div>'+
      '<select multiple id=fav-list></select>'+
      '<table id=fav-details>'+
        '<tr><td><u>A</u>ddress:'+
            '<td><input accessKey=a id=fav-host class=text-field value=""> :'+
                '<input id=fav-port class=text-field size=5 value='+DEFAULT_PORT+'>'+
        '<tr><td>Na<u>m</u>e:<td><input accessKey=m id=fav-name class=text-field>'+
        '<tr><td><td>'+
          '<a href=# id=fav-connect accessKey=o>C<u>o</u>nnect</a>'+
          '<a href=# id=fav-save    accessKey=s><u>S</u>ave</a>'+
          '<a href=# id=fav-cancel  accessKey=c><u>C</u>ancel</a>'+
      '</table>'+
    '</fieldset>'+
    '<fieldset id=spawnSection>'+
      '<legend>Launch an interpreter</legend>'+
      '<p><select id=spawn-select></select>'+
      '<p>Path: <span id=spawn-exe-w><input id=spawn-exe class=text-field></span>'+
      '<p><a href=# id=spawn>Launch</a>'+
      '<p id=spawn-status>'+
    '</fieldset>'+
    '<fieldset>'+
      '<legend>Listen for connections from interpreter </legend>'+
      '<p>Address: <input id=listen-host class=text-field value="::"> :'+
         '<input id=listen-port class=text-field value='+DEFAULT_PORT+' size=5>'+
      '<p><a href=# id=listen accessKey=l><u>L</u>isten</a>'+
    '</fieldset>'
  )
  var $connect    =$('#fav-connect' ),$host      =$('#fav-host'   ),
      $new        =$('#fav-new'     ),$port      =$('#fav-port'   ),
      $delete     =$('#fav-delete'  ),$name      =$('#fav-name'   ),
      $list       =$('#fav-list'    ),$save      =$('#fav-save'   ),
      $about      =$('#about'       ),$cancel    =$('#fav-cancel' ),
      $spawn      =$('#spawn'       ),$listen    =$('#listen'     ),
      $spawnStatus=$('#spawn-status'),$listenHost=$('#listen-host'),
      $listenPort =$('#listen-port' ),$listenDlg,$connectDlg
  function enableSpawnAndListen(b){
    $('#spawn,#listen').button(b?'enable':'disable')
    $('#spawn-select,#spawn-exe,#listen-host,#listen-port').attr('disabled',!b)
  }
  $connect.add($about).add($new).add($delete).add($save).add($cancel).add($spawn).add($listen).button()
  $list.on('dblclick','option',function(e){$connect.click();return false})
    .keydown(function(e){if(!e.shiftKey&&!e.ctrlKey&&!e.altKey)switch(CodeMirror.keyNames[e.which]){
      case'Enter' :$connect.click();return false
      case'Insert':$new    .click();return false
      case'Delete':$delete .click();return false
    }})
  $connect.click(function(){
    var host=$host.val(),port=+$port.val()
    if(!/^[a-z0-9\.\-:]+$/i.test(host)){$.alert('Invalid host','Error',function(){$host.focus()})}
    else if(port<1||0xffff<port){$.alert('Invalid port','Error',function(){$port.focus()})}
    else{
      $connectDlg=$('<div class=connect-dialog><div class=visual-distraction></div></div>')
        .dialog({modal:1,width:350,title:'Connecting...',buttons:{Cancel:function(){$(this).dialog('close');return false}}})
      D.socket.emit('*connect',{host:host,port:port})
    }
    return false
  })
  $new.click(function(){
    $('option',$list).attr('selected',false);$list.append('<option selected>127.0.0.1')
    $host.select();storeFavs();$list.change();return false
  })
  $delete.click(function(){$list.find(':selected').remove();storeFavs();$list.change();return false})
  $list.on('change',function(){ // triggered after selection changes
    storeFavs();var $s=$list.find(':selected'),n=$s.length
    $name.add($host).add($port).attr('disabled',n!==1)
    $connect.add($save).add($cancel).button('option','disabled',n!==1)
    $delete.button('option','disabled',!n)
    $save.add($cancel).button('disable')
    if(n===1){var x=parseFav($s.text());$name.val(x.name);$host.val(x.host);$port.val(x.port)}
    else{$name.add($host).add($port).val('')}
  })
  $host.add($port).add($name)
    .keydown(function(e){if(e.which===13&&!e.shiftKey&&!e.ctrlKey&&!e.altKey){$save.click();return false}})
    .on('keyup change',function(){
      var s0=$list.find(':selected').text(),s1=fmtFav({host:$host.val(),port:$port.val(),name:$name.val()})
      $save.add($cancel).button(s0===s1?'disable':'enable')
    })
  $save.click(function(){
    $list.focus().find(':selected').text(fmtFav({host:$host.val(),port:$port.val(),name:$name.val()}));storeFavs()
    $save.add($cancel).button('disable');return false
  })
  $cancel.click(function(){
    var x=parseFav($list.find(':selected').text());$host.val(x.host);$port.val(x.port);$name.val(x.name)
    $save.add($cancel).button('disable');return false
  })
  $spawn.click(function(){
    enableSpawnAndListen(false);$spawnStatus.text('Launching...')
    D.socket.emit('*spawn',{exe:$('#spawn-exe').val()});return false
  })
  $('#spawn-select').change(function(){
    var v=$(this).val();$('#spawn-exe').val(v||prefs.otherExe()).prop('readonly',!!v);v||$('#spawn-exe').focus()
    prefs.selectedExe(v);$('#spawn').button(v||prefs.otherExe()?'enable':'disable')
  })
  $('#spawn-exe').on('change keyup',function(){
    $('#spawn-select').val()||prefs.otherExe($(this).val())
    $('#spawn').button($('#spawn-select').val()||prefs.otherExe()?'enable':'disable')
  })
  $listen.click(function(){
    var host=$listenHost.val(),port=+$listenPort.val()
    if(port<1||0xffff<port){
      $.alert('Invalid port','Error',function(){$listenPort.focus();return false})
    }else{
      D.socket.emit('*listen',{host:host,port:port})
      $listenDlg=$(
        '<div class=listen>'+
          '<div class=visual-distraction></div>'+
          'Please start the remote interpreter with<br>'+
            ((proxyInfo.ipAddresses||[]).length?proxyInfo.ipAddresses||[]:['host']).map(function(h){
              return'<div class=tt>RIDE_INIT=\'CONNECT:'+h+':'+port+'\'</div>' // todo: ipv6?
            }).join('or')+
          ' in its environment, so it connects here.'+
        '</div>'
      ).dialog({modal:1,width:450,title:'Waiting for connection...',close:function(){D.socket.emit('*listenCancel')},
                buttons:{Cancel:function(){$(this).dialog('close');return false}}})
    }
    return false
  })
  $list.sortable({cursor:'move',revert:true,tolerance:'pointer',containment:'parent',axis:'y',update:storeFavs})
  $about.click(function(){about.showDialog();return false})

  $list.html(prefs.favs().map(function(x){return'<option '+(x.sel?'selected':'')+'>'+esc(fmtFav(x))}).join(''))
  if(!$list.find(':selected').length){$list.focus().find('option').eq(0).attr('selected',true);$list.change()}

  D.socket
    .on('*proxyInfo',function(x){
      proxyInfo=x
      $('#spawn-select').html(
        x.interpreters.sort(function(a,b){
          return cmpVersions(b.version,a.version)||+b.bits-+a.bits||(b.edition==='unicode')-(a.edition==='unicode')
        }).map(function(x){
          var s='v'+x.version.join('.')+', '+x.bits+'-bit, '+x.edition[0].toUpperCase()+x.edition.slice(1)
          var supported=isSupported(x.version);supported||(s+=' (unsupported)')
          return'<option value="'+esc(x.exe)+'"'+(supported?'':' disabled')+'>'+esc(s)
        }).join('')+'<option value="">Other...'
      ).val(prefs.selectedExe()).change()
    })
    .on('*connected',function(x){
      if($listenDlg ){$listenDlg .dialog('close');$listenDlg =null}
      if($connectDlg){$connectDlg.dialog('close');$connectDlg=null}
      new IDE().setHostAndPort(x.host,x.port)
    })
    .on('*connectError',function(x){
      if($connectDlg){$connectDlg.dialog('close');$connectDlg=null}
      $.alert(x.err,'Error')
    })
    .on('*spawned',function(x){$spawnStatus.text('PID: '+x.pid);enableSpawnAndListen(false);D.lastSpawnedExe=x.exe})
    .on('*spawnedError',function(x){$spawnStatus.text(x.message);enableSpawnAndListen(true)})
    .on('*spawnedExited',function(x){
      $spawnStatus.text(x.code!==null?'exited with code '+x.code:'received '+x.signal);enableSpawnAndListen(true)
    })
    .on('*listenError',function(x){
      if($listenDlg){$listenDlg.dialog('close');$listenDlg=null}
      $.alert(x.err,'Error');enableSpawnAndListen(true)
    })
    .emit('*getProxyInfo')
  $('#fav-list').resizable({handles:'s,e'})
  return{
    listen:function(port){$listenHost.val('::');port&&$listenPort.val(port);$listen.click()},
    connect:function(s){hp=parseFav(s);D.socket.emit('*connect',{host:hp.host,port:hp.port||DEFAULT_PORT})}
  }
}
