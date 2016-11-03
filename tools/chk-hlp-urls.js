#!/usr/bin/env node
D={modules:{}};require('../src/hlp');let n=0,m=0; //n:total,m:failed
const h=D.hlp,http=require('http'),a=Object.keys(h).map(k=>h[k]).sort(),o={host:'help.dyalog.com',port:80,path:''}
,rec=i=>{if(i>=a.length){console.log(m?'failed:'+m+'/'+n:'ok');return}
         n++;o.path=escape(a[i].replace(/^http:\/\/[a-z0-9\.]+\//i,'/').replace(/#.*/,''))
         http.get(o,x=>{let c=x.statusCode;console.log((c===200?'   ':c)+' '+a[i]);m+=c!==200;rec(i+1)})
             .on('error',x=>{console.log(JSON.stringify(x.message)+' '+a[i]);m++;rec(i+1)})}
rec(0)

