//Electron's entry point (web-based RIDE doesn't load it)
const rq=require,fs=rq('fs'),path=rq('path'),{spawn}=rq('child_process'),ps=process,{env}=ps,
      repr=JSON.stringify,el=rq('electron'),D={}
//Detect platform: https://nodejs.org/api/process.html#process_process_platform
// https://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
D.win=/^win/i.test(ps.platform);D.mac=ps.platform=='darwin'
if(!env.RIDE_SPAWN&&!D.win){
  var mapl=path.dirname(ps.execPath)+(D.mac?'/../Resources/Dyalog/mapl':'/../mapl')
  if(fs.existsSync(mapl))env.RIDE_SPAWN=D.lastSpawnedExe=mapl
}
const dbf=el.app.getPath('userData')+'/winstate.json' //json "database" file for storing preferences
let db={};try{if(fs.existsSync(dbf))db=JSON.parse(fs.readFileSync(dbf,'utf8'))}catch(e){console.error(e)}
let tid;const sv=_=>{if(!tid)tid=setTimeout(svNow,2000)} //save (throttled)
const svNow=_=>{ //save now
  tid=0;try{const b=elw.getBounds(),h={main:[b.x-dx,b.y-dy,b.width,b.height,elw.isMaximized()],devTools:elw.isDevToolsOpened()}
            fs.writeFileSync(dbf,JSON.stringify(h))}catch(e){console.error(e)}
}
let dx=0,dy=0 //used to correct for bad coords misreported by Electron (NW.js has the same problem)
el.app.on('ready',_=>{
  var x,y,width,height
  if(db.main){
    [x,y,width,height]=db.main
    const b=el.screen.getDisplayMatching({x,y,width,height}).bounds
    const vw=Math.max(0,Math.min(x+width ,b.x+b.width )-Math.max(x,b.x))
    const vh=Math.max(0,Math.min(y+height,b.y+b.height)-Math.max(y,b.y))
    if(width*height>2*vw*vh){
      //saved window position is now mostly off screen
      x=y=null;width=Math.min(width,b.width);height=Math.min(height,b.height)
    }
  }
  let w=global.elw=new el.BrowserWindow({x,y,width,height,show:0,icon:__dirname+'/D.png'})
  db.main&&db.main[4]&&w.maximize()
  el.Menu.setApplicationMenu(null);w.loadURL(`file://${__dirname}/index.html`)
  w.on('move',sv).on('resize',sv).on('maximize',sv).on('unmaximize',sv)
   .on('close',_=>{tid&&clearTimeout(tid);svNow()}).on('closed',_=>{w=global.elw=0})
   .on('show',_=>{if(x){const q=w.getPosition();dx=q[0]-x;dy=q[1]-y}}).show()
  if(D.win){const fix=_=>{setTimeout(_=>{
              if(w.isMaximized()){w.unmaximize();w.maximize()}
              else{const a=w.getSize();w.setSize(a[0],a[1]-1);w.setSize(a[0],a[1])}
            },100)}
            w.on('page-title-updated',fix).on('blur',fix)}
  db.devTools&&w.webContents.openDevTools()
})
el.app.on('window-all-closed',_=>el.app.quit())

global.ev=x=>eval(x)
global.js=(i,x)=>el.BrowserWindow.fromId(i).webContents.executeJavaScript(x)
const inc=x=>x+1
