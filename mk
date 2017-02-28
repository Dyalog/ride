#!/usr/bin/env node
//instead of a Makefile
'use strict';process.chdir(__dirname)
const rq=require,fs=rq('fs'),path=rq('path'),{execSync}=rq('child_process'),async=rq('async')
,sh=x=>execSync(x,{encoding:'utf8'}).replace(/[\r\n]/g,'')          //exec in shell
,rf=x=>fs.readFileSync(x,'utf8')                                    //read file
,wf=(x,y)=>fs.writeFileSync(x,y)                                    //write file
,mv=(x,y)=>fs.renameSync(x,y)                                       //move/rename file
,md=x=>{if(!fs.existsSync(x)){md(path.dirname(x));fs.mkdirSync(x)}} //mkdir -p
,nt=(x,y)=>!fs.existsSync(y)||fs.statSync(x)>fs.statSync(y)         //newer than
,rm=x=>{try{var s=fs.lstatSync(x)}catch(_){}
        if(s){if(s.isDirectory()){fs.readdirSync(x).map(y=>rm(x+'/'+y));fs.rmdirSync(x)}else{fs.unlinkSync(x)}}}
,pj=JSON.parse(rf('package.json'))
//v:version string - "x.y.z" where z is the number of commits since the beginning of the project
,v=pj.version.replace(/\.0$/,'')+'.'+sh('git rev-list --count HEAD')
,tasks={}

let buildDone=0
tasks.b=tasks.build=f=>{
  if(buildDone){f();return}
  md('_');wf('_/version',v);console.info('v'+v)
  wf('_/version.js','D='+JSON.stringify({versionInfo:{
       version:v,date:sh('git show -s HEAD --pretty=format:%ci'),rev:sh('git rev-parse HEAD')}}))
  buildDone=1;f()
}

const incl=['','/empty.html','/index.html','/status.html','/main.js','/package.json']
const namev='ride'+v.split('.').slice(0,2).join('')
,pkg=(x,y,f)=>{rq('electron-packager')(
  {dir:'.',platform:x,arch:y,out:'_/'+namev,overwrite:true,'download.cache':'cache',icon:'D',tmpdir:false,
    ignore:p=>!incl.includes(p)&&!/^\/(src|style|lib|node_modules|_)(\/|$)/.test(p)&&!(x==='win32'&&/^\/windows-ime(\/|$)/.test(p)),
    'app-copyright':`(c) 2014-${new Date().getFullYear()} Dyalog Ltd`,
    'app-version':v,
    'build-version':v,
    'version-string':{ //ends up in Windows Explorer's right click > Properties
      CompanyName:'Dyalog Ltd',
      FileDescription:'Remote Integrated Development Environment for Dyalog APL',
      OriginalFilename:namev+'.exe',
      ProductName:'RIDE',
      InternalName:'RIDE'}},
  e=>{const d='_/'+namev+'/'+pj.productName+'-'+x+'-'+y;rm(d+'/version')
      fs.existsSync(d+'/LICENSE')&&mv(d+'/LICENSE',d+'/LICENSE.electron')
      f&&f(e)}
)}
tasks.l=tasks.linux=f=>{tasks.build(e=>e?f(e):pkg('linux' ,'x64'   ,f))}
tasks.w=tasks.win  =f=>{tasks.build(e=>e?f(e):pkg('win32' ,'ia32'  ,f))}
tasks.o=tasks.osx  =f=>{tasks.build(e=>e?f(e):pkg('darwin','x64'   ,f))}
tasks.a=tasks.arm  =f=>{tasks.build(e=>e?f(e):pkg('linux' ,'armv7l',f))}
tasks.d=tasks.dist=f=>{async.series([tasks.l,tasks.w,tasks.o,tasks.a],e=>{f(e)})}

tasks.c=tasks.clean=f=>{rm('_');f()}

async.each(process.argv.length>2?process.argv.slice(2):['build'],
           (x,f)=>{if(tasks[x]){tasks[x](f)}
                   else{process.stderr.write(`ERROR: no task named ${JSON.stringify(x)}\n`);process.exit(1)}},
           e=>{if(e)throw e})
