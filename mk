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
//v:version string - "x.y.z" where z is the number of commits since the beginning of the project
,v=JSON.parse(rf('package.json')).version.replace(/\.0$/,'')+'.'+sh('git rev-list --count HEAD')
,tasks={}

let buildDone=0
tasks.b=tasks.build=f=>{
  if(buildDone){f();return}
  md('_');wf('_/version',v);console.info('v'+v)
  wf('_/version.js','D='+JSON.stringify({versionInfo:{
       version:v,date:sh('git show -s HEAD --pretty=format:%ci'),rev:sh('git rev-parse HEAD')}}))
  buildDone=1;f()
}

const incl={
  '/index.html'                                                     :1,
  '/main.js'                                                        :1,
  '/package.json'                                                   :1,
  '/node_modules/jquery/dist/jquery.min.js'                         :1,
  '/node_modules/codemirror/lib/codemirror.js'                      :1,
  '/node_modules/codemirror/addon/dialog/dialog.js'                 :1,
  '/node_modules/codemirror/addon/search/searchcursor.js'           :1,
  '/node_modules/codemirror/addon/scroll/annotatescrollbar.js'      :1,
  '/node_modules/codemirror/addon/search/matchesonscrollbar.js'     :1,
  '/node_modules/codemirror/addon/hint/show-hint.js'                :1,
  '/node_modules/codemirror/addon/edit/matchbrackets.js'            :1,
  '/node_modules/codemirror/addon/edit/closebrackets.js'            :1,
  '/node_modules/codemirror/addon/display/placeholder.js'           :1,
  '/node_modules/codemirror/addon/fold/foldcode.js'                 :1,
  '/node_modules/codemirror/addon/fold/indent-fold.js'              :1,
  '/node_modules/golden-layout/dist/goldenlayout.min.js'            :1,
  '/node_modules/golden-layout/src/css/goldenlayout-base.css'       :1,
  '/node_modules/golden-layout/src/css/goldenlayout-light-theme.css':1}
Object.keys(incl).map(x=>{const a=x.split('/');a.map((_,i)=>incl[a.slice(0,i).join('/')]=1)}) // include ancestors

const excl={'/style/img/D.icns':1}
,namev='ride'+v.split('.').slice(0,2).join('')
,pkg=(x,y,f)=>{rq('electron-packager')(
  {dir:'.',platform:x,arch:y,out:'_/'+namev,overwrite:true,'download.cache':'cache',icon:'favicon.ico',tmpdir:false,
    ignore:p=>!incl[p]&&!/^\/(src|style|lib|_)(\/|$)/.test(p)&&!(x==='win32'&&/^\/windows-ime(\/|$)/.test(p))||excl[p],
    'app-copyright':`(c) 2014-${new Date().getFullYear()} Dyalog Ltd`,
    'app-version':v,
    'build-version':v,
    'version-string':{ //ends up in Windows Explorer's right click > Properties
      CompanyName:'Dyalog Ltd',
      FileDescription:'Remote Integrated Development Environment for Dyalog APL',
      OriginalFilename:namev+'.exe',
      ProductName:'RIDE',
      InternalName:'RIDE'}},
  e=>{const d='_/'+namev+'/'+namev+'-'+x+'-'+y;rm(d+'/version')
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
