'use strict'
const rq=require,fs=rq('fs'),net=rq('net'),os=rq('os'),path=rq('path'),cp=rq('child_process')
let log
{
  // record no more than N log messages per T milliseconds; at any moment, there have been n messages since time t
  let stdoutOK=1,n=0,t=0;const N=500,T=1000,t0=+new Date,l=[] // l:listeners
  log=s=>{
    const t1=+new Date;if(t1-t>T){t=t1;n=1} // if last message was too long ago, start counting afresh
    const m= ++n<N ? `${t1-t0} ${s}\n` : n===N ? '... logging temporarily suppressed\n' : 0; if(!m)return
    if(stdoutOK)try{process.stdout&&process.stdout.write&&process.stdout.write(m)}catch(_){stdoutOK=0}
    const l1=l.slice(0);for(let i=0;i<l1.length;i++)l1[i](m) // notify listeners, prevent concurrent modification
  }
  log.addListener=x=>{l.push(x)}
  log.rmListener=x=>{const i=l.indexOf(x);i>=0&&l.splice(i,1)}
  let f=process.env.RIDE_LOG
  if(f){ // if $RIDE_LOG is present, also log to a file (in addition to stdout)
    const h=process.env.HOME||process.env.USERPROFILE;if(h)f=path.resolve(h,f)
    fd=fs.openSync(f,'a');l.push(s=>{const b=Buffer(m);fs.writeSync(fd,b,0,b.length)})
  }
  if(D.el){ // are we running under Electron as opposed to just NodeJS?
    let i=0,a=Array(1000)          // if so, store latest log messages in RAM
    log.get=()=>a.slice(i).concat(a.slice(0,i))
    l.push(s=>{a[i++]=s;i%=a.length})
  }
  log(new Date().toISOString())
}
let clt,   // client, TCP connection to interpreter
    skt,   // websocket or other connection-like object for communicating with the browser
    child, // a ChildProcess instance, the result from spawn()
    srv    // server, used to listen for connections from interpreters
