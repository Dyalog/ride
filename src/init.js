const Console = console;

{
  const init = () => {
    I.apl_font.hidden = true;

    if (D.el) {
      document.onmousewheel = (e) => {
        const d = e.wheelDelta;
        if (d && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) D.commands[d > 0 ? 'ZMI' : 'ZMO']();
      };
      document.body.className += ` zoom${D.prf.zoom()}`;
    }

    D.createContextMenu = (el, win) => {
      if (!D.el) return;
      el.oncontextmenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        let cmitems;
        if (e.target.classList.contains('breakpointarea')) {
          if (!win.lineClicked) return;
          const l = win.lineClicked - 1;
          cmitems = [
            {
              label: 'Trace',
              click: () => { win.toggleTrace(l); },
              type: 'checkbox',
              checked: win.trace.has(l),
            },
            {
              label: 'Stop',
              click: () => { win.toggleStop(l); },
              type: 'checkbox',
              checked: win.stop.has(l),
            },
            {
              label: 'Monitor',
              click: () => { win.toggleMonitor(l); },
              type: 'checkbox',
              checked: win.monitor.has(l),
            },
          ];
          delete win.lineClicked;
        } else {
          const hasSelection = win
            ? !win.me.getSelection().isEmpty()
            : el.getSelection().type === 'Range';
          const isReadOnly = !!win && win.isReadOnly;
          const tc = !!win && !!win.tc;
          cmitems = [
            { label: 'Cut', role: 'cut', enabled: hasSelection && !isReadOnly },
            { label: 'Copy', role: 'copy', enabled: hasSelection },
            { label: 'Paste', role: 'paste', enabled: !isReadOnly },
            { type: 'separator' },
            {
              label: 'Redo',
              ...win && { click: () => { D.commands.RDO(win.me); } },
              ...!win && { role: 'redo' },
              enabled: !tc,
            },
            {
              label: 'Undo',
              ...win && { click: () => { D.commands.UND(win.me); } },
              ...!win && { role: 'undo' },
              enabled: !tc,
            },
          ];
          if (win && !win.session.get()) {
            const { me } = win;
            if (tc) {
              cmitems.unshift(...[
                {
                  label: 'Skip to line',
                  click: () => { win.STL(me); },
                  visible: tc,
                },
                { type: 'separator' },
              ]);
            }
          }
        }
        const cmenu = D.el.Menu.buildFromTemplate(cmitems);
        cmenu.popup();
      };
    };
    D.createContextMenu(window);

    D.open = D.open || ((url, o) => {
      const {
        height, width, x, y,
      } = o;
      let spec = 'resizable=1';

      if (width != null && height != null) spec += `,width=${width},height=${height}`;
      if (x != null && y != null) spec += `,left=${x},top=${y},screenX=${x},screenY=${y}`;
      return !!window.open(url, '_blank', spec);
    });

    D.openExternal = D.el ? D.el.shell.openExternal : (x) => { window.open(x, '_blank'); };
    if (D.el) {
      window.electronOpen = window.open;
      window.open = (url) => {
        !!url && D.openExternal(url);
        return { location: { set href(u) { D.openExternal(u); } } };
      };
    }

    const loc = window.location;
    if (D.el) {
      const qp = nodeRequire('querystring').parse(loc.search.slice(1));
      if (qp.type === 'prf') {
        D.ipc.config.appspace = qp.appid;
        document.body.className += ' floating-window';
        D.IPC_Prf();
        I.splash.hidden = 1;
      } else if (qp.type === 'editor') {
        D.ipc.config.appspace = qp.appid;
        document.body.className += ' floating-window';
        D.IPC_Client(+qp.winId);
        I.splash.hidden = 1;
      } else {
        const winsLoaded = D.IPC_Server();
        const appid = D.ipc.config.appspace;
        let bw = new D.el.BrowserWindow({
          show: false,
          parent: D.elw,
          alwaysOnTop: false,
          fullscreen: false,
          fullscreenable: false,
          minWidth: 790,
          minHeight: 600,
          webPreferences: {
            contextIsolation: false,
            enableRemoteModule: true,
            nodeIntegration: true,
          },
        });
        D.elm.enable(bw.webContents);
        bw.loadURL(`${loc}?type=prf&appid=${appid}`);
        D.prf_bw = { id: bw.id };
        bw = new D.el.BrowserWindow({
          show: false,
          parent: D.elw,
          alwaysOnTop: false,
          fullscreen: false,
          fullscreenable: false,
          modal: true,
          width: 400,
          height: 350,
          resizable: false,
          minimizable: false,
          maximizable: false,
          webPreferences: {
            contextIsolation: false,
            enableRemoteModule: true,
            nodeIntegration: true,
          },
        });
        D.elm.enable(bw.webContents);
        bw.loadURL(`file://${__dirname}/dialog.html?appid=${appid}`);
        D.dlg_bw = { id: bw.id };
        bw = new D.el.BrowserWindow({
          show: false,
          parent: D.elw,
          alwaysOnTop: false,
          fullscreen: false,
          fullscreenable: false,
          modal: false,
          width: 600,
          height: 400,
          resizable: true,
          minimizable: true,
          maximizable: true,
          webPreferences: {
            contextIsolation: false,
            enableRemoteModule: true,
            nodeIntegration: true,
          },
        });
        D.elm.enable(bw.webContents);
        bw.loadURL(`file://${__dirname}/status.html?appid=${appid}`);
        D.stw_bw = { id: bw.id };
        D.elw.focus();
        Promise.all(winsLoaded).then(() => {
          I.splash.hidden = 1;
          nodeRequire(`${__dirname}/src/cn`)();
        });
      }
    } else {
      const ws = new WebSocket((loc.protocol === 'https:' ? 'wss://' : 'ws://') + loc.host);
      const q = [];
      // q:send queue
      const flush = () => { while (ws.readyState === 1 && q.length) ws.send(q.shift()); };
      D.send = (x, y) => { q.push(JSON.stringify([x, y])); flush(); };
      ws.onopen = () => {
        ws.send('SupportedProtocols=2');
        ws.send('UsingProtocol=2');
        ws.send('["Identify",{"apiVersion":1,"identity":1}]');
        ws.send('["Connect",{"remoteId":2}]');
        ws.send('["GetWindowLayout",{}]');
      };
      ws.onmessage = (x) => { if (x.data[0] === '[') { const [c, h] = JSON.parse(x.data); D.recv(c, h); } };
      ws.onerror = (x) => { Console.info('ws error:', x); };
      D.ide2 = new D.IDE();
      I.splash.hidden = 1;
    }
    if (!D.quit) D.quit = window.close;
    window.onbeforeunload = (e) => {
      if (D.ide && D.ide.connected && !D.ide.closing) {
        e.returnValue = false;
        setTimeout(() => {
          let q = true;
          if (D.prf.sqp() && !(D.el && process.env.NODE_ENV === 'test')) {
            const msg = D.spawned ? 'Quit Dyalog APL.' : 'Disconnect from interpreter.';
            $.confirm(`${msg} Are you sure?`, document.title, (x) => { q = x; });
          }
          if (q) {
            D.ide.closing = true;
            D.ide.w3500 && D.ide.w3500.close();
            if (D.spawned) {
              D.send('Exit', { code: 0 });
              // Wait for the disconnect message
            } else {
              D.send('Disconnect', { message: 'User shutdown request' });
              D.ide.connected = 0;
              window.close();
            }
          }
        }, 10);
        return;
      }
      try {
        D.ipc && D.ipc.server.stop();
        D.ide && D.prf.connectOnQuit() && D.commands.CNC();
        if (D.ide && !D.ide.connected && D.el) D.wins[0].histWrite();
      } finally {
        window.onbeforeunload = null;
      }
    };

    let platform = '';
    if (D.mac) platform = ' platform-mac';
    else if (D.win) platform = ' platform-windows';

    if (D.el) document.body.className += platform;

    window.focused = true;
    window.onblur = (x) => { window.focused = x.type === 'focus'; };
    window.onfocus = window.onblur;
    // Implement access keys (Alt-X) using <u></u>.
    // HTML's accesskey=X doesn't handle duplicates well -
    // - it doesn't always favour a visible input over a hidden one.
    // Also, browsers like Firefox and Opera use different shortcuts -
    // - (such as Alt-Shift-X or Ctrl-X) for accesskey-s.
    if (!D.mac) {
      $(document).on('keydown', (e) => { // Alt-A...Alt-Z or Alt-Shift-A...Alt-Shift-Z
        if (!e.altKey || e.ctrlKey || e.metaKey || e.which < 65 || e.which > 90) return undefined;
        const c = String.fromCharCode(e.which).toLowerCase();
        const C = c.toUpperCase();
        const $ctx = $('.ui-widget-overlay').length
          ? $('.ui-dialog:visible').last()
          : $('body'); // modal dialogs take priority

        const $a = $('u:visible', $ctx).map((i, n) => {
          const h = n.innerHTML;
          if (h !== c && h !== C) return undefined;
          let $i = $(n).closest(':input,label,a').eq(0);
          if ($i.is('label')) $i = $(`#${$i.attr('for')}`).add($i.find(':input')).not(':disabled').eq(0);
          return $i[0];
        });
        if ($a.length > 1) {
          $a.eq(($a.index(':focus') + 1) % $a.length).focus();
        } else if ($a.is(':checkbox')) {
          $a.focus().prop('checked', !$a.prop('checked')).change();
        } else if ($a.is(':text,:password,textarea,select')) {
          $a.focus();
        } else { $a.click(); }
        return !$a.length;
      });
    }
    if (D.el) {
      // drag and drop
      window.ondrop = (e) => { e.preventDefault(); return !1; };
      window.ondragover = window.ondrop;
      window.ondrop = (e) => {
        const { files } = e.dataTransfer;
        const { path } = (files[0] || {});
        if (!D.ide || !path) {
          // no session or no file dragged
        } else if (!/\.dws$/i.test(path)) {
          toastr.error('Ride supports drag and drop only for .dws files.');
        } else if (files.length !== 1) {
          toastr.error('Ride does not support dropping of multiple files.');
        } else {
          if (!D.isLocalInterpreter) {
            toastr.warning(
              'Drag and drop of workspaces works only for locally started interpreters.',
              'Load may fail',
            );
          }
          $.confirm(
            `Are you sure you want to )load ${path.replace(/^.*[\\/]/, '')}?`,
            'Load workspace',
            (x) => { if (x) D.ide.exec([`      )load ${path}\n`], 0); },
          );
        }
        e.preventDefault();
        return !1;
      };

      // extra css and js
      const path = nodeRequire('path');
      const { env } = process;
      if (env.RIDE_JS) {
        env.RIDE_JS
          .split(path.delimiter)
          .forEach((x) => { if (x) $.getScript(`file://${path.resolve(process.cwd(), x)}`); });
      }
      if (env.RIDE_CSS) {
        $('<style>')
          .text(env.RIDE_CSS.split(path.delimiter).map(x => `@import url("${x}");`))
          .appendTo('head');
      }
    }
  };

  D.mop.then(() => init());
}
