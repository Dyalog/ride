const Console = console;

{
  const init = () => {
    // build up I by iterating over all elements with IDs
    const a = document.querySelectorAll('[id]');
    for (let i = 0; i < a.length; i += 1) {
      const e = a[i];
      const s = e.id;
      const j = s.indexOf('_');
      I[s] = e;
      if (j >= 0) {
        const u = s.slice(0, j);
        const v = s.slice(j + 1);
        (J[u] = J[u] || {})[v] = e;
      }
    }

    I.apl_font.hidden = true;

    if (D.el) {
      document.onmousewheel = (e) => {
        const d = e.wheelDelta;
        if (d && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) D.commands[d > 0 ? 'ZMI' : 'ZMO']();
      };
      document.body.className += ` zoom${D.prf.zoom()}`;

      D.prf.zoom((z) => {
        if (!D.ide) return;
        if (D.ed) D.ipc.of.ride_master.emit('zoom', z);
        else D.ide.zoom(z);
      });
      // context menu
      const cmitems = ['Cut', 'Copy', 'Paste'].map(x => ({ label: x, role: x.toLowerCase() }))
        .concat({ type: 'separator' })
        .concat(['Undo', 'Redo'].map(x => ({
          label: x,
          click: () => {
            const u = D.ed || D.ide.focusedWin;
            const { me } = u;
            if (u && me[x.toLowerCase()]) me[x.toLowerCase()]();
          },
        })));
      const cmenu = D.el.Menu.buildFromTemplate(cmitems);
      D.oncmenu = (e) => { e.preventDefault(); cmenu.popup(D.elw); };
    }

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
    const loc = window.location;
    if (/^\?prf$/.test(loc.search)) {
      document.body.className += ' floating-window';
      D.IPC_Prf();
    } else if (/^\?\d+$/.test(loc.search)) {
      const winId = +loc.search.slice(1);
      document.body.className += ' floating-window';
      D.mop.then(() => D.IPC_Client(winId));
    } else {
      if (D.el) {
        D.IPC_Server();
        const bw = new D.el.BrowserWindow({
          icon: `${__dirname}/D.png`,
          show: false,
          parent: D.elw,
          alwaysOnTop: true,
        });
        bw.loadURL(`${loc}?prf`); // bw.webContents.toggleDevTools();
        D.prf_bw = { id: bw.id };
        node_require(`${__dirname}/src/cn`)();
      } else {
        const ws = new WebSocket((loc.protocol === 'https:' ? 'wss://' : 'ws://') + loc.host);
        const q = [];
        // q:send queue
        const flush = () => { while (ws.readyState === 1 && q.length) ws.send(q.shift()); };
        D.send = (x, y) => { q.push(JSON.stringify([x, y])); flush(); };
        ws.onopen = () => {
          ws.send('SupportedProtocols=2');
          ws.send('UsingProtocol=2');
          ws.send('["Identify",{"identity":1}]');
          ws.send('["Connect",{"remoteId":2}]');
          ws.send('["GetWindowLayout",{}]');
        };
        ws.onmessage = (x) => { if (x.data[0] === '[') { const [c, h] = JSON.parse(x.data); D.recv(c, h); } };
        ws.onerror = (x) => { Console.info('ws error:', x); };
        D.ide2 = new D.IDE();
      }
      if (!D.quit) D.quit = window.close;
    }
    window.onbeforeunload = (e) => {
      if (D.ide && D.ide.connected) {
        e.returnValue = false;
        setTimeout(() => {
          let q = true;
          if (D.prf.sqp()) {
            const msg = D.local ? 'Quit Dyalog APL. Are you sure?' : 'Disconnect from interpreter. Are you sure?';
            $.confirm(msg, document.title, (x) => { q = x; });
          }
          if (q) {
            if (D.ipc) D.ipc.server.stop();
            if (D.local) {
              D.send('Exit', { code: 0 });
              // Wait for the disconnect message
            } else {
              D.send('Disconnect', { message: 'User shutdown request' });
              D.ide.connected = 0;
              window.close();
            }
          }
        }, 10);
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
      CM.on(document, 'keydown', (e) => { // Alt-A...Alt-Z or Alt-Shift-A...Alt-Shift-Z
        if (!e.altKey || e.ctrlKey || e.metaKey || e.which < 65 || e.which > 90) return undefined;
        const c = String.fromCharCode(e.which).toLowerCase();
        const C = c.toUpperCase();
        const $ctx = $('.ui-widget-overlay').length ?
          $('.ui-dialog:visible').last() :
          $('body'); // modal dialogs take priority

        const $a = $('u:visible', $ctx).map((i, n) => {
          const h = n.innerHTML;
          if (h !== c && h !== C) return undefined;
          let $i = $(n).closest(':input,label,a').eq(0);
          if ($i.is('label')) $i = $(`#${$i.attr('for')}`).add($i.find(':input')).eq(0);
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
      }, true);
    }
    if (D.el) {
      // drag and drop
      CM.defaults.dragDrop = 0;
      window.ondrop = (e) => { e.preventDefault(); return !1; };
      window.ondragover = window.ondrop;
      window.ondrop = (e) => {
        const { files } = e.dataTransfer;
        const { path } = (files[0] || {});
        if (!D.lastSpawnedExe) {
          $.err('Drag and drop of workspaces works only for locally started interpreters.');
        } else if (!/\.dws$/i.test(path)) {
          $.err('RIDE supports drag and drop only for .dws files.');
        } else if (a.length !== 1) {
          $.err('RIDE does not support dropping of multiple files.');
        } else {
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
      const path = node_require('path');
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

  init();
}
