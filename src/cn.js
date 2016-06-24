//Connect page (loaded only when running in Electron)
;(function(){'use strict'

let $sel=$(),sel,$d //$sel:selected item(s), sel: .data('cn') of the selected item (only if it's unique), $d:dialog
,interpreters=[],interpretersSSH=[]
const rq=node_require,fs=rq('fs'),cp=rq('child_process'),net=rq('net'),os=rq('os'),path=rq('path')
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
    if(sel.ssh){const t=q.ssh_auth_type.value
                q['ssh_'+t].value||$.err((t==='key'?'"Key file"':'"Password"')+' is required',_=>{q['ssh_'+t].focus()})}
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
          $d=$('<progress class=cn_progress/>').dialog({modal:1,width:350,title:'Connecting...'})
          D.skt.emit('*ssh',{host:sel.host,port:+sel.port||22,user:sel.user||user,
                             pass:q.ssh_pass.value,key:q.ssh_key.value,env})
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
  q.fetch.onclick=_=>{
    if(!validate())return
    q.fetch.disabled=1
    const c=sshExec({host:sel.host,port:+sel.port||22,user:sel.user||user,pass:q.ssh_pass.value,key:q.ssh_key.value},
                    '/bin/ls /opt/mdyalog/*/*/*/mapl /Applications/Dyalog-*/Contents/Resources/Dyalog/mapl',
                    sm=>{
      let s='';interpretersSSH=[]
      sm.on('data',x=>{s+=x})
        .on('close',_=>{
          interpretersSSH=s.split('\n').filter(x=>x).map(x=>{
            let a=x.split('/')
            return a[1]==='opt'?{exe:x,ver:parseVer(a[3]),bits:+a[4],edition:a[5]}
                               :{exe:x,ver:parseVer(a[2].replace(/^Dyalog-|\.app$/g,'')),bits:64,edition:'unicode'}
          })
          updExes();q.fetch.disabled=0;c.end()
        })
        .on('error',x=>{$.err(x.message||''+x);updExes();q.fetch.disabled=0})
    })
  }
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
  q.ssh_auth_type.onchange=_=>{var k=q.ssh_auth_type.value==='key';q.ssh_pass_wr.hidden=k;q.ssh_key_wr.hidden=!k}
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
    '*error'(x){$d&&$d.dialog('close');$d=0;$.err(x.msg);q.fetch.disabled=0}
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

let clt,   //client, TCP connection to interpreter
    skt,   //socket-like object for communicating with the front end
    child, //a ChildProcess instance, the result from spawn()
    srv    //server, used to listen for connections from interpreters
const log=x=>{console.log(x)}
,maxl=1000,trunc=x=>x.length>maxl?x.slice(0,maxl-3)+'...':x
,shEsc=x=>`'${x.replace(/'/g,"'\\''")}'` //shell escape
,toBuf=x=>{const b=Buffer('xxxxRIDE'+x);b.writeInt32BE(b.length,0);return b}
,sendEach=x=>{if(clt){x.forEach(y=>log('send '+trunc(y)));clt.write(Buffer.concat(x.map(toBuf)))}}
,iSend=(x,y)=>{log('internal send '+trunc(JSON.stringify([x,y])));skt&&skt.emit(x,y)}
,initInterpreterConn=_=>{
  let q=Buffer(0),old //old:have we warned the user that we're talking to an old interpreter
  clt.on('data',x=>{
    q=Buffer.concat([q,x]);let n
    while(q.length>=4&&(n=q.readInt32BE(0))<=q.length){
      if(n<=8){iSend('*error',{msg:''});break}
      const m=''+q.slice(8,n);q=q.slice(n);log('recv '+trunc(m))
      if(m[0]==='['){
        const u=JSON.parse(m);skt&&skt.emit(u[0],u[1])
      }else if(/^<ReplyUnknownRIDECommand>/.test(m)&&!old){
        old=1;iSend('*error',{msg:'This version of RIDE cannot talk to interpreters older than v15.0'})
      }else if(/^UsingProtocol=/.test(m)&&m.slice(m.indexOf('=')+1)!=='2'){
        iSend('*error',{msg:'Unsupported RIDE protocol version'});break
      }
    }
  })
  clt.on('error',x=>{iSend('*error',{msg:''+x});clt=0})
  clt.on('end',_=>{log('interpreter diconnected');iSend('*disconnected');clt=0})
  sendEach(['SupportedProtocols=2','UsingProtocol=2',
            '["Identify",{"identity":1}]','["Connect",{"remoteId":2}]','["GetWindowLayout",{}]'])
}
,proxyHandlers={
  '*connect':x=>{
    let m=net,o={host:x.host,port:x.port} //m:module used to create connection; o:options for .connect()
    if(x.ssl){
      m=require('tls');o.rejectUnauthorized=false
      if(x.cert)try{o.key=fs.readFileSync(x.cert)}catch(e){iSend('*error',{msg:e.message});return}
    }
    clt=m.connect(o,_=>{
      if(x.ssl&&x.subj){
        const s=clt.getPeerCertificate().subject.CN
        if(s!==x.subj){
          iSend('*error',{msg:
            `Wrong server certificate name.  Expected:${JSON.stringify(x.subj)}, actual:${JSON.stringify(s)}`})
          return
        }
      }
      iSend('*connected',x);initInterpreterConn()
    })
    clt.on('error',x=>{log('connect failed: '+x);clt=0;iSend('*error',{msg:x.message})})
  },
  '*launch':x=>{
    const exe=(x||{}).exe||process.env.RIDE_INTERPRETER_EXE||'dyalog'
    srv=net.createServer(x=>{
      log('spawned interpreter connected');const a=srv.address();srv&&srv.close();srv=0;clt=x
      iSend('*connected',{host:a.address,port:a.port});initInterpreterConn()
      if(typeof D!=='undefined'&&D.el)D.lastSpawnedExe=exe
    })
    srv.on('error',x=>{log('listen failed: '+x);srv=clt=0;iSend('*error',{msg:x.message})})
    srv.listen(0,'127.0.0.1',_=>{
      const a=srv.address(),hp=a.address+':'+a.port
      log('listening for connections from spawned interpreter on '+hp)
      log('spawning interpreter '+JSON.stringify(exe))
      let args=['+s','-q'],stdio=['pipe','ignore','ignore']
      if(/^win/i.test(process.platform)){args=[];stdio[0]='ignore'}
      try{
        const h=x.env||{},H=process.env;for(let k in H)h[k]=H[k];h.RIDE_INIT='CONNECT:'+hp;h.RIDE_SPAWNED='1'
        child=cp.spawn(exe,args,{stdio,env:h})
      }catch(e){
        iSend('*error',{code:0,msg:''+e});return
      }
      iSend('*spawned',{exe,pid:child.pid})
      child.on('error',x=>{
        srv&&srv.close();srv=clt=child=0
        iSend('*error',{code:x.code,msg:x.code==='ENOENT'?"Cannot find the interpreter's executable":''+x})
      })
      child.on('exit',(code,sig)=>{srv&&srv.close();srv=clt=0;iSend('*spawnedExited',{code,sig});child=0})
    })
  },
  '*ssh':x=>{
    const c=sshExec(x,'/bin/sh',sm=>{
      sm.on('close',(code,sig)=>{iSend('*sshExited',{code,sig});c.end()})
      c.forwardIn('',0,(e,remotePort)=>{if(e)throw e
        let s='';for(let k in x.env)s+=`${k}=${shEsc(x.env[k])} `
        sm.write(`${s}RIDE_INIT=CONNECT:127.0.0.1:${remotePort} ${shEsc(x.exe||'dyalog')} +s -q >/dev/null\n`)
      })
    }).on('error',x=>{iSend('*error',{msg:x.message||''+x})})
  },
  '*listen':x=>{
    srv=net.createServer(x=>{
      let t,rhost=x&&(t=x.request)&&(t=t.connection)&&t.remoteAddress
      log('interpreter connected from '+rhost);srv&&srv.close();srv=0;clt=x
      iSend('*connected',{host:rhost,port:x.port});initInterpreterConn()
    })
    srv.on('error',x=>{srv=0;iSend('*error',{msg:''+x})})
    srv.listen(x.port,x.host||'',_=>{log('listening on port '+x.port);x.callback&&x.callback()})
  },
  '*listenCancel':_=>{srv&&srv.close()}
}
,sshExec=(x,cmd,f)=>{ //f:callback
  try{ //see https://github.com/mscdex/ssh2/issues/238#issuecomment-87495628 for why we use tryKeyboard:true
    var c=new(require('ssh2').Client),o={host:x.host,port:x.port,username:x.user,tryKeyboard:true}
    x.key?(o.privateKey=fs.readFileSync(x.key)):(o.password=x.pass)
    c.on('ready',_=>{c.exec(cmd,(e,sm)=>{e||f(sm)})})
     .on('tcp connection',(_,acc)=>{clt=acc();iSend('*connected',{host:'',port:0});initInterpreterConn()})
     .on('keyboard-interactive',(_,_1,_2,_3,fin)=>{fin([x.pass])})
     .connect(o)
  }catch(e){iSend('*error',{msg:e.message})}
  return c
}
D.proxy=x=>{
  ;(skt=x).recv=(x,y)=>{const f=proxyHandlers[x],s=JSON.stringify([x,y])
                        f&&log('internal recv '+trunc(s));f?f(y):sendEach([s])}
  child&&iSend('*spawned',{pid:child.pid})
}

}())
