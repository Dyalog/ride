const rq=require,fs=rq('fs'),path=rq('path'),{spawn}=rq('child_process'),ps=process,{env}=ps,
      repr=JSON.stringify,el=rq('electron'),D={}
//Detect platform: https://nodejs.org/api/process.html#process_process_platform
// https://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
D.win=/^win/i.test(ps.platform);D.mac=ps.platform=='darwin'
env.RIDE_SPAWN=env.RIDE_SPAWN|| // the default depends on whether this is a standalone RIDE
  (D.win?0:+fs.existsSync(path.dirname(ps.execPath)+(D.mac?'/../../../../Resources/Dyalog/mapl':'/../mapl')))
if(D.mac&&!env.RIDE_INTERPRETER_EXE){env.RIDE_INTERPRETER_EXE=D.lastSpawnedExe=path.resolve(ps.cwd(),'../Dyalog/mapl')}
el.app.on('ready',_=>{
  const pf=el.app.getPath('userData')+'/winpos.json'
  let p=[];try{p=JSON.parse(fs.readFileSync(pf,'utf8')).main||[]}catch(e){console.error(e)}
  let dx=0,dy=0 //used to correct for misreported coords
  ,w=global.elw=new el.BrowserWindow({x:p[0],y:p[1],width:p[2],height:p[3],show:0,icon:'style/img/D.png'})
  ,tid //timeout id for saving window position
  ,sv=_=>{if(!tid)tid=setTimeout(svNow,2000)}
  ,svNow=_=>{tid=0;try{const b=w.getBounds(),s=JSON.stringify({main:[b.x-dx,b.y-dy,b.width,b.height]})
                       fs.writeFileSync(pf,s)}catch(e){console.error(e)}}
  el.Menu.setApplicationMenu(null)
  w.loadURL(`file://${__dirname}/index.html`)
  w.on('show',_=>{if(p){const q=w.getPosition();dx=q[0]-p[0];dy=q[1]-p[1]}})
   .on('moved',sv).on('resize',sv).on('close',_=>{if(tid){clearTimeout(tid);svNow()}}).on('closed',_=>{w=global.elw=0})
   .show()
  if(D.win){const fix=_=>{setTimeout(_=>{const a=w.getSize();w.setSize(a[0],a[1]-1);w.setSize(a[0],a[1])},100)}
            w.on('page-title-updated',fix).on('blur',fix)}
  w.webContents.openDevTools()
})
el.app.on('window-all-closed',_=>el.app.quit())
