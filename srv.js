#!/usr/bin/env node
//a webserver that starts the interpreter and serves RIDE for web browsers at https://127.0.0.1:8443/

//We're planning to put such a web server in the interpreter itself - the "zero footprint" version of RIDE.
//Once Bjørn & Morten are satisfied with "zero footprint" RIDE, this file will become unnecessary - please delete it.

'use strict'
const rq=require,express=rq('express'),fs=rq('fs'),log=x=>{console.log(x)},cp=rq('child_process')
if(!fs.existsSync(__dirname+'/_')){log('ERROR: please build ride with "node mk" first');process.exit(1)}
const app=express(),port=8443,cert=fs.readFileSync('ssl/cert.pem'),key=fs.readFileSync('ssl/key.pem')
app.disable('x-powered-by');app.use((x,_,f)=>{log(x.method+' '+x.path);f()})
app.use(rq('compression')());app.use('/',express.static('.'))
const hsrv=rq('https').createServer({cert,key},app)
let wskt,ws=rq('ws') //websocket connection
;(new ws.Server({server:hsrv})).on('connection',x=>{wskt=x;x.on('message',y=>sendEach([y]))})
hsrv.listen(port,_=>log('http server listening on port '+port))
const maxl=100,trunc=x=>x.length>maxl?x.slice(0,maxl-3)+'...':x //helper for logging
,toBuf=x=>{const b=Buffer('xxxxRIDE'+x);b.writeInt32BE(b.length,0);return b} //serialize in a RIDE protocol envelope
,sendEach=x=>{if(clt){x.forEach(y=>log('send '+trunc(y)));clt.write(Buffer.concat(x.map(toBuf)))}}
let clt,srv=rq('net').createServer(x=>{
  clt=x;srv.close();srv=0;log('interpreter connected');clt.on('end',_=>log('interpreter diconnected'))
  let q=Buffer(0)
  clt.on('data',x=>{
    q=Buffer.concat([q,x]);let n
    while(q.length>=4&&q.length>=(n=q.readInt32BE(0)))
      {const m=''+q.slice(8,n);q=q.slice(n);log('recv '+trunc(m));m[0]==='['&&wskt&&wskt.send(m)}
  })
})
srv.listen(0,'127.0.0.1',_=>{
  const a=srv.address(),hp=a.address+':'+a.port,exe=process.env.RIDE_SPAWN||'dyalog'
  let args=['+s','-q'],stdio=['pipe','ignore','ignore'];if(/^win/i.test(process.platform)){args=[];stdio[0]='ignore'}
  const env={},H=process.env;for(let k in H)env[k]=H[k];env.RIDE_INIT='CONNECT:'+hp;env.RIDE_SPAWNED='1'
  cp.spawn(exe,args,{stdio,env});log('spawned interpreter '+JSON.stringify(exe)+', expecting it to connect back to '+hp)
})
