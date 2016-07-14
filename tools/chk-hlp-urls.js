#!/usr/bin/env node
const http=require('http')
D={modules:{}};require('../src/hlp');const h=D.hlp
const a=Object.keys(h).map(k=>h[k]).sort(),o={host:'help.dyalog.com',port:80,path:''}
const rec=i=>{
  if(i>=a.length)return
  o.path=escape(a[i].replace(/^http:\/\/[a-z0-9\.]+\//i,'/').replace(/#.*/,''))
  http.get(o,r=>{console.log((r.statusCode===200?'   ':r.statusCode)+' '+a[i]);rec(i+1)})
      .on('error',e=>{console.log(JSON.stringify(e.message)+' '+a[i]);rec(i+1)})
}
rec(0)
