'use strict'
var fs=require('fs'),net=require('net'),os=require('os'),path=require('path'),
    cp=require('child_process'),spawn=cp.spawn,exec=cp.exec

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

var json=process.env.DYALOG_IDE_PROTOCOL==='JSON'

function b64(s){return Buffer(s).toString('base64')} // base64 encode
function b64d(s){return''+Buffer(s,'base64')}        // base64 decode
function tag(t,x){return(RegExp('^[^]*<'+t+'>([^<]*)</'+t+'>[^]*$').exec(x)||[])[1]} // extract tag t from xml string x
function addr(x){return x&&(x=x.request)&&(x=x.connection)&&x.remoteAddress||'IDE'} // human-readable repr of socket x
function extend(x,y){for(var k in y)x[k]=y[k];return x}

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

// Constants for entityType:
//                       protocol
//                        v1  v2
//   DefinedFunction       1   1
//   SimpleCharArray       2   2
//   SimpleNumericArray    4   3
//   MixedSimpleArray      8   4
//   NestedArray          16   5
//   QuadORObject         32   6
//   NativeFile           64   7
//   SimpleCharVector    128   8
//   AplNamespace        256   9
//   AplClass            512  10
//   AplInterface       1024  11
//   AplSession         2048  12
//   ExternalFunction   4096  13
var entityTypeTranslation=[1,2,4,8,16,32,64,128,256,512,1024,2048,4096]
function parseEditableEntity(xml){ // used for OpenWindow and UpdateWindow
  // v1 sample message:
  //   <ReplyUpdateWindow>
  //     <entity>
  //       <name>bnM=</name>
  //       <text>Ok5hbWVzcGFjZSBucwogICAg4oiHIGYKICAgICAgMQogICAg4oiHCiAgICDiiIcgZwogICAgICAyCiAgICDiiIcKOkVuZE5hbWVzcGFjZQ==</text>
  //       <cur_pos>4</cur_pos>
  //       <token>1</token>
  //       <bugger>0</bugger>
  //       <sub_offset>0</sub_offset>
  //       <sub_size>0</sub_size>
  //       <type>256</type>
  //       <ReadOnly>0</ReadOnly>
  //       <tid>0</tid>
  //       <tid_name>MA==</tid_name>
  //       <colours>ra2tra2tra2trQMHBwADAwMDtAMVAAMDAwMDAwUAAwMDA7QAAwMDA7QDFQADAwMDAwMFAAMDAwO0AK6urq6urq6urq6urq4A</colours>
  //       <attributes></attributes>
  //     </entity>
  //   </ReplyUpdateWindow>
  // v2 spec from http://wiki.dyalog.bramley/index.php/Ride_protocol_messages_V2#Extended_types
  //   EditableEntity => [string name, string text, int token,
  //                      byte[] colours, int currentRow, int currentColumn,
  //                      int subOffset, int subSize, bool debugger,
  //                      int tid, bool readonly, string tidName,
  //                      entityType type, lineAttributes attributes]
  //   lineAttributes => lineAttribute[int[] stop, int[] monitor, int[] trace]
  var las={stop:[],monitor:[],trace:[]} // line attributes
  var la // one of las.stop, las.monitor, las.trace
  xml.replace(/<attribute>(\w+)<\/attribute>|<row>(\d+)<\/row><value>1<\/value>/g,
              function(_,a,l){a?(la=las[a.toLowerCase()]):la.push(+l);return''})
  return{
    token:+tag('token',xml),
    name:b64d(tag('name',xml)),
    currentRow:+tag('cur_pos',xml)||0,
    "debugger":+tag('bugger',xml),
    readOnly:!!+tag('readonly',xml),
    entityType:1+entityTypeTranslation.indexOf(+tag('type',xml)),
    lineAttributes:las,
    text:b64d(tag('text',xml))
  }
}

var WHIES=['Invalid','Descalc','QuadInput','LineEditor','QuoteQuadInput','Prompt'] // consts used in ReplyAtInputPrompt

var STM=['Stop','Trace','Monitor']
function fmtLineAttrs(nLines,attrs){
  var r='<attributes>'
  for(var i=0;i<STM.length;i++){
    var k=STM[i],a=attrs[k.toLowerCase()]
    if(a){
      r+='<LineAttribute><attribute>'+k+'</attribute><values>'
      for(var l=0;l<nLines;l++)
        r+='<LineAttributeValue><row>'+l+'</row><value>'+(+(a.indexOf(l)>=0))+'</value></LineAttributeValue>'
      r+='</values></LineAttribute>'
    }
  }
  return r+='</attributes>'
}

function trunc(s){return s.length>1000?s.slice(0,997)+'...':s}

