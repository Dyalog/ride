'use strict'
let clt,   //client, TCP connection to interpreter
    skt,   //socket-like object for communicating with the front end
    child, //a ChildProcess instance, the result from spawn()
    srv    //server, used to listen for connections from interpreters
const rq=require,fs=rq('fs'),net=rq('net'),os=rq('os'),path=rq('path'),cp=rq('child_process')
,log=x=>{console.log(x)}
,maxl=1000,trunc=x=>x.length>maxl?x.slice(0,maxl-3)+'...':x
,shEsc=x=>`'${x.replace(/'/g,"'\\''")}'` //shell escape
,parseVer=x=>x.split('.').map(y=>+y)
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
,handlers={
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
  '*sshFetchListOfInterpreters':x=>{
    const c=sshExec(x,'/bin/ls /opt/mdyalog/*/*/*/mapl /Applications/Dyalog-*/Contents/Resources/Dyalog/mapl',sm=>{
      let s=''
      sm.on('data',x=>{s+=x}).on('close',_=>{
        iSend('*sshInterpreters',{interpreters:s.split('\n').filter(x=>x).map(x=>{
          let a=x.split('/')
          return a[1]==='opt'?{exe:x,ver:parseVer(a[3]),bits:+a[4],edition:a[5]}
                             :{exe:x,ver:parseVer(a[2].replace(/^Dyalog-|\.app$/g,'')),bits:64,edition:'unicode'}
        })})
        c.end()
      })
    }).on('error',x=>{iSend('*error',{msg:x.message||''+x})
                      iSend('*sshInterpreters',{interpreters:[]})})
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
module.exports=x=>{
  ;(skt=x).recv=(x,y)=>{const f=handlers[x],s=JSON.stringify([x,y]);f&&log('internal recv '+trunc(s));f?f(y):sendEach([s])}
  child&&iSend('*spawned',{pid:child.pid})
}
