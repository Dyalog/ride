#!/usr/bin/env node
let http=require('http')
D={};require('../client/helpurls');let h=D.helpurls
let a=Object.keys(h).map((k)=>h[k]).sort()
let o={host:'help.dyalog.com',port:80,path:''}
let rec=(i)=>{
  if(i<a.length){
    o.path=escape(a[i].replace(/^http:\/\/[a-z0-9\.]+\//i,'/').replace(/#.*/,''))
    http.get(o,(r)=>{console.log((r.statusCode===200?'   ':r.statusCode)+' '+a[i]);rec(i+1)})
        .on('error',(e)=>{console.log(JSON.stringify(e.message)+' '+a[i]);rec(i+1)})
  }
}
rec(0)
