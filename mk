#!/usr/bin/env node
//instead of a Makefile
'use strict';process.chdir(__dirname)
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

tasks.b=tasks.build=f=>{
  md('_/thm')
  console.info('v'+v)
  wf('_/version',v)
  wf('_/version.js','D='+JSON.stringify({versionInfo:{
       version:v,date:sh('git show -s HEAD --pretty=format:%ci'),rev:sh('git rev-parse HEAD')}}))
  async.each(['style','thm/classic','thm/redmond','thm/cupertino'],
    (x,f)=>{
      const i=`style/${x}.less`,o=`_/${x}.css`
      if(!nt(i,o)){f();return}
      console.info('preprocessing '+i)
      less.render(rf(i),(e,{css})=>{if(e)throw e;wf(o,css);f()})
    },
    e=>{f&&f(e)}
  )
}

const pkg=(x,y,f)=>{
  rq('electron-packager')(
    {dir:'.',platform:x,arch:y,out:'_/ride',overwrite:true,'download.cache':'cache',icon:'favicon.ico',
      ignore:x=>
        !/^\/[^\/\.]+\.(html|js|json)$/.test(x)&&
        !/^\/(src|style|lib|_)(\/|$)/.test(x)&&
        !['/node_modules',
          '/node_modules/jquery',
          '/node_modules/jquery/dist',
          '/node_modules/jquery/dist/jquery.min.js',
          '/node_modules/codemirror',
          '/node_modules/codemirror/lib',
          '/node_modules/codemirror/lib/codemirror.js',
          '/node_modules/codemirror/addon',
          '/node_modules/codemirror/addon/dialog',
          '/node_modules/codemirror/addon/dialog/dialog.js',
          '/node_modules/codemirror/addon/search',
          '/node_modules/codemirror/addon/search/searchcursor.js',
          '/node_modules/codemirror/addon/scroll',
          '/node_modules/codemirror/addon/scroll/annotatescrollbar.js',
          '/node_modules/codemirror/addon/search',
          '/node_modules/codemirror/addon/search/matchesonscrollbar.js',
          '/node_modules/codemirror/addon/hint',
          '/node_modules/codemirror/addon/hint/show-hint.js',
          '/node_modules/codemirror/addon/edit',
          '/node_modules/codemirror/addon/edit/matchbrackets.js',
          '/node_modules/codemirror/addon/edit/closebrackets.js',
          '/node_modules/codemirror/addon/display',
          '/node_modules/codemirror/addon/display/placeholder.js',
          '/node_modules/codemirror/addon/fold',
          '/node_modules/codemirror/addon/fold/foldcode.js',
          '/node_modules/codemirror/addon/fold/indent-fold.js',
          ''].includes(x),
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
tasks.d=tasks.dist=f=>{tasks.build(e=>{e?f(e):async.parallel([tasks.l,tasks.w,tasks.o],e=>{f(e)})})}

tasks.c=tasks.clean=f=>{rm('_');f()}

async.each(process.argv.length>2?process.argv.slice(2):['build'],
           (x,f)=>{if(tasks[x]){tasks[x](f)}
                   else{process.stderr.write(`ERROR: no task named ${JSON.stringify(x)}\n`);process.exit(1)}},
           e=>{if(e)throw e})
