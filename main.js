global.D={}
const fs=require('fs'),path=require('path'),{spawn}=require('child_process'),
      ps=process,{env}=ps,repr=JSON.stringify,el=D.el=require('electron')
// Detect platform: https://nodejs.org/api/process.html#process_process_platform
// https://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
D.win=/^win/i.test(ps.platform);D.mac=ps.platform=='darwin'
env.RIDE_SPAWN=env.RIDE_SPAWN|| // the default depends on whether this is a standalone RIDE
  (D.win?0:+fs.existsSync(path.dirname(ps.execPath)+(D.mac?'/../../../../Resources/Dyalog/mapl':'/../mapl')))

{//file-backed storage with an API similar to that of localStorage
  if(D.floating){D.db=opener.D.db;return}
  const k=[],v=[] //keys and values
  D.db={
    key:i=>k[i],
    getItem(x)   {const i=k.indexOf(x);return i<0?null:v[i]},
    setItem(x,y) {const i=k.indexOf(x);if(i<0){k.push(x);v.push(y)}else{v[i]=y};dbWrite()},
    removeItem(x){const i=k.indexOf(x);if(i>=0){k.splice(i,1);v.splice(i,1);dbWrite()}},
    _getAll()    {const r={};for(let i=0;i<k.length;i++)r[k[i]]=v[i];return r}
  }
  Object.defineProperty(D.db,'length',{get:_=>k.length})
  const ver=fs.readFileSync(__dirname+'/_/version','utf8').replace(/^(\d+)\.(\d+)\.[^]*$/,'$1$2')
  const d=el.app.getPath('userData'),f=d+'/prefs.json'
  try{if(fs.existsSync(f)){const h=JSON.parse(fs.readFileSync(f,'utf8'));for(let x in h){k.push(x);v.push(h[x])}}}
  catch(e){console.error(e)}
  let st=0,dbWrite=_=>{ //st: state 0=initial, 1=write pending, 2=write in progress
    if(st===2){st=1;return}else{st=2}
    const s='{\n'+k.map((x,i)=>'  '+repr(x)+':'+repr(v[i])).sort().join(',\n')+'\n}\n'
    fs.writeFile(f+'1',s,e=>{
      if(e){console.error(e);dbWrite=_=>{};return} //make dbWrite() a nop
      fs.unlink(f,_=>{fs.rename(f+'1',f,_=>{if(st===1){setTimeout(_=>{dbWrite()},1000)}else{st=0}})})
    })
  }
}

if(D.win&&D.db.getItem('ime')!=='0'){ //switch IME locale as early as possible; '1' or '' means yes
  const setImeExe=ps.execPath.replace(/[^\\\/]+$/,'set-ime.exe')
  fs.existsSync(setImeExe)&&spawn(setImeExe,[ps.pid],{stdio:['ignore','ignore','ignore']})
}

if(D.mac&&!env.RIDE_INTERPRETER_EXE){env.RIDE_INTERPRETER_EXE=D.lastSpawnedExe=path.resolve(ps.cwd(),'../Dyalog/mapl')}
//nww.on('close',function(){
//  if(D.forceClose){
//    let fw=opener.D.floatingWindows;fw.splice(fw.indexOf(nww),1);ps.nextTick(function(){nww.close(true)})
//  }else if(!D.floating){
//    D.lastError?nww.close(true):$.confirm('Are you sure you want to close this window?','Close?',
//                                          function(r){r&&nww.close(true)})
//  }else{
//    let f=window.onbeforeunload;f&&f();D.floating||ps.nextTick(function(){ps.exit(0)})
//  }
//})
//opener&&(D.ide=opener.D.ide)

el.app.on('ready',_=>{
  const p=D.db.getItem('pos');let dx=0,dy=0
  let w=D.elw=new el.BrowserWindow({x:p&&p[0],y:p&&p[1],width:p&&p[2],height:p&&p[3],show:0,icon:'style/img/D.png'})
  const savePos=_=>{const b=w.getBounds();D.db.setItem('pos',[b.x-dx,b.y-dy,b.width,b.height])}
  el.Menu.setApplicationMenu(null)
  w.loadURL(`file://${__dirname}/index.html`)
  w.on('closed',_=>{w=D.elw=0}).on('moved',savePos).on('resize',savePos)
   .on('show',_=>{if(p){const q=w.getPosition();dx=q[0]-p[0];dy=q[1]-p[1]}}).show()
  if(D.win){const fix=_=>{setTimeout(_=>{const a=w.getSize();w.setSize(a[0],a[1]-1);w.setSize(a[0],a[1])},100)}
            w.on('page-title-updated',fix).on('blur',fix)}
  //w.webContents.openDevTools()
})
el.app.on('window-all-closed',_=>el.app.quit())


//  D.quit=function(){gui.Window.get().close()}
//D.open=(url,o)=>{o.icon='D.png';o.toolbar==null&&(o.toolbar=false);return!!gui.Window.open(url,o)} // o:options
