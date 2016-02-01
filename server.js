#!/usr/bin/env node

// Environment variables:
//   RIDE_SERVER_WATCH=1     watch for changes and rebuild automatically (useful for development)
//   RIDE_SERVER_INSECURE=1  use http (on port 8000) instead of https (on port 8443)
//   RIDE_SERVER_IPV6=1      use IPv6

'use strict'
var compression=require('compression'),express=require('express'),fs=require('fs'),http=require('http'),
    https=require('https'),WSServer=require('ws').Server,
    Proxy=require('./proxy').Proxy,spawn=require('child_process').spawn

var t0=+new Date
function log(s){process.stdout.write((new Date-t0)+': '+s+'\n')}

var _d=__dirname,tid,busy
function build(){
  if(busy){tid=setTimeout(build,100);return}
  log('building');tid=0;busy=1;spawn(_d+'/build.sh',{cwd:_d,stdio:'inherit'}).on('close',function(){log('done');busy=0})
}
if(process.env.RIDE_SERVER_WATCH){
  ;['.','client','style','style/img','style/themes'].forEach(function(x){
    fs.watch(_d+'/'+x,function(){tid=tid||setTimeout(build,100)})
  })
  build()
}

var app=express()
app.disable('x-powered-by')
app.use(function(req,res,next){log(req.method+' '+req.path);next()})
app.use(compression())
app.use('/',express.static('build/static'))
var insecure=process.env.RIDE_SERVER_INSECURE
var port=insecure?8000:8443
var server=insecure?http.createServer(app)
             :https.createServer({cert:fs.readFileSync('ssl/cert.pem'),key:fs.readFileSync('ssl/key.pem')},app)
var proxy=Proxy()
;(new WSServer({server:server})).on('connection',function(ws){
  var l={},io={} // l:listeners, io:socket.io-like interface
  io.emit=function(x,y){ws.send(JSON.stringify([x,y]));return io}
  io.on=function(e,f){(l[e]=l[e]||[]).push(f);return io}
  io.onevent=function(x){var a=l[x.data[0]]||[];for(var i=0;i<a.length;i++)a[i].apply(null,x.data.slice(1))}
  ws.on('message',function(m){io.onevent({data:JSON.parse(m)})})
  proxy(io)
})
server.listen(port,process.env.RIDE_SERVER_IPV6?'::':'0.0.0.0',function(){log('server started on port '+port)})
