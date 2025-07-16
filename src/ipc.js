{
  const pm = ('die execCommand focus insert open processAutocompleteReply prompt saved setTC stateChanged' +
    ' update zoom ReplyFormatCode SetHighlightLine ValueTip').split(' ');
  D.IPC_Client = function IPCClient(winId) {
    // start IPC client
    D.ipc.config.id = `editor${winId}`;
    D.ipc.config.retry = 1500;
    D.ipc.config.silent = true;
    D.send = (type, payload) => D.ipc.of.ride_master.emit('RIDE', [type, payload]);
    D.ipc.connectTo('ride_master', () => {
      const rm = D.ipc.of.ride_master;
      const ide = new D.IDE({ floating: 1, ipc: rm });
      rm.on('connect', () => {
        D.ipc.log('## connected to ride_master ##'.rainbow, D.ipc.config.delay);
        rm.emit('browserCreated', winId);
        window.onbeforeunload = (e) => { ide.onbeforeunload(e); };
      });
      rm.on('disconnect', () => {
        D.ipc.log('disconnected from ride_master'.notice);
        D.ide.connected = 0;
        window.close();
      });
      pm.forEach(k => rm.on(k, ([id, ...x]) => { D.ide.wins[id][k](...x); }));
      rm.on('caption', (c) => { D.ide.caption = c; });
      rm.on('close', ([id]) => {
        D.ide.wins[id].close();
        rm.emit('unblock', 0);
      });
      rm.on('getUnsaved', () => {
        rm.emit('getUnsavedReply', D.ide.getUnsaved());
      });
      rm.on('prf', ([k, x]) => { D.prf[k](x, 1); });
      rm.on('ED', id => D.ide.wins[id].ED(D.ide.wins[id].me));
      rm.on('pendingEditor', (pe) => {
        D.ipc.log('got pendingEditor from ride_master : '.debug);
        const { editorOpts, ee } = pe;
        const ed = new D.Ed(D.ide, editorOpts);
        D.ide.wins[ed.id] = ed;
        ed.me_ready.then(() => {
          ed.open(ee);
          ed.updSize();
          ed.refresh();
          rm.emit('unblock', ed.id);
          ed.meIsReady = true;
        });
        setTimeout(() => {
          const glr = D.ide.gl.root;
          const ci = glr.contentItems;
          if (!ci.length) glr.addChild({ type: 'stack' });
          ci[0].type === 'stack' && ci[0].header.position(ci[0].contentItems.length ? 'top' : false);
          glr.contentItems[0].addChild({
            type: 'component',
            componentName: 'win',
            componentState: { id: ed.id },
            title: ee.name,
          });
        }, 100);
      });
      rm.on('syntax', (x) => {
        Object.assign(D.syntax, x);
        D.defineSyntaxRegex();
      });
    });
  };

  D.IPC_Prf = function IPCPrf() {
    // start IPC client - preferences
    D.ipc.config.id = 'prf';
    D.ipc.config.retry = 1500;
    D.ipc.config.silent = true;
    D.ipc.connectTo('ride_master', () => {
      const rm = D.ipc.of.ride_master;
      rm.on('connect', () => {
        D.ipc.log('## connected to ride_master ##'.rainbow, D.ipc.config.delay);
        window.onbeforeunload = (e) => {
          e.returnValue = false;
          rm.emit('prfClose');
        };
        rm.emit('prfCreated');
      });
      rm.on('disconnect', () => {
        D.ipc.log('disconnected from ride_master'.notice);
        D.onbeforeunload = null;
        window.close();
      });
      rm.on('caption', (c) => { document.title = `Preferences - ${c}`; });
      rm.on('show', x => D.prf_ui(x));
      rm.on('prf', ([k, x]) => D.prf[k](x, 1));
      rm.on('nudge', () => rm.emit('nudge'));
    });
  };

  function WindowRect(id, prf) {
    let {
      x, y, width, height,
    } = prf;
    x += prf.ox * (id - 1);
    y += prf.oy * (id - 1);
    const b = D.el.screen.getDisplayMatching({
      x, y, width, height,
    }).bounds;
    const vw = Math.max(0, Math.min(x + width, b.x + b.width) - Math.max(x, b.x));
    const vh = Math.max(0, Math.min(y + height, b.y + b.height) - Math.max(y, b.y));
    if (width * height > 2 * vw * vh) {
      // saved window position is now mostly off screen
      x = null; y = null;
      width = Math.min(width, b.width);
      height = Math.min(height, b.height);
    }
    return {
      x, y, width, height,
    };
  }
  D.IPC_CreateWindow = function IPCCreateWindow(seq) {
    let opts = {
      show: false,
      fullscreen: false,
      fullscreenable: false,
      parent: D.elw,
      alwaysOnTop: false,
      webPreferences: {
        contextIsolation: false,
        enableRemoteModule: true,
        nodeIntegration: true,
        enableDeprecatedPaste: true,
      },
    };
    opts = Object.assign(opts, WindowRect(seq, D.prf.editWins()));
    const bw = new D.el.BrowserWindow(opts);
    D.elm.enable(bw.webContents);
    bw.loadURL(`${window.location}?type=editor&winId=${bw.id}&appid=${D.ipc.config.appspace}`);
  };

  D.IPC_Server = function IPCServer() {
    // start IPC server
    let dlgLoaded;
    let prfLoaded;
    let statLoaded;
    const winsLoaded = [
      new Promise((r) => { dlgLoaded = r; }),
      new Promise((r) => { prfLoaded = r; }),
      new Promise((r) => { statLoaded = r; }),
    ];
    D.pwins = [];
    D.pendingEditors = [];
    D.ipc.config.id = 'ride_master';
    D.ipc.config.appspace = `ride_${+new Date()}`;
    D.ipc.config.retry = 1500;
    D.ipc.config.silent = true;
    D.ipc.serve(() => {
      const srv = D.ipc.server;
      srv.on('prfCreated', (data, socket) => {
        D.prf_bw.socket = socket;
        prfLoaded(true);
      });
      srv.on('prfShow', x => D.prf_ui(x));
      srv.on('prfClose', () => {
        D.el.BrowserWindow.fromId(D.prf_bw.id).hide();
        D.ide && D.ide.focusMRUWin();
      });
      srv.on('statCreated', (data, socket) => {
        D.stw_bw.socket = socket;
        srv.emit(socket, 'setTheme', D.theme);
        statLoaded(true);
      });
      srv.on('statClose', () => {
        D.prf.statusWindow(0);
      });
      srv.on('dialogCreated', (data, socket) => {
        D.dlg_bw.socket = socket;
        srv.emit(socket, 'setTheme', D.theme);
        dlgLoaded(true);
      });
      srv.on('dialogClose', ([t, r]) => {
        D.util.replyDialog(t, r);
        D.el.BrowserWindow.fromId(D.dlg_bw.id).hide();
        D.ide && D.ide.focusMRUWin();
      });
      srv.on('browserCreated', (bwId, socket) => {
        const wp = new D.IPC_WindowProxy(bwId, socket);
        srv.emit(socket, 'caption', D.ide.caption);
        D.pwins.push(wp);
        D.IPC_LinkEditor();
      });
      srv.on('Edit', data => D.ide.Edit(data));
      srv.on('focusedWin', (id) => {
        const w = D.ide.wins[id];
        D.ide.focusedWin = w;
        w && (w.focusTS = +new Date());
      });
      srv.on('pfKey', x => D.ide.pfKey(x));
      srv.on('getStats', () => D.ide.getStats());
      srv.on('getSyntax', (data, socket) => {
        srv.emit(socket, 'syntax', D.syntax);
      });
      srv.on('getUnsavedReply', (data) => {
        if (!D.pendingEdit) return;
        Object.keys(data).forEach((k) => {
          if (data[k] && D.pendingEdit.unsaved[k] === -1) D.pendingEdit.unsaved[k] = data[k];
          else delete D.pendingEdit.unsaved[k];
        });

        if (!Object.values(D.pendingEdit.unsaved).includes(-1)) {
          D.send('Edit', D.pendingEdit);
          delete D.pendingEdit;
        }
      });
      srv.on('getValueTip', (data) => D.ide.getValueTip(...data));
      srv.on('prf', ([k, x]) => { D.prf[k](x); });
      srv.on('switchWin', data => D.ide.switchWin(data));
      srv.on('updPW', data => D.ide.updPW(data));
      srv.on('unblock', (id) => {
        !!id && D.ide.wins[id].me_resolve(true);
        D.ide.unblock();
      });
      srv.on('mounted', (id) => {
        D.ide.hadErr > 0 && (D.ide.hadErr -= 1);
        D.ide.focusWin(D.ide.wins[id]);
      });
      srv.on('zoom', (z) => D.ide.zoom(z));
      srv.on('ABT', () => D.commands.ABT());
      srv.on('LOG', () => D.commands.LOG());
      srv.on('NEW', () => D.commands.NEW());
      srv.on('OWS', () => D.commands.OWS());
      srv.on('RIDE', ([type, payload]) => D.send(type, payload));
    });
    D.ipc.server.start();
    return winsLoaded;
  };
  D.IPC_LinkEditor = function IPCLinkEditor(pe) {
    pe && D.pendingEditors.push(pe);
    if (!D.pendingEditors.length) return;
    let wp = D.prf.floatSingle() ? D.pwins[0] : D.pwins.find(w => w.id < 0);
    if (!wp) {
      D.IPC_CreateWindow(pe.editorOpts.id);
      return;
    }
    if (wp.id > 0) wp = Object.assign(new D.IPC_WindowProxy(), wp);
    const bw = D.el.BrowserWindow.fromId(wp.bwId);
    bw.show();
    if (!D.prf.editWinsRememberPos()) {
      const o = WindowRect(1 + (wp.bwId - D.pwins[0].bwId), D.prf.editWins());
      if (o.x == null) bw.setContentSize(o.width, o.height);
      else bw.setContentBounds(o);
    }
    const ped = D.pendingEditors.shift();
    wp.id = ped.editorOpts.id;
    wp.tc = ped.editorOpts.tc;
    wp.focusTS =  +new Date();
    D.wins[wp.id] = wp;
    D.ipc.server.emit(wp.socket, 'pendingEditor', ped);
  };

  D.IPC_WindowProxy = function IPCWindowProxy(bwId, socket) {
    const ed = this;
    ed.bwId = bwId;
    ed.socket = socket;
    ed.id = -1;
    ed.me = { dyalogCmds: ed };
    ed.me_ready = new Promise((r) => { ed.me_resolve = r; });
    ed.tc = 0;
    ed.focusTS = +new Date();
  };
  D.IPC_WindowProxy.prototype = {
    emit(f, ...x) { D.ipc.server.emit(this.socket, f, [this.id, ...x]); },
    hasFocus() { return this === D.ide.focusedWin; },
    close() {
      if (this === D.pwins[0] && D.prf.editWinsRememberPos()) {
        const b = D.el.BrowserWindow.fromId(this.bwId).getContentBounds();
        D.prf.editWins(Object.assign(D.prf.editWins(), b));
      }
      this.emit('close');
    },
    setTC(x) { this.emit('setTC', x); this.tc = x; },
    ED() { this.emit('ED'); },
    LN() { D.prf.lineNums.toggle(); },
    TVO() { D.prf.fold.toggle(); },
    TVB() { D.prf.breakPts.toggle(); },
  };
  function handlerFor(k) {
    return function handler(...x) { this.emit(k, ...x); };
  }
  pm.forEach((k) => {
    D.IPC_WindowProxy.prototype[k] || (D.IPC_WindowProxy.prototype[k] = handlerFor(k));
  });
}