this.Proxy=function(){
  log(new Date().toISOString())
  var client, // TCP connection to interpreter
      socket, // socket.io connection to the browser that's currently driving
      child,  // a ChildProcess object, the result from spawn()
      server  // used to listen for connections from interpreters

  // This is a hack to avoid flicker when leaning on TC.
  // The interpreter sends an extra ReplyFocusWindow with win=0 (the session) after a StepInto or RunCurrentLine.
  // TODO: Remove it once there's a fix in the interpreter.
  var ignoreNextAttemptsToFocusSession=0

  function toInterpreter(s){
    if(client){
      log('to interpreter:'+trunc(JSON.stringify(s)))
      var b=Buffer(s.length+8);b.writeInt32BE(b.length,0);b.write('RIDE'+s,4);client.write(b)
    }
  }
  function cmd(c,h){ // c:command name, h:arguments as a JS object
    if(json){
      toInterpreter(JSON.stringify([c,h||{}]))
    }else{
      toInterpreter('<Command><cmd>'+c+'</cmd><id>0</id><args><'+c+'>'+(h||'')+'</'+c+'></args></Command>')
    }
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
        var m=''+queue.slice(8,n);queue=queue.slice(n);log('from interpreter:'+trunc(JSON.stringify(m)))
        if(m[0]==='{'||m[0]==='['){ // let JSON-encoded messages through
          log('to browser (JSON):'+trunc(m));var u=JSON.parse(m);socket&&socket.emit(u[0],u[1])
        }else if(!/^(?:SupportedProtocols|UsingProtocol)=1$/.test(m)){ // ignore the handshake (SupportedProtocols, etc)
          switch(m.slice(1,m.indexOf('>'))){
            case'ReplyConnect':case'ReplyEdit':case'ReplySetLineAttributes':case'ReplyWeakInterrupt':
            case'ReplyStrongInterrupt':case'ReplyUnknownRIDECommand':
              break // ignore the above commands
            case'ReplySaveChanges':
              toBrowser('ReplySaveChanges',{win:+tag('win',m),err:+tag('err',m)});break
            case'ReplyWindowTypeChanged':
              var win=+tag('Win',m)
              win?toBrowser('WindowTypeChanged',{win:win,tracer:!!+tag('bugger',m)})
                 :log("WARNING:ignoring ReplyWindowTypeChanged message with win="+win)
              break
            case'ReplyIdentify':
              toBrowser('UpdateDisplayName',{displayName:b64d(tag('Project',m))})
              toBrowser('*identify',{ // should be "Identify"
                version: tag('Version'     ,m),
                platform:tag('Platform'    ,m),
                arch:    tag('Architecture',m),
                pid:     tag('pid'         ,m),
                date:    tag('BuildDate'   ,m)
              })
              break
            case'ReplyUpdateWsid':
              var s=b64d(tag('wsid',m)),s1=s.replace(/\0/g,'')
              if(s!==s1){log('intepreter sent a wsid containing NUL characters, those will be ignored');s=s1}
              toBrowser('UpdateDisplayName',{displayName:s})
              break
            case'ReplyExecute'         :toBrowser('AppendSessionOutput',{result:b64d(tag('result',m))})    ;break
            case'ReplyGetLog'          :toBrowser('AppendSessionOutput',{result:b64d(tag('Log',m))})       ;break
            case'ReplyHadError'        :toBrowser('HadError')                                              ;break
            case'ReplyEchoInput'       :toBrowser('EchoInput',{input:b64d(tag('input',m))+'\n'})           ;break
            case'ReplyNotAtInputPrompt':toBrowser('NotAtInputPrompt')                                      ;break
            case'ReplyAtInputPrompt'   :toBrowser('AtInputPrompt',{why:WHIES.indexOf(tag('why',m))})       ;break
            case'ReplyOpenWindow'      :toBrowser('OpenWindow',parseEditableEntity(m))                     ;break
            case'ReplyUpdateWindow'    :toBrowser('UpdateWindow',parseEditableEntity(m))                   ;break
            case'ReplyFocusWindow':
              var win=+tag('win',m)
              if(!win&&ignoreNextAttemptsToFocusSession&&!process.env.DYALOG_IDE_DISABLE_FOCUS_WORKAROUND){
                ignoreNextAttemptsToFocusSession--
              } else {
                toBrowser('FocusWindow',{win:win})
              }
              break
            case'ReplyCloseWindow'     :toBrowser('CloseWindow',{win:+tag('win',m)})                       ;break
            case'ReplyGetAutoComplete':
              var o=b64d(tag('options',m))
              toBrowser('autocomplete',{token:+tag('token',m),skip:+tag('skip',m),options:o?o.split('\n'):[]})
              break
            case'ReplyHighlightLine'   :toBrowser('highlight',{win:+tag('win',m),line:+tag('line',m)})     ;break
            case'ReplyDisconnect'      :toBrowser('Disconnect',{message:b64d(tag('msg',m))})               ;break
            case'ReplySysError'        :toBrowser('SysError',{text:b64d(tag('text',m))})                   ;break
            case'ReplyInternalError':
              toBrowser('InternalError',{error:+tag('error',m),dmx:+tag('dmx',m),message:tag('msg',m)})    ;break
            case'ReplyNotificationMessage':toBrowser('NotificationMessage',{message:tag('msg',m)})         ;break
            case'ReplyShowHTML':toBrowser('ShowHTML',{title:b64d(tag('title',m)),html:b64d(tag('html',m))});break
            default:log('unrecognised');toBrowser('unrecognised',m)
          }
        }
      }
    })
    // Initial batch of commands sent to interpreter:
    toInterpreter('SupportedProtocols=1');toInterpreter('UsingProtocol=1')
    cmd('Identify',json?{identity:1}:'<Sender><Process>RIDE.EXE</Process><Proxy>0</Proxy></Sender>')
    cmd('Connect',json?{remoteId:2}:'<Token/>')
    cmd('GetWindowLayout')
  }
  function setUpBrowserConnection(){
    var listen
    var onevent=socket.onevent // intercept all browser-to-proxy events and log them:
    socket.onevent=function(x){
      log('from browser:'+trunc(JSON.stringify(x.data)))
      return json&&x.data[0][0]!=='*'?cmd(x.data[0],x.data[1]||{}):onevent.apply(socket,[x])
    }
    json||socket
      .on('Execute',function(x){cmd('Execute','<Text>'+b64(x.text)+'</Text><Trace>'+(+!!x.trace)+'</Trace>')})
      .on('Edit',function(x){cmd('Edit','<Text>'+b64(x.text)+'</Text><Pos>'+x.pos+'</Pos><Win>'+x.win+'</Win>')})
      .on('CloseWindow'   ,function(x){cmd('CloseWindow'        ,'<win>'+x.win+'</win>')})
      .on('RunCurrentLine',function(x){cmd('DebugRunLine'       ,'<win>'+x.win+'</win>');ignoreNextAttemptsToFocusSession++})
      .on('StepInto'      ,function(x){cmd('DebugStepInto'      ,'<win>'+x.win+'</win>');ignoreNextAttemptsToFocusSession++})
      .on('TraceBackward' ,function(x){cmd('DebugBackward'      ,'<win>'+x.win+'</win>')})
      .on('TraceForward'  ,function(x){cmd('DebugForward'       ,'<win>'+x.win+'</win>')})
      .on('ContinueTrace' ,function(x){cmd('DebugContinueTrace' ,'<win>'+x.win+'</win>')})
      .on('Continue'      ,function(x){cmd('DebugContinue'      ,'<win>'+x.win+'</win>')})
      .on('RestartThreads',function(x){cmd('DebugRestartThreads','<win>'+x.win+'</win>')})
      .on('Cutback'       ,function(x){cmd('DebugCutback'       ,'<win>'+x.win+'</win>')})
      .on('WeakInterrupt'  ,function(){cmd('WeakInterrupt'  )})
      .on('StrongInterrupt',function(){cmd('StrongInterrupt')})
      .on('GetAutoComplete',function(x){
        cmd('GetAutoComplete','<line>'+b64(x.line)+'</line><pos>'+x.pos+'</pos><token>'+x.token+'</token>')
      })
      .on('SaveChanges',function(x){
        cmd('SaveChanges','<win>'+x.win+'</win><Text>'+b64(x.text)+'</Text>'+fmtLineAttrs(x.text.split('\n').length,x.attributes))
      })
      .on('SetLineAttributes',function(x){
        cmd('SetLineAttributes','<win>'+x.win+'</win>'+fmtLineAttrs(x.nLines,x.lineAttributes))
      })
      .on('SetPW',function(x){cmd('SetPW','<pw>'+x.pw+'</pw>')})
      .on('Exit',function(x){cmd('Exit','<code>'+x.code+'</code>')})

      // "disconnect" is a built-in socket.io event
      .on('disconnect',function(x){log(addr(this)+' disconnected');socket===this&&(socket=null)})
    socket // proxy management events that don't reach the interpreter start with a '*'
      .on('*connect',function(x){
        client=net.connect({host:x.host,port:x.port},function(){toBrowser('*connected',{host:x.host,port:x.port})})
        setUpInterpreterConnection()
      })
      .on('*spawn',function(x){
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
            child=spawn(exe,args,{stdio:stdio,env:extend(process.env,{RIDE_INIT:'CONNECT:'+hp,RIDE_SPAWNED:'1'})})
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
        server.listen(x.port,x.host||'::',function(){
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
            exec('reg query "HKEY_CURRENT_USER\\Software\\Dyalog" /s /v localdyalogdir',{timeout:2000},
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
  return function(newSocket){log(addr(newSocket)+' connected');socket=newSocket;setUpBrowserConnection()}
}
