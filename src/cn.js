//Connect page (loaded only when running in Electron)
;(function(){'use strict'

let $sel=$(),sel,$d //$sel:selected item(s), sel: .data('cn') of the selected item (only if it's unique), $d:dialog
,interpreters=[], interpretersSSH=[]
const fs=node_require('fs'),cp=node_require('child_process')
,esc=D.util.esc,user=D.el?process.env.USER:'',q={} //q:mapping between ids and jQuery objects
,ANON='[anonymous]',TEMP='[temp]',MIN_V=[15,0]
,KV=/^([a-z_]\w*)=(.*)$/i,WS=/^\s*$/ //regexes for parsing env vars
,cmpVer=(x,y)=>x[0]-y[0]||x[1]-y[1]||0 //compare two versions of the form [major,minor]
,save=_=>{D.prf.favs($('>*',q.favs).map((_,x)=>{var h=$(x).data('cn');return h.tmp?null:h}).toArray())} //[sic]
,favText=x=>x.tmp?TEMP:x.name||ANON
,favDOM=x=>$(`<div><span class=name>${esc(favText(x))}</span><button class=go>Go</button>`).data('cn',x)
,fmtKey=e=>[e.metaKey?'Cmd-':'',e.ctrlKey?'Ctrl-':'',e.altKey?'Alt-':'',e.shiftKey?'Shift-':'',
            CodeMirror.keyNames[e.which]||''].join('')
,updFormDetail=_=>{$('>*',q.detail).hide();q[q.type.val()].show()} //the part below "Type"
,updExes=_=>{
  q.fetch.toggle(q.ssh[0].checked)
  var h=(q.ssh[0].checked?interpretersSSH:interpreters)
    .sort((x,y)=>cmpVer(y.ver,x.ver)||+y.bits-+x.bits||(y.edition==='unicode')-(x.edition==='unicode'))
    .map(x=>{
      let s='v'+x.ver.join('.')+', '+x.bits+'-bit, '+x.edition[0].toUpperCase()+x.edition.slice(1)
      const supported=cmpVer(x.ver,MIN_V)>=0;supported||(s+=' (unsupported)')
      return`<option value="${esc(x.exe)}"${supported?'':' disabled'}>${esc(s)}`
    }).join('')
  q.exes.html(h+'<option value="">Other...').val(q.exe.val()).val()||q.exes.val('')
  q.exe.prop('readonly',!!q.exes.val())
}
,validate=_=>{
  var $host=$('[name=host]:visible'),$port=$('[name=port]:visible')
  if($host.length&&!sel.host){$.alert('"host" is required','Error',_=>{$host.select()});return}
  if($port.length&&sel.port&&(!/^\d*$/.test(sel.port)||+sel.port<1||+sel.port>0xffff))
      {$.alert('Invalid port','Error',_=>{$port.select()});return}
  if(q.type.val()==='start'){
    var a=q.env.val().split('\n')
    for(var i=0;i<a.length;i++)if(!KV.test(a[i])&&!WS.test(a[i]))
      {$.alert('Invalid environment variables','Error',_=>{q.env.focus()});return}
    if(sel.ssh){
      var pw=q.ssh_pass.val(),kf=q.ssh_key.val()
      if(!pw&&!kf){$.alert('Either "Password" or "Key file" is required','Error',_=>{q.ssh_pass.focus()});return}
      if(pw&&kf){$.alert('Only one of "Password" and "Key file" must be present','Error',_=>{q.ssh_pass.focus()});return}
    }
  }
  return 1
}
,go=_=>{
  $d&&$d.dialog('close');if(!validate())return!1
  try{
    switch(q.type.val()){
      case'connect':
        $d=$('<div class=cn-dialog><div class=visual-distraction></div></div>')
          .dialog({modal:1,width:350,title:'Connecting...'})
        D.skt.emit('*connect',{host:sel.host,port:+sel.port||4502,ssl:sel.ssl,cert:sel.cert,subj:sel.subj});break
      case'listen':
        var port=sel.port||4502
        $d=$(
          '<div class=listen>'+
            '<div class=visual-distraction></div>'+
            'Please start the remote interpreter with'+
            '<div class=tt>RIDE_INIT=\'CONNECT:<i>host</i>:'+port+'\'</div>'+
            ' in its environment, so it connects here.'+
          '</div>'
        ).dialog({modal:1,width:450,title:'Waiting for connection...',
                  buttons:[{html:'<u>C</u>ancel',click:_=>{$d.dialog('close')}}],
                  close:_=>{D.skt.emit('*listenCancel')}})
        D.skt.emit('*listen',{port});break
      case'start':
        var env={},a=q.env.val().split('\n'),m
        for(var i=0;i<a.length;i++)if(m=KV.exec(a[i]))env[m[1]]=m[2]
        if(sel.ssh){
          var pw=q.ssh_pass.val(),kf=q.ssh_key.val()
          $d=$('<div class=cn-dialog><div class=visual-distraction></div></div>')
            .dialog({modal:1,width:350,title:'Connecting...'})
          D.skt.emit('*ssh',{host:sel.host,port:+sel.port||22,user:sel.user||user,pass:pw,key:kf,env})
        }else{
          D.skt.emit('*launch',{exe:sel.exe,env})
        }
        break
      default:$.alert('nyi')
    }
  }catch(e){$.alert(e,'Error')}
  return!1
}
,ls=x=>fs.readdirSync(x)
,parseVer=x=>x.split('.').map(y=>+y)
,sil=f=>x=>{try{f(x)}catch(_){}} //exception silencer
D.cn=_=>{
  document.title='RIDE - Connect'
  $('#cn').show().splitter()
    .keyup(x=>{if(D.el&&x.which===123&&!x.ctrlKey&&!x.shiftKey&&!x.altKey&&!x.metaKey)
                 {D.elw.webContents.toggleDevTools();return!1}})
    .find('[id^=cn-]').each((_,x)=>{q[x.id.replace(/^cn-/,'').replace(/-/g,'_')]=$(x)})
  q.fav_cb.change(_=>{var c=q.fav_cb[0].checked;c?delete sel.tmp:(sel.tmp=1);$sel.find('.name').text(favText(sel))
                      q.fav_name_wr.toggle(c);c&&q.fav_name.focus();save()})
  q.fav_name.prop('placeholder',ANON).on('change keyup',_=>{
    var u=sel.name,v=q.fav_name.val()
    if(u!==v){v?(sel.name=v):delete sel.name;$sel.find('.name').text(favText(sel));save()}
  })
  q.type.change(_=>{sel.type=q.type.val();updFormDetail();save()})
  updFormDetail()
  q.ssh.change(_=>{q.ssh_detail.toggle(q.ssh[0].checked);updExes()})
  q.ssh_detail.find('[name=user]').prop('placeholder',user)
  q.fetch.click(_=>{
    if(!validate())return
    var pw=q.ssh_pass.val(),kf=q.ssh_key.val();q.fetch[0].disabled=1
    D.skt.emit('*sshFetchListOfInterpreters',{host:sel.host,port:+sel.port||22,user:sel.user||user,pass:pw,key:kf})
  })
  q.exe.on('change keyup',_=>{q.exes.val()||D.prf.otherExe(q.exe.val())})
  q.exes.change(_=>{
    var v=$(q.exes).val(),$e=q.exe.val(v||D.prf.otherExe()).prop('readonly',!!v).change();v||$e.focus()
    D.prf.selectedExe(v) // todo: do we still need this pref?
  })
  q.env_add.on('click','a',function(e){
    var t=$(this).text(), e=q.env[0], k=t.split('=')[0], s=e.value, m=RegExp('^'+k+'=(.*)$','m').exec(s)
    if(m){e.setSelectionRange(m.index+k.length+1,m.index+m[0].length)}
    else{e.value=s=s.replace(/([^\n])$/,'$1\n')+t+'\n';$(e).change()
         e.setSelectionRange(s.length-t.length+k.length,s.length-1)}
    return!1
  })
  q.ssl_cb.change(_=>{q.ssl_detail.toggle(q.ssl_cb[0].checked)})
  q.cert_cb.change(_=>{q.cert.add(q.cert_dots).prop('disabled',!q.cert_cb[0].checked).val('');q.cert.elastic()})
  q.subj_cb.change(_=>{q.subj.prop('disabled',!q.subj_cb[0].checked).val('')})
           .click(_=>{q.subj_cb[0].checked&&q.subj.focus()})
  q.cert_dots.click(_=>{q.cert_file.click()})
  q.cert_file.change(_=>{q.cert.val(q.cert_file.val()).elastic().change()})
  q.ssh_key_dots.click(_=>{q.ssh_key_file.click()})
  q.ssh_key_file.change(_=>{q.ssh_key.val(q.ssh_key_file.val()).change()})
  D.prf.favs().forEach(x=>{q.favs.append(favDOM(x))})
  q.favs.list().sortable({cursor:'move',revert:true,axis:'y',stop:save})
    .on('click','.go',function(e){q.favs.list('select',$(this).parentsUntil(q.favs).last().index());q.go.click()})
    .keydown(x=>{switch(fmtKey(x)){case'Enter' :q.go.filter(':visible').click();return!1
                                   case'Ctrl-N':q.neu  .click();return!1
                                   case'Delete':q.del  .click();return!1
                                   case'Ctrl-D':q.clone.click();return!1}})
    .on('list-order-changed',save)
    .on('list-selection-changed',_=>{
      $sel=$('.list-selection',q.favs)
      var u=$sel.length===1 //is selection unique?
      q.clone.attr('disabled',!u);q.del.attr('disabled',!$sel.length);q.rhs.toggle(u)
      sel=u?$sel.data('cn'):null
      if(u){
        q.type.val(sel.type||'connect');updFormDetail();updExes()
        q.fav_cb.prop('checked',!sel.tmp);q.fav_name.val(sel.name);q.fav_name_wr.toggle(!sel.tmp)
        $(':text[name],textarea[name]',q.rhs).each((_,x)=>{$(x).val(sel[x.name])})
        $(':checkbox[name]',q.rhs).each((_,x)=>{x.checked=!!+sel[x.name]})
        q.exes.val(sel.exe).val()||q.exes.val('') // use sel.exe if available, otherwise use "Other..."
        $(':text',q.rhs).elastic()
        q.ssl_detail.toggle(!!sel.ssl);q.ssh_detail.toggle(!!sel.ssh)
        q.cert_cb.prop('checked',!!sel.cert);q.cert.add(q.cert_dots).prop('disabled',!sel.cert)
        q.subj_cb.prop('checked',!!sel.subj);q.subj.prop('disabled',!sel.subj)
      }
    })
    .list('select',0).find('a').eq(0).focus()
  q.neu.click(_=>{var $e=favDOM({});q.favs.append($e).list('select',$e.index());q.fav_name.focus()})
  q.clone.click(_=>{if(sel){favDOM($.extend({},sel)).insertBefore($sel);$('a',$sel).focus();save();q.fav_name.focus()}})
  q.del.click(_=>{
    var n=$sel.length
    n&&$.confirm('Are you sure you want to delete\nthe selected configuration'+(n>1?'s':'')+'?','Confirmation',
                 x=>{if(x){var i=$sel.eq(0).index();$sel.remove();q.favs.list('select',i,1);save()}})
  })
  q.about.click(_=>{D.abt()})
  q.go.click(go)
  $(':text',q.rhs).elastic()
  $(':text[name],textarea[name]',q.rhs).change(function(){var k=this.name,v=this.value;v?(sel[k]=v):delete sel[k];save()})
  $(':checkbox[name]',q.rhs).change(function(){this.checked?(sel[this.name]=1):delete sel[this.name];save()})
  var handlers={
    '*connected'(x){if($d){$d.dialog('close');$d=0};new D.IDE().setHostAndPort(x.host,x.port)},
    '*spawned'(x){D.lastSpawnedExe=x.exe},
    '*spawnedExited'(x){$.alert(x.code!=null?'exited with code '+x.code:'received '+x.sig)},
    '*error'(x){$d&&$d.dialog('close');$d=0;$.alert(x.msg,'Error');q.fetch[0].disabled=0},
    '*sshInterpreters'(x){interpretersSSH=x.interpreters;updExes();q.fetch[0].disabled=0}
  }
  D.skt.recv=(x,y)=>{handlers[x](y)}

  //collect information about installed interpreters
  interpreters=[]
  try{
    if(/^win/.test(process.platform)){
      const s=cp.execSync('reg query "HKEY_CURRENT_USER\\Software\\Dyalog" /s /v localdyalogdir',{timeout:2000})
      let b,v,u,m //b:bits,v:version,u:edition,m:match object
      e||s.split('\r\n').forEach(x=>{if(x){
        if(m=/^HK.*\\Dyalog APL\/W(-64)? (\d+\.\d+)( Unicode)?$/i.exec(x)){
          b=m[1]?64:32;v=m[2];u=m[3]?'unicode':'classic'
        }else if(v&&(m=/^ *localdyalogdir +REG_SZ +(\S.*)$/i.exec(x))){
          interpreters.push({exe:m[1]+'\\dyalog.exe',ver:parseVer(v),bits:b,edition:u})
        }else if(!/^\s*$/.test(x)){
          b=v=u=null
        }
      }})
    }else if(process.platform==='darwin'){
      const a='/Applications'
      ls(a).forEach(x=>{const m=/^Dyalog-(\d+\.\d+)\.app$/.exec(x), exe=`${a}/${x}/Contents/Resources/Dyalog/mapl`
                        m&&fs.existsSync(exe)&&interpreters.push({exe,ver:parseVer(m[1]),bits:64,edition:'unicode'})})
    }else{
      const a='/opt/mdyalog'
      ls(a).forEach(sil(v=>{if(/^\d+\.\d+/.test(v))
        ls(`${a}/${v}`).forEach(sil(b=>{if(b==='32'||b==='64')
          ls(`${a}/${v}/${b}`).forEach(sil(u=>{if(u==='unicode'||u==='classic'){
            const exe=`${a}/${v}/${b}/${u}/mapl`
            fs.existsSync(exe)&&interpreters.push({exe,ver:parseVer(v),bits:+b,edition:u})}}))}))}))
    }
  }catch(e){console.error(e)}
  updExes()
}

}())
