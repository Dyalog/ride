#!/usr/bin/env node
var compression=require('compression'),express=require('express'),fs=require('fs'),http=require('http'),
    https=require('https'),engine=require('engine.io'),nomnom=require('./nomnom'),
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
      spawn(_d+'/build-server.sh',{cwd:_d,stdio:'inherit'}).on('close',function(){log('build done');isRunning=0})
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
server.listen(port,opts.ipv6?'::':'0.0.0.0',function(){log('server listening on :'+port)})
engine.attach(server).on('connection',Proxy())
