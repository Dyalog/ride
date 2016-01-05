'use strict'
var fs=require('fs'),net=require('net'),os=require('os'),path=require('path'),cp=require('child_process')
var log=this.log=(function(){
  var t0=+new Date, // timestamps will be number of milliseconds since t0
      N=500,T=1000, // record no more than N log messages per T milliseconds
      n=0,t=0,      // at any moment, there have been n messages since time t
      stdoutIsGood=1
  return function(s){ // the actual log() function
    var t1=+new Date;if(t1-t>T){t=t1;n=1} // if last message was too long ago, start counting afresh
    var m= ++n<N ? (t1-t0)+': '+s+'\n' : n===N ? '... logging temporarily suppressed\n' : 0
    if(m){
      if(stdoutIsGood)try{process.stdout&&process.stdout.write&&process.stdout.write(m)}catch(_){stdoutIsGood=0}
      var ls=log.listeners.slice(0) // make a copy of the listeners array, it may get modified as we are processing it
      for(var i=0;i<ls.length;i++)ls[i](m) // notify listeners
    }
  }
}())
log.listeners=[]
;(function(){
  var f=process.env.DYALOG_IDE_LOG
  if(f){ // if $DYALOG_IDE_LOG is present, also log to a file (in addition to stdout)
    var h=process.env.HOME||process.env.USERPROFILE;if(h)f=path.resolve(h,f)
    fd=fs.openSync(f,'a');log.listeners.push(function(s){var b=Buffer(m);fs.writeSync(fd,b,0,b.length)})
  }
  if(typeof window!=='undefined'){ // are we running under NW.js as opposed to just NodeJS?
    var i=0,a=Array(1000)          // if so, store latest log messages in RAM
    log.get=function(){return a.slice(i).concat(a.slice(0,i))}
    log.listeners.push(function(s){a[i++]=s;i%=a.length})
  }
}())
function addr(x){return x&&(x=x.request)&&(x=x.connection)&&x.remoteAddress||'IDE'} // human-readable repr of socket x
function trunc(s){return s.length>1000?s.slice(0,997)+'...':s}
var ipAddresses=[]
;(function(){
  try{
    var ni=os.networkInterfaces()
    for(var k in ni){
      var a=ni[k]
      for(var i=0;i<a.length;i++)if(a[i].family==='IPv4'&&!a[i].internal)ipAddresses.push(a[i].address)
    }
  }catch(e){
    log('cannot determine ip addresses: '+e)
  }
})()
this.Proxy=function(){
  log(new Date().toISOString())
  var client, // TCP connection to interpreter
      socket, // socket.io connection to the browser that's currently driving
      child,  // a ChildProcess object, the result from spawn()
      server  // used to listen for connections from interpreters
  function toInterpreter(s){
    if(client){
      log('to interpreter:'+trunc(s))
      var b=Buffer('xxxxRIDE'+s);b.writeInt32BE(b.length,0);client.write(b)
    }
  }
  function cmd(c,h){ // c:command name, h:arguments as a JS object
    toInterpreter(JSON.stringify([c,h||{}]))
  }
  function toBrowser(x,y){log('to browser:'+trunc(JSON.stringify([x,y])));socket&&socket.emit(x,y)}
  function setUpInterpreterConnection(){
    client.on('error',function(e){toBrowser('*connectError',{err:''+e});client=null})
    client.on('end',function(){log('interpreter diconnected');toBrowser('*disconnected');client=null})
    var queue=Buffer(0)
    client.on('data',function(data){
      queue=Buffer.concat([queue,data])
      var n
      while(queue.length>=4&&(n=queue.readInt32BE(0))<=queue.length){
        var m=''+queue.slice(8,n);queue=queue.slice(n);log('from interpreter:'+trunc(m))
        if(m[0]!=='[')continue // ignore handshake
        log('to browser:'+trunc(m));var u=JSON.parse(m)
        socket&&socket.emit(u[0],u[1])
      }
    })
    // Initial batch of commands sent to interpreter:
    toInterpreter('SupportedProtocols=1');toInterpreter('UsingProtocol=1')
    cmd('Identify',{identity:1});cmd('Connect',{remoteId:2});cmd('GetWindowLayout')
  }
  function setUpBrowserConnection(){
    var listen
    var onevent=socket.onevent // intercept all browser-to-proxy events and log them:
    socket.onevent=function(x){
      log('from browser:'+trunc(JSON.stringify(x.data)))
      return x.data[0][0]!=='*'?cmd(x.data[0],x.data[1]||{}):onevent.apply(socket,[x])
    }
    socket // proxy management events that don't reach the interpreter start with a '*'
      .on('*connect',function(x){
        client=net.connect({host:x.host,port:x.port},function(){toBrowser('*connected',{host:x.host,port:x.port})})
        setUpInterpreterConnection()
      })
      .on('*launch',function(x){
        var exe=(x||{}).exe||process.env.DYALOG_IDE_INTERPRETER_EXE||'dyalog'
        server=net.createServer(function(c){
          log('spawned interpreter connected');var a=server.address();server&&server.close();server=null;client=c
          toBrowser('*connected',{host:a.address,port:a.port});setUpInterpreterConnection()
          if(typeof window!=='undefined')window.D.lastSpawnedExe=exe
        })
        server.on('error',function(err){
          log('cannot listen for connections from spawned interpreter: '+err)
          server=client=null;toBrowser('*listenError',{err:''+err})
        })
        server.listen(0,'127.0.0.1',function(){
          var a=server.address(),hp=a.address+':'+a.port
          log('listening for connections from spawned interpreter on '+hp)
          log('spawning interpreter '+JSON.stringify(exe))
          var args=['+s','-q'],stdio=['pipe','ignore','ignore']
          if(/^win/i.test(process.platform)){args=[];stdio[0]='ignore'}
          try{
            var h=x.env||{},H=process.env;for(var k in H)h[k]=H[k];h.RIDE_INIT='CONNECT:'+hp;h.RIDE_SPAWNED='1'
            child=cp.spawn(exe,args,{stdio:stdio,env:h})
          }catch(e){
            toBrowser('*spawnedError',{code:0,message:''+e});return
          }
          toBrowser('*spawned',{exe:exe,pid:child.pid})
          child.on('error',function(err){
            server&&server.close();server=client=child=null
            toBrowser('*spawnedError',{
              code:err.code,message:err.code==='ENOENT'?"Cannot find the interpreter's executable":''+err
            })
          })
          child.on('exit',function(code,signal){
            server&&server.close();server=client=null;toBrowser('*spawnedExited',{code:code,signal:signal});child=null
          })
        })
      })
      .on('*listen',listen=function(x){
        server=net.createServer(function(c){
          var t,remoteHost=c&&(t=c.request)&&(t=t.connection)&&t.remoteAddress
          log('interpreter connected from '+remoteHost);server&&server.close();server=null;client=c
          toBrowser('*connected',{host:remoteHost,port:x.port});setUpInterpreterConnection()
        })
        server.on('error',function(err){server=null;toBrowser('*listenError',{err:''+err})})
        server.listen(x.port,x.host||'',function(){
          log('listening for connections from interpreter on port '+x.port);x.callback&&x.callback()
        })
      })
      .on('*listenCancel',function(){server&&server.close()})
      .on('*getProxyInfo',function(){
        // List available interpreter executables, possible paths are:
        //   C:\Program Files\Dyalog\Dyalog APL $VERSION\dyalog.exe
        //   C:\Program Files\Dyalog\Dyalog APL $VERSION unicode\dyalog.exe
        //   C:\Program Files\Dyalog\Dyalog APL-64 $VERSION\dyalog.exe
        //   C:\Program Files\Dyalog\Dyalog APL-64 $VERSION unicode\dyalog.exe
        //   C:\Program Files (x86)\Dyalog\Dyalog APL $VERSION\dyalog.exe
        //   C:\Program Files (x86)\Dyalog\Dyalog APL $VERSION unicode\dyalog.exe
        //   /opt/mdyalog/$VERSION/[64|32]/[classic|unicode]/mapl
        //   /Applications/Dyalog-$VERSION/Contents/Resources/Dyalog/mapl
        var interpreters=[]
        function parseVersion(s){return s.split('.').map(function(x){return+x})}
        if(/^win/.test(process.platform)){
          try {
            cp.exec('reg query "HKEY_CURRENT_USER\\Software\\Dyalog" /s /v localdyalogdir',{timeout:2000},
              function(err,s){
                var bits,edition,version,m
                if(!err){
                  var lines=s.split('\r\n')
                  for(var i=0;i<lines.length;i++)if(lines[i]){
                    if(m=/^HK.*\\Dyalog APL\/W(-64)? (\d+\.\d+)( Unicode)?$/i.exec(lines[i])){
                      bits=m[1]?64:32;version=m[2];edition=m[3]?'unicode':'classic'
                    }else if(version&&(m=/^ *localdyalogdir +REG_SZ +(\S.*)$/i.exec(lines[i]))){
                      interpreters.push({exe:m[1]+'dyalog.exe',version:parseVersion(version),bits:bits,edition:edition})
                    }else if(!/^\s*$/.test(lines[i])){
                      bits=version=edition=null
                    }
                  }
                }
                toBrowser('*proxyInfo',{ipAddresses:ipAddresses,interpreters:interpreters,platform:process.platform})
              }
            )
          }catch(ex){
            console.error(ex)
            toBrowser('*proxyInfo',{ipAddresses:ipAddresses,interpreters:interpreters,platform:process.platform})
          }
        }else if(process.platform==='darwin'){
          try{
            var a='/Applications',ls=fs.readdirSync(a),m
            for(var i=0;i<ls.length;i++)if(m=/^Dyalog-(\d+\.\d+)\.app$/.exec(ls[i])){
              var exe=a+'/'+ls[i]+'/Contents/Resources/Dyalog/mapl'
              fs.existsSync(exe)&&interpreters.push({exe:exe,version:parseVersion(m[1]),bits:64,edition:'unicode'})
            }
          }catch(_){}
          toBrowser('*proxyInfo',{ipAddresses:ipAddresses,interpreters:interpreters,platform:process.platform})
        }else{
          try{
            var a='/opt/mdyalog',versions=fs.readdirSync(a)
            for(var i=0;i<versions.length;i++){
              var version=versions[i]
              if(/^\d+\.\d+/.test(version)){
                try{
                  var bitss=fs.readdirSync(a+'/'+version)
                  for(var j=0;j<bitss.length;j++){
                    var bits=+bitss[j]
                    if(bits===64||bits===32){
                      try{
                        var editions=fs.readdirSync(a+'/'+version+'/'+bits)
                        for(var k=0;k<editions.length;k++){
                          var edition=editions[k]
                          if(edition==='unicode'||edition==='classic'){
                            var exe=a+'/'+version+'/'+bits+'/'+edition+'/mapl'
                            fs.existsSync(exe)&&
                              interpreters.push({exe:exe,version:parseVersion(version),bits:bits,edition:edition})
                          }
                        }
                      }catch(_){}
                    }
                  }
                }catch(_){}
              }
            }
          }catch(_){}
          toBrowser('*proxyInfo',{ipAddresses:ipAddresses,interpreters:interpreters,platform:process.platform})
        }
      })
    child&&toBrowser('*spawned',{pid:child.pid})
  }

  // this function is the result from calling Proxy()
  return function(x){log(addr(x)+' connected');socket=x;setUpBrowserConnection()}
}