const trunc=s=>s.length>1000?s.slice(0,997)+'...':s
,ls=x=>fs.readdirSync(x)
,sil=f=>x=>{try{f(x)}catch(_){}} // exception silencer
,shEsc=x=>"'"+x.replace(/'/g,"'\\''")+"'" // shell escape
,parseVer=s=>s.split('.').map(x=>+x)
,send=s=>{if(clt){log('send '+trunc(s));const b=Buffer('xxxxRIDE'+s);b.writeInt32BE(b.length,0);clt.write(b)}}
,cmd=(c,h)=>{send(JSON.stringify([c,h||{}]))} // c:command name, h:arguments as a JS object
,toBrowser=(x,y)=>{log('to browser:'+trunc(JSON.stringify([x,y])));skt&&skt.emit(x,y)}
,initInterpreterConn=()=>{
  const P=process.env.RIDE_PROTOCOL||'2'
  let q=Buffer(0),old // old: have we warned the user that we're talking to an old interpreter
  clt.on('data',x=>{
    q=Buffer.concat([q,x]);let n
    while(q.length>=4&&(n=q.readInt32BE(0))<=q.length){
      if(n<=8){toBrowser('*error',{msg:''});break}
      const m=''+q.slice(8,n);q=q.slice(n);log('recv '+trunc(m))
      if(m[0]==='['){
        const u=JSON.parse(m);skt&&skt.emit(u[0],u[1])
      }else if(/^<ReplyUnknownRIDECommand>/.test(m)&&!old){
        old=1;toBrowser('*error',{msg:'This version of RIDE cannot talk to interpreters older than v15.0'})
      }else if(/^UsingProtocol=/.test(m)&&m.slice(m.indexOf('=')+1)!==P){
        toBrowser('*error',{msg:'Unsupported RIDE protocol version'});break
      }
    }
  })
  clt.on('error',e=>{toBrowser('*error',{msg:''+e});clt=null})
  clt.on('end',()=>{log('interpreter diconnected');toBrowser('*disconnected');clt=null})
  send('SupportedProtocols='+P);send('UsingProtocol='+P)
  cmd('Identify',{identity:1});cmd('Connect',{remoteId:2});cmd('GetWindowLayout')
}
const handlers={
  '*connect':x=>{
    let m=net,o={host:x.host,port:x.port} // m:module used to create connection; o:options for .connect()
    if(x.ssl){
      m=require('tls');o.rejectUnauthorized=false
      if(x.cert)try{o.key=fs.readFileSync(x.cert)}catch(e){toBrowser('*error',{msg:e.message});return}
    }
    clt=m.connect(o,()=>{
      if(x.ssl&&x.subj){
        const s=clt.getPeerCertificate().subject.CN
        if(s!==x.subj){
          toBrowser('*error',{msg:
            `Wrong server certificate name.  Expected:${JSON.stringify(x.subj)}, actual:${JSON.stringify(s)}`})
          return
        }
      }
      toBrowser('*connected',x);initInterpreterConn()
    })
    clt.on('error',err=>{log('connect failed: '+err);clt=null;toBrowser('*error',{msg:err.message})})
  },
  '*launch':x=>{
    const exe=(x||{}).exe||process.env.RIDE_INTERPRETER_EXE||'dyalog'
    srv=net.createServer(c=>{
      log('spawned interpreter connected');const a=srv.address();srv&&srv.close();srv=null;clt=c
      toBrowser('*connected',{host:a.address,port:a.port});initInterpreterConn()
      if(D.el)D.lastSpawnedExe=exe
    })
    srv.on('error',err=>{log('listen failed: '+err);srv=clt=null;toBrowser('*error',{msg:err.message})})
    srv.listen(0,'127.0.0.1',()=>{
      const a=srv.address(),hp=a.address+':'+a.port
      log('listening for connections from spawned interpreter on '+hp)
      log('spawning interpreter '+JSON.stringify(exe))
      let args=['+s','-q'],stdio=['pipe','ignore','ignore']
      if(/^win/i.test(process.platform)){args=[];stdio[0]='ignore'}
      try{
        const h=x.env||{},H=process.env;for(let k in H)h[k]=H[k];h.RIDE_INIT='CONNECT:'+hp;h.RIDE_SPAWNED='1'
        child=cp.spawn(exe,args,{stdio:stdio,env:h})
      }catch(e){
        toBrowser('*error',{code:0,msg:''+e});return
      }
      toBrowser('*spawned',{exe:exe,pid:child.pid})
      child.on('error',err=>{
        srv&&srv.close();srv=clt=child=null
        toBrowser('*error',{code:err.code,msg:err.code==='ENOENT'?"Cannot find the interpreter's executable":''+err})
      })
      child.on('exit',(code,sig)=>{
        srv&&srv.close();srv=clt=null;toBrowser('*spawnedExited',{code:code,sig:sig});child=null
      })
    })
  },
  '*sshFetchListOfInterpreters':x=>{
    const c=sshExec(x,'/bin/ls /opt/mdyalog/*/*/*/mapl /Applications/Dyalog-*/Contents/Resources/Dyalog/mapl',sm=>{
      let s=''
      sm.on('data',x=>{s+=x}).on('close',()=>{
        toBrowser('*sshInterpreters',{interpreters:s.split('\n').filter(x=>x).map(x=>{
          let a=x.split('/')
          return a[1]==='opt'?{exe:x,ver:parseVer(a[3]),bits:+a[4],edition:a[5]}
                             :{exe:x,ver:parseVer(a[2].replace(/^Dyalog-|\.app$/g,'')),bits:64,edition:'unicode'}
        })})
        c.end()
      })
    }).on('error',x=>{toBrowser('*error',{msg:x.message||''+x})
                      toBrowser('*sshInterpreters',{interpreters:[]})})
  },
  '*ssh':x=>{
    const c=sshExec(x,'/bin/sh',sm=>{
      sm.on('close',(code,sig)=>{toBrowser('*sshExited',{code:code,sig:sig});c.end()})
      c.forwardIn('',0,(err,remotePort)=>{if(err)throw err
        let s='';for(let k in x.env)s+=`${k}=${shEsc(x.env[k])} `
        sm.write(`${s}RIDE_INIT=CONNECT:127.0.0.1:${remotePort} ${shEsc(x.exe||'dyalog')} +s -q >/dev/null\n`)
      })
    }).on('error',x=>{toBrowser('*error',{msg:x.message||''+x})})
  },
  '*listen':x=>{
    srv=net.createServer(c=>{
      let t,rhost=c&&(t=c.request)&&(t=t.connection)&&t.remoteAddress
      log('interpreter connected from '+rhost);srv&&srv.close();srv=null;clt=c
      toBrowser('*connected',{host:rhost,port:x.port});initInterpreterConn()
    })
    srv.on('error',err=>{srv=null;toBrowser('*error',{msg:''+err})})
    srv.listen(x.port,x.host||'',()=>{log('listening on port '+x.port);x.callback&&x.callback()})
  },
  '*listenCancel':()=>{srv&&srv.close()},
  '*getProxyInfo':()=>{
    // List available interpreter executables, possible paths are:
    //   C:\Program Files\Dyalog\Dyalog APL $VERSION\dyalog.exe
    //   C:\Program Files\Dyalog\Dyalog APL $VERSION unicode\dyalog.exe
    //   C:\Program Files\Dyalog\Dyalog APL-64 $VERSION\dyalog.exe
    //   C:\Program Files\Dyalog\Dyalog APL-64 $VERSION unicode\dyalog.exe
    //   C:\Program Files (x86)\Dyalog\Dyalog APL $VERSION\dyalog.exe
    //   C:\Program Files (x86)\Dyalog\Dyalog APL $VERSION unicode\dyalog.exe
    //   /opt/mdyalog/$VERSION/[64|32]/[classic|unicode]/mapl
    //   /Applications/Dyalog-$VERSION/Contents/Resources/Dyalog/mapl
    const r={interpreters:[],platform:process.platform} // proxy info (the result)
    if(/^win/.test(r.platform)){
      try{
        cp.exec('reg query "HKEY_CURRENT_USER\\Software\\Dyalog" /s /v localdyalogdir',{timeout:2000},(err,s)=>{
          let b,v,u,m // b:bits,v:version,u:edition,m:match object
          err||s.split('\r\n').forEach(l=>{if(l){ // l:current line
            if(m=/^HK.*\\Dyalog APL\/W(-64)? (\d+\.\d+)( Unicode)?$/i.exec(l)){
              b=m[1]?64:32;v=m[2];u=m[3]?'unicode':'classic'
            }else if(v&&(m=/^ *localdyalogdir +REG_SZ +(\S.*)$/i.exec(l))){
              r.interpreters.push({exe:m[1]+'\\dyalog.exe',ver:parseVer(v),bits:b,edition:u})
            }else if(!/^\s*$/.test(l)){
              b=v=u=null
            }
          }})
          toBrowser('*proxyInfo',r)
        })
      }catch(ex){
        console.error(ex);toBrowser('*proxyInfo',r)
      }
    }else if(r.platform==='darwin'){
      try{
        const a='/Applications'
        ls(a).forEach(x=>{
          const m=/^Dyalog-(\d+\.\d+)\.app$/.exec(x), exe=`${a}/${x}/Contents/Resources/Dyalog/mapl`
          m&&fs.existsSync(exe)&&r.interpreters.push({exe:exe,ver:parseVer(m[1]),bits:64,edition:'unicode'})
        })
      }catch(_){}
      toBrowser('*proxyInfo',r)
    }else{
      try{
        const a='/opt/mdyalog'
        ls(a).forEach(sil(v=>{if(/^\d+\.\d+/.test(v))
          ls(`${a}/${v}`).forEach(sil(b=>{if(b==='32'||b==='64')
            ls(`${a}/${v}/${b}`).forEach(sil(u=>{if(u==='unicode'||u==='classic'){
              const exe=`${a}/${v}/${b}/${u}/mapl`
              fs.existsSync(exe)&&r.interpreters.push({exe:exe,ver:parseVer(v),bits:+b,edition:u})
            }}))
          }))
        }))
      }catch(_){}
      toBrowser('*proxyInfo',r)
    }
  }
}
,sshExec=(x,cmd,callback)=>{
  try{ // see https://github.com/mscdex/ssh2/issues/238#issuecomment-87495628 for why we use tryKeyboard:true
    const c=new(require('ssh2').Client),o={host:x.host,port:x.port,username:x.user,tryKeyboard:true}
    x.key?(o.privateKey=fs.readFileSync(x.key)):(o.password=x.pass)
    c.on('ready',()=>{c.exec(cmd,(err,sm)=>{err||callback(sm)})})
     .on('tcp connection',(_,acc)=>{clt=acc();toBrowser('*connected',{host:'',port:0});initInterpreterConn()})
     .on('keyboard-interactive',(_,_1,_2,_3,finish)=>{finish([x.pass])})
     .connect(o)
  }catch(e){toBrowser('*error',{msg:e.message})}
  return c
}
module.exports=x=>{
  log('browser connected')
  ;(skt=x).onevent=x=>{
    const f=handlers[x.data[0]];f&&log('from browser:'+trunc(JSON.stringify(x.data)))
    f?f(x.data[1]):cmd(x.data[0],x.data[1]||{})
  }
  child&&toBrowser('*spawned',{pid:child.pid})
}
module.exports.log=log
