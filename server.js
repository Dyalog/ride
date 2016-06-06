#!/usr/bin/env node
// $RIDE_SERVER_WATCH=1     watch for changes and rebuild automatically (useful for development)
// $RIDE_SERVER_INSECURE=1  use http (on port 8000) instead of https (on port 8443)
// $RIDE_SERVER_IPV6=1      use IPv6
'use strict'
const compression=require('compression'),express=require('express'),fs=require('fs'),http=require('http'),
  https=require('https'),WSServer=require('ws').Server,proxy=require('./proxy'),{spawn}=require('child_process')
const _d=__dirname,t0=+new Date,log=(s)=>{process.stdout.write((new Date-t0)+': '+s+'\n')}
let tid,busy
const build=()=>{
  if(busy){tid=setTimeout(build,100);return}
  log('building');tid=0;busy=1;spawn(_d+'/mk',{cwd:_d,stdio:'inherit'}).on('close',()=>{log('done');busy=0})
}
if(process.env.RIDE_SERVER_WATCH){
  ;['.','src','style','style/img','style/themes']
    .forEach((x)=>{fs.watch(_d+'/'+x,()=>{tid=tid||setTimeout(build,100)})})
  build()
}

const app=express()
app.disable('x-powered-by')
app.use((req,res,next)=>{log(req.method+' '+req.path);next()})
app.use(compression())
app.use('/',express.static('.'))
const insecure=process.env.RIDE_SERVER_INSECURE
const port=insecure?8000:8443
const server=insecure?http.createServer(app)
                     :https.createServer({cert:fs.readFileSync('ssl/cert.pem'),key:fs.readFileSync('ssl/key.pem')},app)
;(new WSServer({server:server})).on('connection',(ws)=>{
  const l={},io={} // l:listeners, io:socket.io-like interface
  io.emit=(x,y)=>{ws.send(JSON.stringify([x,y]));return io}
  io.on=(e,f)=>{(l[e]=l[e]||[]).push(f);return io}
  io.onevent=(x)=>{const a=l[x.data[0]]||[];for(let i=0;i<a.length;i++)a[i].apply(null,x.data.slice(1))}
  ws.on('message',(m)=>{io.onevent({data:JSON.parse(m)})})
  proxy(io)
})
server.listen(port,process.env.RIDE_SERVER_IPV6?'::':'0.0.0.0',()=>{log('server started on port '+port)})
