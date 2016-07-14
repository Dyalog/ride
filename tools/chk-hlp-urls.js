#!/usr/bin/env node
let total=0,failed=0;D={modules:{}};require('../src/hlp')
const h=D.hlp,http=require('http'),a=Object.keys(h).map(k=>h[k]).sort(),o={host:'help.dyalog.com',port:80,path:''}
,rec=i=>{if(i>=a.length){console.log(failed?'failed:'+failed+'/'+total:'ok');return}
         o.path=escape(a[i].replace(/^http:\/\/[a-z0-9\.]+\//i,'/').replace(/#.*/,''))
         http.get(o,x=>{console.log((x.statusCode===200?'   ':x.statusCode)+' '+a[i]);rec(i+1)})
             .on('error',x=>{console.log(JSON.stringify(x.message)+' '+a[i]);rec(i+1)})}
rec(0)

