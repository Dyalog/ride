#!/usr/bin/env node
'use strict'
const fs=require('fs'),path=require('path'),less=require('less'),{execSync}=require('child_process')
const sh=x=>execSync(x,{encoding:'utf8'}).replace(/[\r\n]/g,'')
const rf=x=>fs.readFileSync(x,'utf8')
const wf=(x,y)=>fs.writeFileSync(x,y)
const md=x=>{if(!fs.existsSync(x)){md(path.dirname(x));fs.mkdir(x)}}

md('build/themes')

const v=JSON.parse(rf('package.json')).version.replace(/\.0$/,'')+'.'+sh('git rev-list --count HEAD')
console.info('v'+v.replace(/\n$/,''))
wf('build/version',v)
wf('build/version.js','D='+JSON.stringify({versionInfo:{
     version:v,date:sh('git show -s HEAD --pretty=format:%ci'),rev:sh('git rev-parse HEAD')}}))

;['style','themes/classic','themes/redmond','themes/cupertino'].forEach(x=>{
  const i=`style/${x}.less`,o=`build/${x}.css`
  console.info('preprocessing '+i)
  less.render(rf(i),(e,{css})=>{if(e)throw e;wf(o,css)})
})

