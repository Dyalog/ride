// Electron's entry point (web-based RIDE doesn't load it)
const rq = require;
const fs = rq('fs');
const ps = process;
const el = rq('electron');
const D = {};

// Detect platform: https://nodejs.org/api/process.html#process_process_platform
// https://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
D.win = /^win/i.test(ps.platform);
D.mac = ps.platform === 'darwin';

// build db file path & set up empty db
const dbf = `${el.app.getPath('userData')}/winstate.json`; // json "database" file for storing preferences
let db = {};
// try reading the preferences
try {
  if (fs.existsSync(dbf))db = JSON.parse(fs.readFileSync(dbf, 'utf8'));
} catch (e) { console.error(e); }

let tid;
let dx = 0;
let dy = 0; // used to correct for bad coords misreported by Electron (NW.js has the same problem)

const svNow = () => { // save now
  tid = 0;
  try {
    const bounds = elw.getBounds();
    const h = {
      main: [bounds.x - dx, bounds.y - dy, bounds.width, bounds.height, elw.isMaximized()],
      devTools: elw.isDevToolsOpened(),
    };
    fs.writeFileSync(dbf, JSON.stringify(h));
  } catch (e) { console.error(e); }
};

const sv = () => { if (!tid)tid = setTimeout(svNow, 2000); }; // save (throttled)


el.app.on('ready', () => {
  // initialise variables
  let x; let y;
  let width; let height;

  // if we have a position saved try and restore it
  if (db.main) {
    // get co-ordinates & bounds
    [x, y, width, height] = db.main;
    // determine an appropriate screen
    const b = el.screen.getDisplayMatching({
      x, y, width, height,
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

  // create an electron renderer
  global.elw = new el.BrowserWindow({
    x, y, width, height, show: 0, icon: `${__dirname}/D.png`,
  });

  el.Menu.setApplicationMenu(null);

  let w = global.elw;
  if (db.main && db.main[4])w.maximize();
  w.loadURL(`file://${__dirname}/index.html`);
  w.on('move', sv).on('resize', sv).on('maximize', sv).on('unmaximize', sv)
    .on('close', () => {
      if (tid)clearTimeout(tid);
      svNow();
    })
    .on('closed', () => {
      global.elw = 0;
      w = 0;
    })
    .on('show', () => {
      if (x) {
        const q = w.getPosition();
        dx = q[0] - x;
        dy = q[1] - y;
      }
    })
    .on('ready-to-show', w.show);

  if (D.win) {
    const fix = () => {
      setTimeout(() => {
        if (w.isMaximized()) {
          w.unmaximize(); w.maximize();
        } else {
          const a = w.getSize();
          w.setSize(a[0], a[1] - 1);
          w.setSize(a[0], a[1]);
        }
      }, 100);
    };
    w.on('page-title-updated', fix).on('blur', fix);
  }

  if (db.devTools)w.webContents.openDevTools();

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
        if (document.getElementById('lr-style'))document.getElementById('lr-style').remove();
        const link = document.createElement('link');
        link.href = 'style/new-style.css';
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.id = 'lr-style';
        document.getElementsByTagName('head')[0].appendChild(link);
      }`;

      w.webContents.executeJavaScript(`(${reloadFn})()`);
    });
  }
});

el.app.on('window-all-closed', () => { el.app.quit(); });

global.ev = x => eval(x);
global.js = (i, x) => el.BrowserWindow.fromId(i).webContents.executeJavaScript(x);
