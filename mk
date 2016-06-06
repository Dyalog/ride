#!/usr/bin/env node
'use strict'
const rq=require,fs=rq('fs'),path=rq('path'),less=rq('less'),{execSync}=rq('child_process'),async=rq('async')
,sh=x=>execSync(x,{encoding:'utf8'}).replace(/[\r\n]/g,'')      // shell
,rf=x=>fs.readFileSync(x,'utf8')                                // read file
,wf=(x,y)=>fs.writeFileSync(x,y)                                // write file
,md=x=>{if(!fs.existsSync(x)){md(path.dirname(x));fs.mkdir(x)}} // mkdir -p
,nt=(x,y)=>!fs.existsSync(y)||fs.statSync(x)>fs.statSync(y)     // newer than
,rm=x=>{if(!fs.existsSync(x))return
        fs.readdirSync(x).forEach(y=>{y=x+'/'+y;fs.lstatSync(y).isDirectory()?rm(y):fs.unlinkSync(y)})
        fs.rmdirSync(x)}
,v=JSON.parse(rf('package.json')).version.replace(/\.0$/,'')+'.'+sh('git rev-list --count HEAD') // version string
,tasks={}

tasks.build=f=>{
  md('build/themes')
  console.info('v'+v)
  wf('build/version',v)
  wf('build/version.js','D='+JSON.stringify({versionInfo:{
       version:v,date:sh('git show -s HEAD --pretty=format:%ci'),rev:sh('git rev-parse HEAD')}}))
  async.each(['style','themes/classic','themes/redmond','themes/cupertino'],
    (x,f)=>{
      const i=`style/${x}.less`,o=`build/${x}.css`
      if(!nt(i,o)){f();return}
      console.info('preprocessing '+i)
      less.render(rf(i),(e,{css})=>{if(e)throw e;wf(o,css);f()})
    },
    e=>{f&&f(e)}
  )
}

const pkg=(x,y,f)=>{
  rq('electron-packager')(
    {dir:'.',platform:x,arch:y,out:'build/ride',overwrite:true,'download.cache':'cache',icon:'favicon.ico',
      ignore:'cache',
      'app-copyright':`(c) 2014-${new Date().getFullYear()} Dyalog Ltd`,
      'app-version':v,
      'build-version':v,
      'version-string.CompanyName':'Dyalog Ltd',
      'version-string.FileDescription':'Remote Integrated Development Environment for Dyalog APL',
      'version-string.OriginalFilename':'ride.exe',
      'version-string.ProductName':'RIDE',
      'version-string.InternalName':'RIDE'},
    e=>{f&&f(e)}
  )
}
tasks.l=tasks.linux=f=>{pkg('linux' ,'x64' ,f)}
tasks.w=tasks.win  =f=>{pkg('win32' ,'ia32',f)}
tasks.o=tasks.osx  =f=>{pkg('darwin','x64' ,f)}
tasks.dist=f=>{tasks.build(e=>{e?f(e):async.parallel([tasks.l,tasks.w,tasks.o],e=>{f(e)})})}

tasks.clean=f=>{rm('build')}

async.each(process.argv.length>2?process.argv.slice(2):['build'],
           (x,f)=>{if(tasks[x]){tasks[x](f)}
                   else{process.stderr.write(`ERROR: no task named ${JSON.stringify(x)}\n`);process.exit(1)}},
           e=>{if(e)throw e})
