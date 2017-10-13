const electron=require('electron');

var { app }=electron;
app.on('ready',(event,launch_info)=>{
    var elw = new electron.BrowserWindow({});
    elw.loadURL(`file://${__dirname}/index.html`);
    elw.webContents.openDevTools();
    elw.setMenu(null);
    elw.show();
})