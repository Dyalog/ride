#!/usr/bin/env node
var http=require('http')
D={};require('../client/helpurls');var h=D.helpurls
var a=Object.keys(h).map(function(k){return h[k]}).sort()
var o={host:'help.dyalog.com',port:80,path:''}
function rec(i){
  if(i<a.length){
    o.path=escape(a[i].replace(/^http:\/\/[a-z0-9\.]+\//i,'/').replace(/#.*/,''))
    http.get(o,function(r){console.log((r.statusCode===200?'   ':r.statusCode)+' '+a[i]);rec(i+1)})
      .on('error',function(e){console.log(JSON.stringify(e.message)+' '+a[i]);rec(i+1)})
  }
}
rec(0)
