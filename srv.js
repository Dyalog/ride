#!/usr/bin/env node
'use strict'
const rq=require,express=rq('express'),fs=rq('fs')
if(!fs.exists(__dirname+'/_')){console.log('ERROR: please build RIDE first with "node mk"');process.exit(1)}
const app=express(),port=8443,cert=fs.readFileSync('ssl/cert.pem'),key=fs.readFileSync('ssl/key.pem')
app.disable('x-powered-by')
app.use((x,_,f)=>{console.log(x.method+' '+x.path);f()})
app.use(rq('compression')())
app.use('/',express.static('.'))
const server=rq('https').createServer({cert,key},app)
;(new rq('ws').Server({server})).on('connection',ws=>{
  const l={},io={} //l:listeners, io:socket.io-like interface
  io.emit=(x,y)=>{ws.send(JSON.stringify([x,y]));return io}
  io.on=(e,f)=>{(l[e]=l[e]||[]).push(f);return io}
  io.onevent=x=>{const a=l[x.data[0]]||[];for(let i=0;i<a.length;i++)a[i].apply(null,x.data.slice(1))}
  ws.on('message',x=>{io.onevent({data:JSON.parse(x)})})
  rq('./proxy')(io)
})
server.listen(port,()=>{console.log('http server listening on port '+port)})
