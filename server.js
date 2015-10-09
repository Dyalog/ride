#!/usr/bin/env node
'use strict'
var compression=require('compression'),express=require('express'),fs=require('fs'),http=require('http'),
    https=require('https'),nomnom=require('./nomnom'),WSServer=require('ws').Server,
    Proxy=require('./proxy').Proxy,spawn=require('child_process').spawn

var t0=+new Date
function log(s){process.stdout.write((new Date-t0)+': '+s+'\n')}

var opts=nomnom.options({
  cert:{metavar:'FILE',help:'PEM-encoded certificate for https','default':'ssl/cert.pem'},
  key:{metavar:'FILE',help:'PEM-encoded private key for https','default':'ssl/key.pem'},
  insecure:{flag:true,help:'use http (on port 8000) instead of https (on port 8443)'},
  ipv6:{abbr:'6',flag:true,help:'use IPv6'},
  watch:{abbr:'w',flag:true,help:'watch for changes and rebuild (useful for development)'}
}).parse()

if(opts.watch){
  var _d=__dirname, tid, isRunning
  function build(){
    if(isRunning){
      tid=setTimeout(build,100)
    }else{
      log('building');tid=0;isRunning=1
      spawn(_d+'/build.sh',{cwd:_d,stdio:'inherit'}).on('close',function(){log('build done');isRunning=0})
    }
  }
  ;['.','client','style','style/themes'].forEach(function(x){
    fs.watch(_d+'/'+x,function(){tid=tid||setTimeout(build,100)})
  })
}

var app=express()
app.disable('x-powered-by')
app.use(function(req,res,next){log(req.method+' '+req.path);next()})
app.use(compression())
app.use('/',express.static('build/static'))
var port=opts.insecure?8000:8443
var server=opts.insecure?http.createServer(app)
                        :https.createServer({cert:fs.readFileSync(opts.cert),key:fs.readFileSync(opts.key)},app)
var proxy=Proxy()
;(new WSServer({server:server})).on('connection',function(ws){
  var l={},io={} // l:listeners, io:socket.io-like interface
  io.emit=function(x,y){ws.send(JSON.stringify([x,y]));return io}
  io.on=function(e,f){(l[e]=l[e]||[]).push(f);return io}
  io.onevent=function(x){var a=l[x.data[0]]||[];for(var i=0;i<a.length;i++)a[i].apply(null,x.data.slice(1))}
  ws.on('message',function(m){io.onevent({data:JSON.parse(m)})})
  proxy(io)
})
server.listen(port,opts.ipv6?'::':'0.0.0.0',function(){log('listening on port '+port)})
