//Connect page (loaded only when running in Electron)
;(function(){'use strict'

let $sel=$(),sel,$d //$sel:selected item(s), sel: .data('cn') of the selected item (only if it's unique), $d:dialog
,interpreters=[],interpretersSSH=[]
const fs=node_require('fs'),cp=node_require('child_process')
,esc=D.util.esc,user=D.el?process.env.USER:'',q={} //q:DOM elements
,ANON='[anonymous]',TEMP='[temp]',MIN_V=[15,0],KV=/^([a-z_]\w*)=(.*)$/i,WS=/^\s*$/ //KV:regexes for parsing env vars
,cmpVer=(x,y)=>x[0]-y[0]||x[1]-y[1]||0 //compare two versions of the form [major,minor]
,save=_=>{D.prf.favs($('>*',q.favs).map((_,x)=>{const h=$(x).data('cn');return h.tmp?null:h}).toArray())} //[sic]
,favText=x=>x.tmp?TEMP:x.name||ANON
,favDOM=x=>$(`<div><span class=name>${esc(favText(x))}</span><button class=go>Go</button>`).data('cn',x)
,fmtKey=x=>[x.metaKey?'Cmd-':'',x.ctrlKey?'Ctrl-':'',x.altKey?'Alt-':'',x.shiftKey?'Shift-':'',
            CodeMirror.keyNames[x.which]||''].join('')
,updFormDtl=_=>{var a=q.dtl.children;for(var i=0;i<a.length;i++)a[i].hidden=1
                   q[q.type.value].hidden=0} //the part below "Type"
,updExes=_=>{
  q.fetch.hidden=!q.ssh.checked
  const h=(q.ssh.checked?interpretersSSH:interpreters)
    .sort((x,y)=>cmpVer(y.ver,x.ver)||+y.bits-+x.bits||(y.edition==='unicode')-(x.edition==='unicode'))
    .map(x=>{
      let s='v'+x.ver.join('.')+', '+x.bits+'-bit, '+x.edition[0].toUpperCase()+x.edition.slice(1)
      const supported=cmpVer(x.ver,MIN_V)>=0;supported||(s+=' (unsupported)')
      return`<option value="${esc(x.exe)}"${supported?'':' disabled'}>${esc(s)}`
    }).join('')
  q.exes.innerHTML=h+'<option value="">Other...';q.exes.value=q.exe.value;q.exes.value||(q.exes.value='')
  q.exe.readOnly=!!q.exes.value
}
,validate=_=>{
  const $host=$('[name=host]:visible'),$port=$('[name=port]:visible')
  if($host.length&&!sel.host){$.err('"host" is required',_=>{$host.select()});return}
  if($port.length&&sel.port&&(!/^\d*$/.test(sel.port)||+sel.port<1||+sel.port>0xffff))
      {$.err('Invalid port',_=>{$port.select()});return}
  if(q.type.value==='start'){
    const a=q.env.value.split('\n')
    for(let i=0;i<a.length;i++)if(!KV.test(a[i])&&!WS.test(a[i]))
      {$.err('Invalid environment variables',_=>{q.env.focus()});return}
    if(sel.ssh){
      const pw=q.ssh_pass.value,kf=q.ssh_key.value
      if(!pw&&!kf){$.err('Either "Password" or "Key file" is required',_=>{q.ssh_pass.focus()});return}
      if(pw&&kf){$.err('Only one of "Password" and "Key file" must be present',_=>{q.ssh_pass.focus()});return}
    }
  }
  return 1
}
,go=_=>{
  $d&&$d.dialog('close');if(!validate())return!1
  try{
    switch(q.type.value){
      case'connect':
        $d=$('<div class=cn_dialog><progress class=cn_progress/></div>')
          .dialog({modal:1,width:350,title:'Connecting...'})
        D.skt.emit('*connect',{host:sel.host,port:+sel.port||4502,ssl:sel.ssl,cert:sel.cert,subj:sel.subj});break
      case'listen':
        const port=sel.port||4502
        $d=$('<div class=listen>'+
               '<progress class=cn_progress/>'+
               'Please start the remote interpreter with'+
               '<div class=tt>RIDE_INIT=\'CONNECT:<i>host</i>:'+port+'\'</div>'+
               ' in its environment, so it connects here.'+
             '</div>')
           .dialog({modal:1,width:450,title:'Waiting for connection...',
                    buttons:[{html:'<u>C</u>ancel',click:_=>{$d.dialog('close')}}],
                    close:_=>{D.skt.emit('*listenCancel')}})
        D.skt.emit('*listen',{port});break
      case'start':
        const env={},a=q.env.value.split('\n');for(let i=0;i<a.length;i++){const m=KV.exec(a[i]);m&&(env[m[1]]=m[2])}
        if(sel.ssh){
          const pw=q.ssh_pass.value,kf=q.ssh_key.value
          $d=$('<progress class=cn_progress/>')
             .dialog({modal:1,width:350,title:'Connecting...'})
          D.skt.emit('*ssh',{host:sel.host,port:+sel.port||22,user:sel.user||user,pass:pw,key:kf,env})
        }else{
          D.skt.emit('*launch',{exe:sel.exe,env})
        }
        break
    }
  }catch(e){$.err(''+e)}
  return!1
}
,ls=x=>fs.readdirSync(x)
,parseVer=x=>x.split('.').map(y=>+y)
,sil=f=>x=>{try{f(x)}catch(_){}} //exception silencer
D.cn=_=>{
  document.title='RIDE - Connect';var cn=document.getElementById('cn');cn.hidden=0
  $(cn).splitter().keyup(x=>{if(D.el&&x.which===123&&!x.ctrlKey&&!x.shiftKey&&!x.altKey&&!x.metaKey)
                                  {D.elw.webContents.toggleDevTools();return!1}})
  var a=cn.querySelectorAll('[id^="cn_"]');for(var i=0;i<a.length;i++)q[a[i].id.replace(/^cn_/,'')]=a[i]
  q.fav_cb.onchange=_=>{const c=q.fav_cb.checked;c?delete sel.tmp:(sel.tmp=1);$sel.find('.name').text(favText(sel))
                        q.fav_name_wr.hidden=!c;c&&q.fav_name.focus();save()}
  q.fav_name.placeholder=ANON
  q.fav_name.onchange=q.fav_name.onkeyup=_=>{
    const u=sel.name,v=q.fav_name.value||''
    if(u!==v){v?(sel.name=v):delete sel.name;$sel.find('.name').text(favText(sel));save()}
  }
  q.type.onchange=_=>{sel.type=q.type.value;updFormDtl();save()}
  updFormDtl()
  q.ssh.onchange=_=>{q.ssh_dtl.hidden=!q.ssh.checked;updExes()}
  q.ssh_user.placeholder=user
  q.fetch.onclick=_=>{if(!validate())return
                      const pw=q.ssh_pass.value,kf=q.ssh_key.value;q.fetch[0].disabled=1
                      D.skt.emit('*sshFetchListOfInterpreters',
                                 {host:sel.host,port:+sel.port||22,user:sel.user||user,pass:pw,key:kf})}
  q.exe.onchange=q.exe.onkeyup=_=>{q.exes.value||D.prf.otherExe(q.exe.value)}
  q.exes.onchange=_=>{const v=q.exes.value;q.exe.value=v||D.prf.otherExe();q.exe.readOnly=!!v;$(q.exe).change()
                      v||q.exe.focus();D.prf.selectedExe(v)} //todo: do we still need this pref?
  q.env_add.onclick=function(e){
    if(e.target.nodeName!=='A')return
    let t=e.target.textContent, k=t.split('=')[0], s=q.env.value, m=RegExp('^'+k+'=(.*)$','m').exec(s)
    if(m){q.env.setSelectionRange(m.index+k.length+1,m.index+m[0].length)}
    else{q.env.value=s=s.replace(/([^\n])$/,'$1\n')+t+'\n';$(q.env).change()
         q.env.setSelectionRange(s.length-t.length+k.length,s.length-1)}
    return!1
  }
  q.ssl_cb.onchange=_=>{q.ssl_dtl.hidden=!q.ssl_cb.checked}
  q.cert_cb.onchange=_=>{q.cert.disabled=q.cert_dots.disabled=!q.cert_cb.checked;q.cert.value='';$(q.cert).elastic()}
  q.subj_cb.onchange=_=>{q.subj.disabled=!q.subj_cb.checked;q.subj.value=''}
  q.subj_cb.onclick=_=>{q.subj_cb.checked&&q.subj.focus()}
  const browse=(x,title)=>{const v=D.el.dialog.showOpenDialog({title,defaultPath:x.value})
                           if(v){x.value=v[0];$(x).elastic().change()};return!1}
  q.cert_dots   .onclick=_=>{browse(q.cert   ,'Certificate')}
  q.ssh_key_dots.onclick=_=>{browse(q.ssh_key,'SSH Key'    )}
  D.prf.favs().forEach(x=>{q.favs.appendChild(favDOM(x)[0])})
  $(q.favs).list().sortable({cursor:'move',revert:true,axis:'y',stop:save})
    .on('click','.go',function(e){$(q.favs).list('select',$(this).parentsUntil(q.favs).last().index());q.go.click()})
    .keydown(x=>{switch(fmtKey(x)){case'Enter' :q.go.hidden||q.go.click();return!1
                                   case'Ctrl-N':q.neu  .click();return!1
                                   case'Delete':q.del  .click();return!1
                                   case'Ctrl-D':q.clone.click();return!1}})
    .on('list-order-changed',save)
    .on('list-selection-changed',_=>{
      $sel=$('.list-selection',q.favs)
      const u=$sel.length===1 //is selection unique?
      q.clone.disabled=!u;q.del.disabled=!$sel.length;q.rhs.hidden=!u
      sel=u?$sel.data('cn'):null
      if(u){
        q.type.value=sel.type||'connect';updFormDtl();updExes()
        q.fav_cb.checked=!sel.tmp;q.fav_name.value=sel.name||'';q.fav_name_wr.hidden=sel.tmp
        $(':text[name],textarea[name]',q.rhs).each((_,x)=>{$(x).val(sel[x.name])})
        $(':checkbox[name]',q.rhs).each((_,x)=>{x.checked=!!+sel[x.name]})
        q.exes.value=sel.exe;q.exes.value||(q.exes.value='') //use sel.exe if available, otherwise use "Other..."
        $(':text',q.rhs).elastic()
        q.ssl_dtl.hidden=!sel.ssl;q.ssh_dtl.hidden=!sel.ssh
        q.cert_cb.checked=!!sel.cert;q.cert.disabled=q.cert_dots.disabled=!sel.cert
        q.subj_cb.checked=!!sel.subj;q.subj.disabled=!sel.subj
      }
    })
    .list('select',0)
  var a=q.favs.querySelectorAll('a')[0];a&&a.focus()
  q.neu.onclick=_=>{const $e=favDOM({});q.favs.appendChild($e[0]);$(q.favs).list('select',$e.index());q.fav_name.focus()}
  q.clone.onclick=_=>{if(sel){favDOM($.extend({},sel)).insertBefore($sel);$('a',$sel).focus();save();q.fav_name.focus()}}
  q.del.onclick=_=>{
    const n=$sel.length
    n&&$.confirm('Are you sure you want to delete\nthe selected configuration'+(n>1?'s':'')+'?','Confirmation',
                 x=>{if(x){const i=Math.min($sel.eq(0).index(),q.favs.children.length-1)
                           $sel.remove();$(q.favs).list('select',i);save()}})
  }
  q.abt.onclick=_=>{D.abt()}
  q.go.onclick=go
  $(':text',q.rhs).elastic()
  $(':text[name],textarea[name]',q.rhs).change(function(){const k=this.name,v=this.value;v?(sel[k]=v):delete sel[k];save()})
  $(':checkbox[name]',q.rhs).change(function(){this.checked?(sel[this.name]=1):delete sel[this.name];save()})
  const handlers={
    '*connected'(x){if($d){$d.dialog('close');$d=0};new D.IDE().setHostAndPort(x.host,x.port)},
    '*spawned'(x){D.lastSpawnedExe=x.exe},
    '*spawnedExited'(x){$.err(x.code!=null?'exited with code '+x.code:'received '+x.sig)},
    '*error'(x){$d&&$d.dialog('close');$d=0;$.err(x.msg);q.fetch.disabled=0},
    '*sshInterpreters'(x){interpretersSSH=x.interpreters;updExes();q.fetch.disabled=0}
  }
  D.skt.recv=(x,y)=>{handlers[x](y)}

  //collect information about installed interpreters
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
