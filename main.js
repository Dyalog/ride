// Electron's entry point (web-based Ride doesn't load it)
const rq = require;
const fs = rq('fs');
const ps = process;
const el = rq('electron');
const elm = rq('@electron/remote/main');
const D = {};
global.D = D;

elm.initialize();
// Detect platform: https://nodejs.org/api/process.html#process_process_platform
// https://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
D.win = /^win/i.test(ps.platform);
D.mac = ps.platform === 'darwin';

if (ps.env.spectron_temp_dir) {
  el.app.setPath('userData', ps.env.spectron_temp_dir);
}

const winstate = ps.env.RIDE_CONF || 'winstate';

// build db file path & set up empty db
const dbf = `${el.app.getPath('userData')}/${winstate}.json`; // json "database" file for storing preferences
let db = {};
// try reading the preferences
try {
  if (fs.existsSync(dbf))db = JSON.parse(fs.readFileSync(dbf, 'utf8'));
} catch (e) { console.error(e); }

let tid;

if (!db.theme) db.theme = 'light';
if (!db.launchWin) {
  db.launchWin = {
    expandedWidth: 900,
    width: 400,
    height: 400,
    expanded: false,
  };
}
if (!db.mainWin) db.mainWin = { width: 800, height: 600 };
global.winstate = db;
let isOnLaunchPage = true;
const svNow = () => { // save now
  tid = 0;
  try {
    const { elw } = global;
    const bounds = elw.getContentBounds();
    const page = isOnLaunchPage ? 'launchWin' : 'mainWin';
    const win = db[page] || (db[page] = {});
    win.x = bounds.x;
    win.y = bounds.y;
    if (!isOnLaunchPage || !db.launchWin.expanded) win.width = bounds.width;
    else win.expandedWidth = bounds.width;
    win.height = bounds.height;
    win.maximized = elw.isMaximized();
    db.devTools = elw.isDevToolsOpened();
    fs.writeFileSync(dbf, JSON.stringify(db));
  } catch (e) { console.error(e); }
};

const sv = () => { if (!tid)tid = setTimeout(svNow, 2000); }; // save (throttled)

el.app.on('ready', () => {
  // initialise variables
  let x; let y;
  let width; let height;

  const restoreWinPos = (page) => {
    // if we have a position saved try and restore it
    if (db[page]) {
      // get co-ordinates & bounds
      ({
        x, y, width, height,
      } = db[page]);
      if (page === 'launchWin' && db.launchWin.expanded) width = db.launchWin.expandedWidth;
      // determine an appropriate screen
      const b = el.screen.getDisplayMatching({
        x: x || 0, y: y || 0, width, height,
      }).bounds;

      const vw = Math.max(0, Math.min(x + width, b.x + b.width) - Math.max(x, b.x));
      const vh = Math.max(0, Math.min(y + height, b.y + b.height) - Math.max(y, b.y));

      if (width * height > 2 * vw * vh) {
        // saved window position is now mostly off screen
        x = null;
        y = null;
        width = Math.min(width, b.width);
        height = Math.min(height, b.height);
      }
    }
  };
  restoreWinPos('launchWin');

  // create an electron renderer
  let w = new el.BrowserWindow({
    show: 0,
    ...(!D.win && !D.mac && { icon: `${__dirname}/D.png` }),
    backgroundColor: '#7688d9',
    webPreferences: {
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegration: true,
      enableDeprecatedPaste: true,
    },
  });
  global.elw = w;
  if (x == null) w.setContentSize(width, height);
  else {
    w.setContentBounds({
      x, y, width, height,
    });
  }
  db.dx = w.getSize()[0] - w.getContentSize()[0];
  elm.enable(w.webContents);
  el.Menu.setApplicationMenu(null);

  rq('electron').ipcMain.on('save-win', (evt, onLaunch) => {
    sv();
    if (isOnLaunchPage !== onLaunch) {
      isOnLaunchPage = onLaunch;
      restoreWinPos('mainWin');
      if (x == null) w.setContentSize(width, height);
      else {
        w.setContentBounds({
          x, y, width, height,
        });
      }
      if (db.mainWin.maximized) w.maximize();
    }
  });

  const showMB = (f) => {
    w.setMenuBarVisibility(!!f);
    w.setAutoHideMenuBar(!f);
  };
  w.loadURL(`file://${__dirname}/index.html`);
  w.on('move', sv).on('resize', sv).on('maximize', sv).on('unmaximize', sv)
    .on('enter-full-screen', () => showMB(0))
    .on('leave-full-screen', () => showMB(1))
    .on('close', () => {
      if (tid)clearTimeout(tid);
      svNow();
    })
    .on('closed', () => {
      global.elw = 0;
      w = 0;
    })
    .on('ready-to-show', w.show);

  if (db.devTools) w.webContents.openDevTools();

  if (process.argv.constructor === Array && process.argv.includes('DEV_STYLE')) {
    const { client } = rq('electron-connect');
    const c = client.create(w, { sendBounds: false });
    c.on('reboot', () => {
      w.close();
      el.app.relaunch();
    });
    c.on('css_update', () => {
      // define the reload function that hacks in the new styles
      const reloadFn = `() => {
        [...document.getElementsByClassName('theme')].forEach(t => t.replaceWith(t));
      }`;
      w.webContents.executeJavaScript(`(${reloadFn})()`);
    });
  }
});

el.app.on('window-all-closed', () => { el.app.quit(); });
el.app.on('will-finish-launching', () => {
  el.app.on('open-file', (event, path) => {
    global.open_file = path;
  });
});
global.js = (i, x) => el.BrowserWindow.fromId(i).webContents.executeJavaScript(x);
