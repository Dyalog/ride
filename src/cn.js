//Connect page, loaded only when running in Electron
;(_=>{'use strict'

let $sel=$(),sel //$sel:selected item(s), sel:data associated with the selected item (only if it's unique)
,q //a dictionary of DOM elements whose ids start with "cn_", keyed by the rest of the id
,interpreters=[],interpretersSSH=[] //local interpreters and those listed through ssh
,clt   //client, TCP connection to interpreter
,child //a ChildProcess instance, the result from spawn()
,srv   //server, used to listen for connections from interpreters
const rq=node_require,fs=rq('fs'),cp=rq('child_process'),net=rq('net'),os=rq('os'),path=rq('path')
,esc=D.util.esc,user=D.el?process.env.USER:''
,MIN_V=[15,0],KV=/^([a-z_]\w*)=(.*)$/i,WS=/^\s*$/ //KV:regexes for parsing env vars
,cmpVer=(x,y)=>x[0]-y[0]||x[1]-y[1]||0 //compare two versions of the form [major,minor]
,ls=x=>fs.readdirSync(x)
,parseVer=x=>x.split('.').map(y=>+y)
,err=x=>{if(q){q.connecting_dlg.hidden=q.listen_dlg.hidden=1;q.fetch.disabled=0}$.err(x)}
,save=_=>{
  var d=D.el.app.getPath('userData'),f=d+'/connections.json'
  if (((+fs.statSync(f).mtime)!=D.conns_modified))
    if (!confirm("Connections file has been modified, do you want to overwrite with your changes?"))
      return
  var a=q.favs.children,b=[];for(var i=0;i<a.length;i++)b[i]=a[i].cnData
  D.conns=b;fs.writeFileSync(f,JSON.stringify(D.conns))
  D.conns_modified=+fs.statSync(f).mtime
}
,favText=x=>x.name||'unnamed'
,favDOM=x=>{const e=document.createElement('div');e.cnData=x
            e.innerHTML=`<span class=name>${esc(favText(x))}</span><button class=go>Go</button>`;return e}
,fmtKey=x=>[x.metaKey?'Cmd-':'',x.ctrlKey?'Ctrl-':'',x.altKey?'Alt-':'',x.shiftKey?'Shift-':'',
            CM.keyNames[x.which]||''].join('')
,updFormDtl=_=>{const a=q.dtl.children,e=q[q.type.value];for(let i=0;i<a.length;i++)a[i].hidden=a[i]!==e}
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
,validate=x=>{
  const t=x.type,p=x.port,tn=x.ssh_tnl
  if((t==='connect'||t==='start'&&x.ssh||t==='listen')&&p&&(!/^\d*$/.test(p)||+p<1||+p>0xffff))
    {$.err('Invalid port',_=>{(t==='connect'?x.ssh_tnl?q.ssh_tnl_port:q.tcp_port:t==='start'?q.ssh_port:q.listen_port).select()});return}
  if((t==='connect'&&x.ssh_tnl)&&x.ride_port&&(!/^\d*$/.test(x.ride_port)||+x.ride_port<1||+x.ride_port>0xffff))
    {$.err('Invalid RIDE port',_=>{q.ssh_ride_port.select()});return}
  if(t==='start'){
    const a=(x.env||'').split('\n')
    for(let i=0;i<a.length;i++)if(!KV.test(a[i])&&!WS.test(a[i]))
      {$.err('Invalid environment variables',_=>{q.env.focus()});return}
    if(!x.exe){$.err('"Interpreter" is required',_=>{q.exe.focus()});return}
    if(x===sel&&x.ssh){const t=q.ssh_auth_type.value, e=q['ssh_'+t]
                       if(!e.value){$.err((t==='key'?'"Key file"':'"Password"')+' is required',_=>{e.focus()});return}}
  }
  return 1
}
,go=global.go=x=>{ //"Go" buttons in the favs or the "Go" button at the bottom
  x=x||sel;if(!validate(x))return 0;D.local=0
  try{
    var ct=process.env.RIDE_CONNECT_TIMEOUT||10000
    switch(x.type||'connect'){
      case'connect':
        D.util.dlg(q.connecting_dlg)
        if(x.ssh_tnl){
          var o={host:x.host||'localhost',port:+x.port||22,user:x.user||user}
          if(x.ssh_tnl_auth_type==='key'){o.key=x.ssh_tnl_key}else{o.pass=x===sel?q.ssh_tnl_pass.value:''}
          const c=sshExec(o,'/bin/sh',(e,sm)=>{if(e)throw e
            sm.on('close',(code,sig)=>{D.ide&&D.ide._sshExited({code,sig});c.end()})
            c.forwardOut('',0,'127.0.0.1',x.ride_port,(e,sm)=>{
              if(e){log('cannot forward out through ssh');clt=0;err(e.message);clearTimeout(D.tmr);delete D.tmr;return}
              clt=sm;initInterpreterConn();new D.IDE().setConnInfo(x.host,x.port,sel?sel.name:'')
              clt.on('error',x=>{log('connect failed: '+x);clt=0;err(x.message);clearTimeout(D.tmr);delete D.tmr})
            })
          })
          c&&c.on('error',x=>{err(x.message||''+x);q.connecting_dlg.hidden=1;clearTimeout(D.tmr);delete D.tmr})
          D.tmr=setTimeout(function(){err('Timed out');c&&c.end();q.connecting_dlg.hidden=1},ct)
        }else{
          connect({host:x.host||'localhost',port:+x.port||4502,
                   ssl:x.ssl,cert:x.cert,key:x.key,subj:x.subj,rootcertsdir:x.rootcertsdir})
        }
        break
      case'listen':
        D.util.dlg(q.listen_dlg);const port=+x.port||4502;q.listen_dlg_port.textContent=''+port
        q.listen_dlg_cancel.onclick=_=>{srv&&srv.close();q.listen_dlg.hidden=1;return!1}
        srv=net.createServer(x=>{let t,host=x&&(t=x.request)&&(t=t.connection)&&t.remoteAddress
                                 log('interpreter connected from '+host);srv&&srv.close();srv=0;clt=x
                                 initInterpreterConn();new D.IDE().setConnInfo(host,port,sel?sel.name:'')})
        srv.on('error',x=>{srv=0;q.listen_dlg.hidden=1;err(''+x)})
        srv.listen(port,'',_=>{log('listening on port '+port)});break
      case'start':
        const env={},a=(x.env||'').split('\n');for(let i=0;i<a.length;i++){const m=KV.exec(a[i]);m&&(env[m[1]]=m[2])}
        if(x.ssh){
          D.util.dlg(q.connecting_dlg)
          var o={host:x.host||'localhost',port:+x.port||22,user:x.user||user}
          if(x.ssh_auth_type==='key'){o.key=x.ssh_key}else{o.pass=x===sel?q.ssh_pass.value:''}
          const c=sshExec(o,'/bin/sh',(e,sm)=>{if(e)throw e
            sm.on('close',(code,sig)=>{D.ide&&D.ide._sshExited({code,sig});c.end()})
            c.forwardIn('',0,(e,rport)=>{if(e)throw e
              let s0='';for(let k in env)s0+=`${k}=${shEsc(env[k])} `
              let s1=x.args?x.args.replace(/\n$/,'').split('\n').map(shEsc).join(' '):''
              sm.write(`${s0}CLASSICMODE=1 SINGLETRACE=1 RIDE_INIT=CONNECT:127.0.0.1:${rport} ${shEsc(x.exe)} ${s1} +s -q >/dev/null\n`)
              q.connecting_dlg.hidden=1
            })
          }).on('error',x=>{err(x.message||''+x);q.connecting_dlg.hidden=1;clearTimeout(D.tmr);delete D.tmr})
          D.tmr=setTimeout(function(){err('Timed out');c&&c.end();q.connecting_dlg.hidden=1},ct)
        }else{
          srv=net.createServer(y=>{log('spawned interpreter connected');const a=srv.address();srv&&srv.close();srv=0;clt=y
                                   initInterpreterConn();new D.IDE().setConnInfo(a.address,a.port,sel?sel.name:'')
                                   D.lastSpawnedExe=x.exe;D.local=1})
          srv.on('error',x=>{log('listen failed: '+x);srv=clt=0;err(x.message);clearTimeout(D.tmr);delete D.tmr})
          srv.listen(0,'127.0.0.1',_=>{
            const a=srv.address(),hp=a.address+':'+a.port
            log('listening for connections from spawned interpreter on '+hp)
            log('spawning interpreter '+JSON.stringify(x.exe))
            let args=['+s','-q'],stdio=['pipe','ignore','ignore']
            if(/^win/i.test(process.platform)){args=[];stdio[0]='ignore'}
            if(x.args)args=args.concat(args,x.args.replace(/\n$/,'').split('\n'))
            try{child=cp.spawn(x.exe,args,{cwd:x.cwd,stdio,detached:true,env:$.extend({},process.env,env,
                                           {CLASSICMODE:1,SINGLETRACE:1,RIDE_INIT:'CONNECT:'+hp,RIDE_SPAWNED:'1'})})}
            catch(e){err(''+e);return}
            D.lastSpawnedExe=x.exe
            child.on('exit',(code,sig)=>{srv&&srv.close();srv=clt=child=0;clearTimeout(D.tmr);delete D.tmr
                                         if(code!==0){err('Interpreter '+(code!=null?'exited with code '+code:'received '+sig))}})
            child.on('error',y=>{srv&&srv.close();srv=clt=child=0;clearTimeout(D.tmr);delete D.tmr
                                 err(y.code==='ENOENT'?"Cannot find the interpreter's executable":''+y)
                                 console.error(y)})
          })
          D.tmr=setTimeout(function(){err('Timed out');srv&&srv.close();srv=0;child&&child.kill();child=0},ct)
        }
        break
    }
  }catch(e){$.err(''+e)}
  return!1
}
D.cn=_=>{ //set up Connect page
  q=J.cn;document.title='RIDE - Connect';I.cn.hidden=0;$(I.cn).splitter()
  var d=D.el.app.getPath('userData'),f=d+'/connections.json'
  if (fs.existsSync(f)){
    D.conns=JSON.parse(fs.readFileSync(f).toString())
    D.conns_modified=+fs.statSync(f).mtime
  }else{
    fs.writeFileSync(f,JSON.stringify([{type:"connect"}]))
    D.conns_modified=+fs.statSync(f).mtime
  }
  D.conns=D.conns||[{type:"connect"}]
  I.cn.onkeyup=x=>{if(D.el&&fmtKey(x)==='F12'){D.elw.webContents.toggleDevTools();return!1}}
  q.cwd.oncontextmenu=q.args.oncontextmenu=q.env.oncontextmenu=D.oncmenu
  q.fav_name.onchange=q.fav_name.onkeyup=_=>{
    const u=sel.name,v=q.fav_name.value||''
    if(u!==v){v?(sel.name=v):delete sel.name;$sel.find('.name').text(favText(sel))}
  }
  updFormDtl();q.type.onchange=_=>{sel.type=q.type.value;updFormDtl()}
  q.ssh.onchange=_=>{q.ssh_dtl.hidden=!(q.non_ssh_dtl.hidden=q.ssh.checked);updExes()}
  q.ssh_tnl.onchange=_=>{q.ssh_tnl_dtl.hidden=!q.ssh_tnl.checked;q.tcp_dtl.hidden=q.ssh_tnl.checked}
  q.ssh_user.placeholder=q.ssh_tnl_user.placeholder=user
  var enterConnect=function(event){if (event.keyCode==13){$('#cn_go').click()}}
  $('#cn_ssh_tnl_host').keyup(enterConnect);$('#cn_tcp_host').keyup(enterConnect);$('#cn_ssh_host').keyup(enterConnect)
  q.fetch.onclick=_=>{
    if(!validate($.extend({},sel,{exe:'x'})))return //validate all except "exe"
    q.fetch.disabled=1
    const c=sshExec({host:sel.host||'localhost',port:+sel.port||22,user:sel.user||user,pass:q.ssh_pass.value,key:q.ssh_key.value},
                    '/bin/ls /opt/mdyalog/*/*/*/mapl /Applications/Dyalog-*/Contents/Resources/Dyalog/mapl 2>/dev/null',
                    (e,sm)=>{
      if(e)throw e
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
        .on('error',x=>{err(x.message||''+x);updExes();q.fetch.disabled=0})
    })
  }
  q.exe.onchange=q.exe.onkeyup=_=>{q.exes.value||D.prf.otherExe(q.exe.value)}
  q.exes.onchange=_=>{const v=q.exes.value;q.exe.value=v||D.prf.otherExe();q.exe.readOnly=!!v;$(q.exe).change()
                      v||q.exe.focus();D.prf.selectedExe(v)} //todo: do we still need this pref?
  q.env_add.onclick=x=>{
    if(x.target.nodeName!=='A')return
    let t=x.target.textContent, k=t.split('=')[0], s=q.env.value, m=RegExp('^'+k+'=(.*)$','m').exec(s)
    if(m){q.env.setSelectionRange(m.index+k.length+1,m.index+m[0].length)}
    else{q.env.value=s=s.replace(/([^\n])$/,'$1\n')+t+'\n';$(q.env).change()
         q.env.setSelectionRange(s.length-t.length+k.length,s.length-1)}
    return!1
  }
  q.ssl_cb.onchange=_=>{q.ssl_dtl.hidden=!q.ssl_cb.checked}
  q.cert_cb.onchange=_=>{q.cert.disabled=q.key.disabled=q.cert_dots.disabled=q.key_dots.disabled=!q.cert_cb.checked
                         q.cert.value=q.key.value=sel.cert=sel.key=''
                         D.util.elastic(q.cert);D.util.elastic(q.key)}
  q.subj_cb.onclick=_=>{sel.subj=q.subj_cb.checked?'1':''}
  q.rootcertsdir_cb.onchange=_=>{q.rootcertsdir.disabled=q.rootcertsdir_dots.disabled=!q.rootcertsdir_cb.checked
                                 q.rootcertsdir.value=sel.rootcertsdir=''
                                 D.util.elastic(q.rootcertsdir)}
  q.rootcertsdir_cb.onclick=_=>{q.rootcertsdir_cb.checked&&q.rootcertsdir.focus()}
  const browse=(x,title,props)=>{const v=D.el.dialog.showOpenDialog({title,defaultPath:x.value,properties:props||[]})
                                 if(v){x.value=v[0];D.util.elastic(x);$(x).change()};return!1}
  q.cert_dots        .onclick=_=>{browse(q.cert        ,'Certificate')}
  q.key_dots         .onclick=_=>{browse(q.key         ,'Key'        )}
  q.ssh_key_dots     .onclick=_=>{browse(q.ssh_key     ,'SSH Key'    )}
  q.ssh_tnl_key_dots     .onclick=_=>{browse(q.ssh_tnl_key     ,'SSH Key'    )}
  q.rootcertsdir_dots.onclick=_=>{browse(q.rootcertsdir,'Directory with Root Certificates',['openDirectory'])}
  q.ssh_auth_type.onchange=_=>{const k=q.ssh_auth_type.value==='key';q.ssh_pass_wr.hidden=k;q.ssh_key_wr.hidden=!k;
                               sel.ssh_auth_type=q.ssh_auth_type.value}
  q.ssh_tnl_auth_type.onchange=_=>{const k=q.ssh_tnl_auth_type.value==='key';q.ssh_tnl_pass_wr.hidden=k;q.ssh_tnl_key_wr.hidden=!k;
                               sel.ssh_tnl_auth_type=q.ssh_tnl_auth_type.value}
  D.conns.forEach(x=>{q.favs.appendChild(favDOM(x))})
  $(q.favs).list().sortable({cursor:'move',revert:true,axis:'y',stop:save})
    .on('click','.go',function(){$(q.favs).list('select',$(this).parentsUntil(q.favs).last().index());q.go.click()})
    .keydown(x=>{switch(fmtKey(x)){case'Enter' :q.go.hidden||q.go.click();return!1
                                   case'Ctrl-N':q.neu.click();return!1
                                   case'Delete':q.del.click();return!1
                                   case'Ctrl-D':q.cln.click();return!1}})
    .on('list-order-changed',save)
    .on('list-selection-changed',_=>{
      $sel=$('.list_sel',q.favs)
      const u=$sel.length===1 //is selection unique?
      q.cln.disabled=!u;q.del.disabled=!$sel.length;q.rhs.hidden=!u
      sel=u?$sel[0].cnData:null
      if(u){
        $(':text[name],textarea[name]',q.rhs).each((_,x)=>{x.value=sel[x.name]||''})
        $(':checkbox[name]',q.rhs).each((_,x)=>{x.checked=!!+sel[x.name]})
        q.type.value=sel.type||'connect';updFormDtl();updExes()
        q.fav_name.value=sel.name||''
        q.exes.value=sel.exe;q.exes.value||(q.exes.value='') //use sel.exe if available, otherwise use "Other..."
        var a=q.rhs.querySelectorAll('input,textarea')
        for(var i=0;i<a.length;i++)if(/^text(area)?$/.test(a[i].type))D.util.elastic(a[i])
        q.ssh_auth_type.value=sel.ssh_auth_type||'pass';q.ssh_auth_type.onchange()
        q.ssh_tnl_auth_type.value=sel.ssh_tnl_auth_type||'pass';q.ssh_tnl_auth_type.onchange()
        q.ssl_dtl.hidden=!sel.ssl;q.ssh_dtl.hidden=!(q.non_ssh_dtl.hidden=sel.ssh)
        q.ssh_tnl_dtl.hidden=!sel.ssh_tnl;q.tcp_dtl.hidden=sel.ssh_tnl
        q.cert_cb.checked=!!sel.cert;q.cert.disabled=q.key.disabled=q.cert_dots.disabled=q.key_dots.disabled=!sel.cert
        q.subj_cb.checked=!!sel.subj
        q.rootcertsdir_cb.checked=!!sel.rootcertsdir;q.rootcertsdir.disabled=q.rootcertsdir_dots.disabled=!sel.rootcertsdir
      }
    })
    .list('select',0)
  {const a=q.favs.querySelectorAll('a')[0];a&&a.focus()}
  q.sve.onclick=_=>{save()}
  q.neu.onclick=_=>{const $e=$(favDOM({}));q.favs.appendChild($e[0]);$(q.favs).list('select',$e.index());q.fav_name.focus()}
  q.cln.onclick=_=>{if(sel){$(favDOM($.extend({},sel))).insertBefore($sel);$('a',$sel).focus();q.fav_name.focus()}}
  q.del.onclick=_=>{
    const n=$sel.length
    n&&$.confirm('Are you sure you want to delete\nthe selected configuration'+(n>1?'s':'')+'?','Confirmation',
                 x=>{if(x){const i=Math.min($sel.eq(0).index(),q.favs.children.length-1)
                           $sel.remove();$(q.favs).list('select',i)}})
  }
  q.abt.onclick=_=>{D.abt()}
  q.go.onclick=_=>{go();return!1}
  var a=q.rhs.querySelectorAll('input,textarea')
  for(var i=0;i<a.length;i++)if(/^text(area)?$/.test(a[i].type))D.util.elastic(a[i])
  $(':text[name],textarea[name]',q.rhs).change(function(){const k=this.name,v=this.value;v?(sel[k]=v):delete sel[k]})
  $(':checkbox[name]',q.rhs).change(function(){this.checked?(sel[this.name]=1):delete sel[this.name]})
  //collect information about installed interpreters
  try{
    if(/^win/.test(process.platform)){
      const s=cp.execSync('reg query "HKEY_CURRENT_USER\\Software\\Dyalog" /s /v localdyalogdir',{timeout:2000,
                                                                                                  encoding:'UTF8'})
      let b,v,u,m //b:bits,v:version,u:edition,m:match object
      s&&s.split('\r\n').forEach(x=>{if(x){
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
      const a='/opt/mdyalog',sil=f=>x=>{try{f(x)}catch(_){}} //exception silencer
      ls(a).forEach(sil(v=>{if(/^\d+\.\d+/.test(v))
        ls(`${a}/${v}`).forEach(sil(b=>{if(b==='32'||b==='64')
          ls(`${a}/${v}/${b}`).forEach(sil(u=>{if(u==='unicode'||u==='classic'){
            const exe=`${a}/${v}/${b}/${u}/mapl`
            fs.existsSync(exe)&&interpreters.push({exe,ver:parseVer(v),bits:+b,edition:u})}}))}))}))
    }
  }catch(e){console.error(e)}
  updExes()
//  q.connecting_dlg_close.onclick=_=>{q.connecting_dlg.hidden=1}
}

const maxl=1000,trunc=x=>x.length>maxl?x.slice(0,maxl-3)+'...':x
,shEsc=x=>`'${x.replace(/'/g,"'\\''")}'` //shell escape
,toBuf=x=>{const b=Buffer('xxxxRIDE'+x);b.writeInt32BE(b.length,0);return b}
,sendEach=x=>{if(clt){x.forEach(y=>log('send '+trunc(y)));clt.write(Buffer.concat(x.map(toBuf)))}}
,initInterpreterConn=_=>{
  if(q)q.connecting_dlg.hidden=q.listen_dlg.hidden=1
  let b=Buffer(0x100000),ib=0,nb=0,old //ib,nb:offset and length in b; old:have we warned about an old interpreter?
  clt.on('data',x=>{
    if(nb+x.length>b.length){const r=Buffer(Math.pow(2,Math.ceil(Math.log(nb+x.length)/Math.log(2))))
                             b.copy(r,0,ib,ib+nb);ib=0;b=r;log('resized recv buffer to '+b.length)}
    else if(ib+nb+x.length>b.length){b.copy(b,0,ib,ib+nb);ib=0}
    x.copy(b,ib+nb,0,x.length);nb+=x.length
    let n //message length
    while(nb>=4&&(n=b.readInt32BE(ib))<=nb){
      if(n<=8){err('Bad protocol message');break}
      const m=''+b.slice(ib+8,ib+n);ib+=n;nb-=n;log('recv '+trunc(m))
      if(m[0]==='['){
        const u=JSON.parse(m);D.recv&&D.recv(u[0],u[1])
      }else if(m[0]==='<'&&!old){
        old=1;err('This version of RIDE cannot talk to interpreters older than v15.0')
      }else if(/^UsingProtocol=/.test(m)&&m.slice(m.indexOf('=')+1)!=='2'){
        err('Unsupported RIDE protocol version');break
      }
    }
  })
  clt.on('error',x=>{err(''+x);clt=0})
  clt.on('end',_=>{log('interpreter diconnected');D.ide&&D.ide._disconnected();clt=0})
  sendEach(['SupportedProtocols=2','UsingProtocol=2',
            '["Identify",{"identity":1}]','["Connect",{"remoteId":2}]','["GetWindowLayout",{}]'])
}
,sshExec=(x,cmd,f)=>{ //f:callback
  try{ //see https://github.com/mscdex/ssh2/issues/238#issuecomment-87495628 for why we use tryKeyboard:true
    const c=new(rq('ssh2').Client),o={host:x.host,port:x.port,username:x.user,tryKeyboard:true}
    x.key?(o.privateKey=fs.readFileSync(x.key)):(o.password=x.pass)
    c.on('ready',_=>{c.exec(cmd,f)})
     .on('tcp connection',(_,acc)=>{clt=acc();initInterpreterConn();new D.IDE().setConnInfo('',0,sel?sel.name:'')})
     .on('keyboard-interactive',(_,_1,_2,_3,fin)=>{fin([x.pass])})
     .on('error',x=>err(''+x))
     .connect(o)
    return c
  }catch(e){err(e.message)}
}
,connect=x=>{
  let m=net,o={host:x.host,port:x.port} //m:module used to create connection; o:options for .connect()
  if(x.ssl){
    try{
      m=rq('tls')
      if(x.cert){o.cert=fs.readFileSync(x.cert);o.key=fs.readFileSync(x.key)}
      if(x.rootcertsdir)o.ca=fs.readdirSync(x.rootcertsdir).map(y=>fs.readFileSync(path.join(x.rootcertsdir,y)))
      o.checkServerIdentity=(servername,cert)=>{
        if(!x.subj||x.host===cert.subject.CN)return
        err(`Wrong server certificate name. Expected:${JSON.stringify(x.host)}, actual:${JSON.stringify(cert.subject.CN)}`)
        try{clt.end()}catch(e){console.error(e)}
        throw new Error
      }
    }catch(e){err(e.message);return}
  }
  clt=m.connect(o,_=>{initInterpreterConn();new D.IDE().setConnInfo(x.host,x.port,sel?sel.name:'')})
  clt.on('error',x=>{log('connect failed: '+x);clt=0;err(x.message)})
}

module.exports=_=>{
  D.send=(x,y)=>{sendEach([JSON.stringify([x,y])])}
  const a=node_require('electron').remote.process.argv, env=D.el.process.env
  ,h={c:env.RIDE_CONNECT,s:env.RIDE_SPAWN} //h:args by name
  for(var i=1;i<a.length;i++)if(a[i][0]==='-'){h[a[i].slice(1)]=a[i+1];i++}
  if(h.c){q=J.cn;var m=/^([^:]+|\[[^\]]+\])(?::(\d+))?$/.exec(h.c) //parse host and port
          m?go({type:'connect',host:m[1],port:+m[2]||4502}):$.err('Invalid $RIDE_CONNECT')}
  else if(h.s){q=J.cn;go({type:'start',exe:h.s});window.onbeforeunload=function(){D.send('Exit',{code:0})}}
  else{D.cn()}
}

let log
{
  let i=0;const n=100,a=Array(n),l=[],t0=+new Date
  log=x=>{a[i++]=x=(new Date-t0)+' '+x;i%=n;for(var j=0;j<l.length;j++)l[j](x)}
  module.exports.getLog=_=>a.slice(i).concat(a.slice(0,i))
  module.exports.addLogListener=x=>{l.push(x)}
  module.exports.rmLogListener=x=>{const i=l.indexOf(x);i>=0&&l.splice(i,1)}
}

})()
