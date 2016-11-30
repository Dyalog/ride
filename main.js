//Electron's entry point (web-based RIDE doesn't load it)
const rq=require,fs=rq('fs'),path=rq('path'),{spawn}=rq('child_process'),ps=process,{env}=ps,
      repr=JSON.stringify,el=rq('electron'),D={}
//Detect platform: https://nodejs.org/api/process.html#process_process_platform
// https://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
D.win=/^win/i.test(ps.platform);D.mac=ps.platform=='darwin'
if(!env.RIDE_SPAWN&&!D.win){
  var mapl=path.dirname(ps.execPath)+(D.mac?'/../../../../Resources/Dyalog/mapl':'/../mapl')
  if(fs.existsSync(mapl))env.RIDE_SPAWN=D.lastSpawnedExe=mapl
}
const dbf=el.app.getPath('userData')+'/winstate.json' //json "database" file for storing preferences
let db={};try{if(fs.existsSync(dbf))db=JSON.parse(fs.readFileSync(dbf,'utf8'))}catch(e){console.error(e)}
let tid;const sv=_=>{if(!tid)tid=setTimeout(svNow,2000)} //save (throttled)
const svNow=_=>{ //save now
  tid=0;try{const b=elw.getBounds(),h={main:[b.x-dx,b.y-dy,b.width,b.height],devTools:elw.isDevToolsOpened()}
            fs.writeFileSync(dbf,JSON.stringify(h))}catch(e){console.error(e)}
}
let dx=0,dy=0 //used to correct for bad coords misreported by Electron (NW.js has the same problem)
el.app.on('ready',_=>{
  const p=db.main||[]
  let w=global.elw=new el.BrowserWindow({x:p[0],y:p[1],width:p[2],height:p[3],show:0,icon:'style/img/D.png'})
  el.Menu.setApplicationMenu(null);w.loadURL(`file://${__dirname}/index.html`)
  w.on('moved',sv).on('resize',sv).on('close',_=>{tid&&clearTimeout(tid);svNow()}).on('closed',_=>{w=global.elw=0})
   .on('show',_=>{if(p){const q=w.getPosition();dx=q[0]-p[0];dy=q[1]-p[1]}}).show()
  if(D.win){const fix=_=>{setTimeout(_=>{const a=w.getSize();w.setSize(a[0],a[1]-1);w.setSize(a[0],a[1])},100)}
            w.on('page-title-updated',fix).on('blur',fix)}
  db.devTools&&w.webContents.openDevTools()
})
el.app.on('window-all-closed',_=>el.app.quit())
