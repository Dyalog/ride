#!/usr/bin/env node
//instead of a Makefile
'use strict';process.chdir(__dirname)
const rq=require,fs=rq('fs'),path=rq('path'),less=rq('less'),{execSync}=rq('child_process'),async=rq('async')
,sh=x=>execSync(x,{encoding:'utf8'}).replace(/[\r\n]/g,'')          // shell
,rf=x=>fs.readFileSync(x,'utf8')                                    // read file
,wf=(x,y)=>fs.writeFileSync(x,y)                                    // write file
,md=x=>{if(!fs.existsSync(x)){md(path.dirname(x));fs.mkdirSync(x)}} // mkdir -p
,nt=(x,y)=>!fs.existsSync(y)||fs.statSync(x)>fs.statSync(y)         // newer than
,rm=x=>{if(!fs.existsSync(x))return
        fs.readdirSync(x).map(y=>{y=x+'/'+y;fs.lstatSync(y).isDirectory()?rm(y):fs.unlinkSync(y)})
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
      less.render(rf(i),(e,r)=>{if(e)throw e;wf(o,r.css);f()})
    },
    e=>{f&&f(e)}
  )
}

const incl={
  '/index.html'                                                :1,
  '/main.js'                                                   :1,
  '/package.json'                                              :1,
  '/node_modules/jquery/dist/jquery.min.js'                    :1,
  '/node_modules/codemirror/lib/codemirror.js'                 :1,
  '/node_modules/codemirror/addon/dialog/dialog.js'            :1,
  '/node_modules/codemirror/addon/search/searchcursor.js'      :1,
  '/node_modules/codemirror/addon/scroll/annotatescrollbar.js' :1,
  '/node_modules/codemirror/addon/search/matchesonscrollbar.js':1,
  '/node_modules/codemirror/addon/hint/show-hint.js'           :1,
  '/node_modules/codemirror/addon/edit/matchbrackets.js'       :1,
  '/node_modules/codemirror/addon/edit/closebrackets.js'       :1,
  '/node_modules/codemirror/addon/display/placeholder.js'      :1,
  '/node_modules/codemirror/addon/fold/foldcode.js'            :1,
  '/node_modules/codemirror/addon/fold/indent-fold.js'         :1}
Object.keys(incl).map(x=>{const a=x.split('/');a.map((_,i)=>incl[a.slice(0,i).join('/')]=1)}) // include ancestors

const excl={'/style/apl385.ttf'               :1,
            '/style/branding/Dyalog_icon.icns':1,
            '/style/style.less'               :1,
            '/style/thm'                      :1}
,namev='ride'+v.split('.').slice(0,2).join('')
,pkg=(x,y,f)=>{
  rq('electron-packager')(
    {dir:'.',platform:x,arch:y,out:'_/'+namev,overwrite:true,'download.cache':'cache',icon:'favicon.ico',tmpdir:false,
      ignore:p=>!incl[p]&&!/^\/(src|style|lib|_)(\/|$)/.test(p)&&!(x==='win32'&&/^\/windows-ime(\/|$)/.test(p))||excl[p],
      'app-copyright':`(c) 2014-${new Date().getFullYear()} Dyalog Ltd`,
      'app-version':v,
      'build-version':v,
      'version-string':{
        CompanyName:'Dyalog Ltd',
        FileDescription:'Remote Integrated Development Environment for Dyalog APL',
        OriginalFilename:namev+'.exe',
        ProductName:'RIDE',
        InternalName:'RIDE'}},
    e=>{f&&f(e)}
  )
}
tasks.l=tasks.linux=f=>{pkg('linux' ,'x64' ,f)}
tasks.w=tasks.win  =f=>{pkg('win32' ,'ia32',f)}
tasks.o=tasks.osx  =f=>{pkg('darwin','x64' ,f)}
tasks.a=tasks.osx  =f=>{pkg('linux' ,'arm' ,f)} // waiting for https://github.com/electron-userland/electron-packager/pull/107
tasks.d=tasks.dist=f=>{tasks.build(e=>{e?f(e):async.parallel([tasks.l,tasks.w,tasks.o],e=>{f(e)})})}

tasks.c=tasks.clean=f=>{rm('_');f()}

async.each(process.argv.length>2?process.argv.slice(2):['build'],
           (x,f)=>{if(tasks[x]){tasks[x](f)}
                   else{process.stderr.write(`ERROR: no task named ${JSON.stringify(x)}\n`);process.exit(1)}},
           e=>{if(e)throw e})
