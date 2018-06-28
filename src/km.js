// various stuff related to keymapping
{
  D.prf.prefixKey((x, old) => {
    if (x !== old) {
      const m = D.keyMap.dyalogDefault;
      m[`'${x}'`] = m[`'${old}'`]; delete m[`'${old}'`];
    }
  });

  // D.kbds.layouts[lc] contains four strings describing how keys map to characters:
  //  0:normal  1:shifted
  //  2:APL     3:APL shifted
  // Each string can be indexed by scancode: http://www.abreojosensamblador.net/Productos/AOE/html/Pags_en/ApF.html
  // "APL" and "APL shifted" are the defaults upon which the user can build customisations.
  let bq; // effective ` map as a dictionary, kept in sync with the prefs
  function updBQ() {
    bq = {}; D.bq = bq;
    const lc = D.prf.kbdLocale();
    const l = D.kbds.layouts[lc] || D.kbds.layouts.en_US;
    const n = l[0].length;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < n; j++) {
        const name = l[i][j];
        bq[name] || (bq[name] = l[2 + i][j]);
      }
    }
    const s = D.prf.prefixMaps()[lc];
    if (s) for (let i = 0; i < s.length; i += 2) bq[s[i]] = s[i + 1];
  }
  updBQ(); D.prf.prefixMaps(updBQ); D.prf.kbdLocale(updBQ);

  D.keyMap.dyalogDefault = { };

  $.extend(D.commands, {
    TB() { D.ide.switchWin(1); },
    BT() { D.ide.switchWin(-1); },
    CT() { document.execCommand('Cut'); },
    CP() { document.execCommand('Copy'); },
    PT() { document.execCommand('Paste'); },
    PRF() { D.prf_ui(); },
    ABT() { D.abt(); },
    CAM() {
      D.send('ClearTraceStopMonitor', { token: 0 });
      Object.keys(D.ide.wins).forEach((x) => { +x && D.ide.wins[x].execCommand('CBP'); });
    },
    CAW() { D.send('CloseAllWindows', {}); },
    CNC() {
      const p = D.el.process.argv; // if(D.mac)p=p.replace(/(\/Contents\/).*$/,'$1MacOS/nwjs')
      nodeRequire('child_process').spawn(p[0], p.slice(1), {
        detached: true,
        stdio: ['ignore', 'ignore', 'ignore'],
        env: $.extend({}, process.env, { RIDE_SPAWN: '' }),
      });
      if (D.ide.dead) window.close();
    },
    OWS() {
      if (D.el && D.lastSpawnedExe) {
        const [v] = D.el.dialog.showOpenDialog(D.elw, {
          title: 'Open file',
          filters: [],
          properties: ['openFile'],
        });
        if (!v) return;
        if (/\.dws$/.test(v)) {
          $.confirm(
            `Run Latent Expression of ${v.replace(/^.*[\\/]/, '')}?`,
            'Load Workspace',
            x => D.ide.exec([`      )${(x ? '' : 'x')}load ${v}\n`], 0),
          );
        } else {
          D.ide.exec([`      )ED file://${v}\n`], 0);
        }
      }
    },
    NEW() {
      if (!D.el) return;
      if (D.lastSpawnedExe) {
        const e = {};
        Object.keys(process.env).forEach((k) => { e[k] = process.env[k]; });
        e.RIDE_SPAWN = D.lastSpawnedExe; const p = D.el.process.argv;
        nodeRequire('child_process').spawn(p[0], p.slice(1), {
          detached: true, stdio: ['ignore', 'ignore', 'ignore'], env: e,
        });
      } else {
        $.err('The current session is remote.\nTo connect elsewhere or\nlaunch a local interpreter,\n' +
              'please use "Connect..." instead.', 'Cannot Start New Session');
      }
    },
    DK(me) { me.trigger('editor', 'editor.action.deleteLines'); },
    QCP(me) { me.trigger('editor', 'editor.action.quickCommand'); },
    QIT() { D.quit(); },
    LBR: D.prf.lbar.toggle,
    SBR: D.prf.sbar.toggle,
    WI() { D.send('WeakInterrupt', {}); },
    SI() { D.send('StrongInterrupt', {}); },
    FUL() {
      const d = document;
      const e = d.body;
      let x;
      if (d.fullscreenElement || d.webkitFullscreenElement ||
          d.mozFullScreenElement || d.msFullscreenElement) {
        x = d.exitFullscreen || d.webkitExitFullscreen ||
            d.mozCancelFullScreen || d.msExitFullscreen;
        x && x.apply(d);
      } else {
        x = e.requestFullscreen || e.webkitRequestFullscreen ||
            e.mozRequestFullScreen || e.msRequestFullscreen;
        x && x.apply(e);
      }
    },
    EXP(me) { me.trigger('editor', 'editor.action.smartSelect.grow'); },
    HLP(me) {
      const c = me.getPosition();
      const s = me.model.getLineContent(c.lineNumber).toLowerCase();
      const h = D.hlp;
      let u; // u: the URL
      let m; // m: match object
      if ((m = /^ *(\)[a-z]+).*$/.exec(s))) u = h[m[1]] || h.WELCOME;
      else if ((m = /^ *(\][a-z]+).*$/.exec(s))) u = h[m[1]] || h.UCMDS;
      else if ((m = /(\d+) *⌶$/.exec(s.slice(0, c.ch)))) u = h[`${m[1]}⌶`] || `${h['⌶']}#${m[1]}`;
      else {
        const x = s.slice(s.slice(0, c.column).replace(/.[áa-z]*$/i, '').length)
          .replace(/^([⎕:][áa-z]*|.).*$/i, '$1').replace(/^:end/, ':');
        if (h[x]) u = h[x];
        else if (x[0] === '⎕') u = h.SYSFNS;
        else if (x[0] === ':') u = h.CTRLSTRUCTS;
        else u = h.LANGELEMENTS;
      }
      D.openExternal(u);
    },
    LL(me) { me.trigger('editor', 'cursorHome'); },
    RL(me) {
      const sels = me.getSelections().map((c) => {
        const l = c.startLineNumber;
        const ch = c.startColumn - 1;
        const t = me.model.getLineContent(l);
        const n = t.length;
        const m = t.replace(/ +$/, '').length;
        const nc = 1 + ((m <= ch && ch < n) || !m ? n : m);
        return new monaco.Selection(l, nc, l, nc);
      });
      me.setSelections(sels);
      me.revealRange(monaco.Range.fromPositions(me.getPosition()));
    },
    JSC() {
      let w; D.el && (w = D.el.BrowserWindow.getFocusedWindow()) && w.webContents.toggleDevTools();
    },
    LOG() {
      if (!D.el) return;
      if (D.ide.floating) {
        D.ipc.of.ride_master.emit('LOG');
        return;
      }
      const w = new D.el.BrowserWindow({
        width: 400,
        height: 500,
        parent: D.elw,
      });
      const cn = nodeRequire(`${__dirname}/src/cn`);
      D.logw = w;
      w.setTitle(`Protocol Log - ${D.ide.caption}`);
      w.loadURL(`file://${__dirname}/empty.html`);
      w.webContents.executeJavaScript('var d = document, h=d.documentElement, b=d.body, e=d.createElement("div");' +
                                      'b.style.fontFamily="monospace";b.style.overflow="scroll";' +
                                      'e.style.whiteSpace="pre";b.appendChild(e)');
      const f = (x) => {
        const t = JSON.stringify(`${x}\n`);
        w.webContents.executeJavaScript(`e.textContent += ${t}; h.scrollTop = h.scrollHeight`);
      };
      f(cn.getLog().filter(x => x).join('\n'));
      cn.addLogListener(f);
      w.on('closed', () => { delete D.logw; cn.rmLogListener(f); });
    },
    TIP() {
      const w = D.ide.focusedWin;
      const u = w.me.getPosition();
      w.vt.show({ line: u.lineNumber, ch: Math.max(0, u.column - 1) }, 1);
    },
    SC(me) { me.trigger('editor', 'actions.find'); },
    RP(me) { me.trigger('editor', 'editor.action.startFindReplaceAction'); },
    PV(me) { me.trigger('editor', 'editor.action.previousMatchFindAction'); },
    NX(me) { me.trigger('editor', 'editor.action.nextMatchFindAction'); },
    TGC(me) { me.trigger('editor', 'editor.action.commentLine'); },
    AO(me) { me.trigger('editor', 'editor.action.addCommentLine'); },
    DO(me) { me.trigger('editor', 'editor.action.removeCommentLine'); },
    DBG() { D.prf.dbg.toggle(); },
    WSE() { D.prf.wse.toggle(); },
    ZM(me) {
      const w = me.dyalogCmds;
      w.container.parent.toggleMaximise();
      setTimeout(() => { me && me.focus(); }, 100);
    },
    ZMI() { D.prf.zoom(Math.min(12, D.prf.zoom() + 1)); D.ide.updPW(); },
    ZMO() { D.prf.zoom(Math.max(-10, D.prf.zoom() - 1)); D.ide.updPW(); },
    ZMR() { D.prf.zoom(0); D.ide.updPW(); },

  });

  const pfKey = i => () => D.ide.pfKey(i);
  for (let i = 1; i <= 48; i++) D.commands[`PF${i}`] = pfKey(i);

  // order: used to measure how "complicated"
  // (for some made-up definition of the word) a shortcut is.
  // Tooltips in the lbar show the simplest one.
  const order = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function complexity(x) {
    return (1 + order.indexOf(x)) || (1 + order.length + x.charCodeAt(0));
  }
  D.getBQKeyFor = (v) => {
    let r = '';
    Object.keys(bq).forEach((x) => {
      const y = bq[x];
      if (y === v && (!r || complexity(r) > complexity(x))) r = x;
    });
    const pk = D.prf.prefixKey();
    return r === pk ? pk + pk : r;
  };

  const bqbqc = []; // backquote-backquote completions
  D.bqbqc = bqbqc;
  for (let i = 0; i < D.informal.length; i++) {
    const a = D.informal[i].split(' ');
    for (let j = 1; j < a.length; j++) {
      bqbqc.push({
        name: a[j],
        text: a[0],
      });
    }
  }
  const C = [
  //  0     1     2     3     4     5     6     7     8     9     A     B     C     D     E     F
    'QT', 'ER', 'TB', 'BT', 'EP', 'UC', 'DC', 'RC', 'LC', 'US', 'DS', 'RS', 'LS', 'UL', 'DL', 'RL', // 00
    'LL', 'HO', 'CT', 'PT', 'IN', 'II', 'DI', 'DP', 'DB', 'RD', 'TG', 'DK', 'OP', 'CP', 'MV', 'FD', // 10
    'BK', 'ZM', 'SC', 'RP', 'NX', 'PV', 'RT', 'RA', 'ED', 'TC', 'NB', 'NS', 'ST', 'EN', 'IF', 'HK', // 20
    'FX', 'LN', 'MC', 'MR', 'JP', 'D1', 'D2', 'D3', 'D4', 'D5', 'U1', 'U2', 'U3', 'U4', 'U5', 'Lc', // 30
    'Rc', 'LW', 'RW', 'Lw', 'Rw', 'Uc', 'Dc', 'Ll', 'Rl', 'Ul', 'Dl', 'Us', 'Ds', 'DD', 'DH', 'BH', // 40
    'BP', 'AB', 'HT', 'TH', 'RM', 'CB', 'PR', 'SR', 'IS', 'TL', 'UA', 'AO', 'DO', 'GL', 'CH', 'PU', // 50
    'PA', 'SA', 'RZ', 'AC', 'MA', 'OF', 'FS', 'FA', 'TT', 'FT', 'PL', null, null, null, null, null, // 60
    null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, // 70
    null, null, null, null, null, null, 'TO', 'MO', null, null, null, null, null, 'S1', 'S2', 'OS', // 80
    'IG', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, // 90
  ];
  function defCmd(x) {
    const c = D.commands;
    c[x] || (c[x] = (me) => {
      const h = me.dyalogCmds;
      h && h.execCommand(x);
    });
  }
  ('CBP MA AC VAL indentOrComplete indentMoreOrAutocomplete STL TVO TVB' +
  ' TGC JBK JSC LOG WSE').split(' ').forEach(defCmd);
  for (let i = 0; i < C.length; i++) {
    if (C[i]) {
      defCmd(C[i]);
      D.keyMap.dyalogDefault[String.fromCharCode(0xf800 + i)] = C[i];
    }
  }
  D.mapScanCodes = (me) => {
    me.onKeyDown((e) => {
      const { key } = e.browserEvent;
      const cmd = D.keyMap.dyalogDefault[key];
      if (key.length === 1 && cmd && D.commands[cmd]) {
        e.preventDefault();
        e.stopPropagation();
        D.commands[cmd](me);
      }
    });
  };
  D.mapKeys = (ed) => {
    const { me } = ed;
    const kc = monaco.KeyCode;
    const km = monaco.KeyMod;
    const ctrlcmd = {
      Ctrl: D.mac ? km.WinCtrl : km.CtrlCmd,
      Cmd: km.CtrlCmd,
      Win: km.CtrlCmd,
      Meta: km.CtrlCmd,
    };
    const stlkbs = [];
    function monacoKeyBinding(ks) {
      return ks.replace(/-(.)/g, '\n$1').split('\n').reduce((a, ko) => {
        const k = D.keyMap.labels[ko] || ko;
        return a | (ctrlcmd[k] || km[k] || kc[k]); // eslint-disable-line no-bitwise
      }, 0);
    }
    function addCmd(map) {
      Object.keys(map).forEach((ks) => {
        const nkc = monacoKeyBinding(ks);
        const cmd = map[ks];
        let cond;
        if (!nkc || cmd === 'BQC') return;
        if (cmd === 'STL') { stlkbs.push(nkc); return; }
        if (cmd === 'ER') {
          cond = 'tracer && !editorHasMultipleSelections && !findInputFocussed && !inSnippetMode';
        } else if (cmd === 'TC') {
          cond = 'tracer';
        } else if (nkc === kc.Escape) cond = '!suggestWidgetVisible && !editorHasMultipleSelections && !findWidgetVisible && !inSnippetMode';
        me.addCommand(nkc, () => D.commands[cmd](me), cond);
      });
    }
    addCmd(D.keyMap.dyalogDefault);
    addCmd(D.keyMap.dyalog);
    me.addCommand(
      kc.Tab,
      () => ed.indentOrComplete(me),
      '!suggestWidgetVisible && !editorHasMultipleSelections && !findWidgetVisible && !inSnippetMode',
    );
    me.addCommand(
      kc.RightArrow,
      () => me.trigger('editor', 'acceptSelectedSuggestion'),
      'suggestWidgetVisible',
    );
    me.addCommand(kc.DownArrow, () => ed.DC(me), '!suggestWidgetVisible && !findInputFocussed');
    me.addCommand(kc.UpArrow, () => ed.UC(me), '!suggestWidgetVisible && !findInputFocussed');
    me.addCommand(kc.RightArrow, () => ed.RC(me), '!suggestWidgetVisible && !findInputFocussed');

    me.addAction({
      id: 'dyalog-skip-to-line',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 0,
      precondition: 'tracer && !session',
      keyBindings: stlkbs,
      label: 'Skip to line',
      run: e => ed.STL(e),
    });
  };
  D.remDefaultMap = (me) => {
    const kbs = me._standaloneKeybindingService;
    kbs.addDynamicKeybinding('-editor.action.insertCursorAtEndOfEachLineSelected');
    kbs.addDynamicKeybinding('-editor.action.blockComment');
    kbs.addDynamicKeybinding('-editor.action.formatDocument');
  };
  const l = {
    Unknown: 'unknown',
    Backspace: 'Backspace',
    Tab: 'Tab',
    Enter: 'Enter',
    Shift: 'Shift',
    Ctrl: 'Ctrl',
    Alt: 'Alt',
    PauseBreak: 'PauseBreak',
    CapsLock: 'CapsLock',
    Escape: 'Escape',
    Space: 'Space',
    PageUp: 'PageUp',
    PageDown: 'PageDown',
    End: 'End',
    Home: 'Home',
    LeftArrow: 'Left',
    UpArrow: 'Up',
    RightArrow: 'Right',
    DownArrow: 'Down',
    Insert: 'Insert',
    Delete: 'Delete',
    KEY_0: '0',
    KEY_1: '1',
    KEY_2: '2',
    KEY_3: '3',
    KEY_4: '4',
    KEY_5: '5',
    KEY_6: '6',
    KEY_7: '7',
    KEY_8: '8',
    KEY_9: '9',
    KEY_A: 'A',
    KEY_B: 'B',
    KEY_C: 'C',
    KEY_D: 'D',
    KEY_E: 'E',
    KEY_F: 'F',
    KEY_G: 'G',
    KEY_H: 'H',
    KEY_I: 'I',
    KEY_J: 'J',
    KEY_K: 'K',
    KEY_L: 'L',
    KEY_M: 'M',
    KEY_N: 'N',
    KEY_O: 'O',
    KEY_P: 'P',
    KEY_Q: 'Q',
    KEY_R: 'R',
    KEY_S: 'S',
    KEY_T: 'T',
    KEY_U: 'U',
    KEY_V: 'V',
    KEY_W: 'W',
    KEY_X: 'X',
    KEY_Y: 'Y',
    KEY_Z: 'Z',
    Meta: 'Meta',
    ContextMenu: 'ContextMenu',
    F1: 'F1',
    F2: 'F2',
    F3: 'F3',
    F4: 'F4',
    F5: 'F5',
    F6: 'F6',
    F7: 'F7',
    F8: 'F8',
    F9: 'F9',
    F10: 'F10',
    F11: 'F11',
    F12: 'F12',
    F13: 'F13',
    F14: 'F14',
    F15: 'F15',
    F16: 'F16',
    F17: 'F17',
    F18: 'F18',
    F19: 'F19',
    NumLock: 'NumLock',
    ScrollLock: 'ScrollLock',
    US_SEMICOLON: ';',
    US_EQUAL: '=',
    US_COMMA: ',',
    US_MINUS: '-',
    US_DOT: '.',
    US_SLASH: '/',
    US_BACKTICK: '`',
    ABNT_C1: 'ABNT_C1',
    ABNT_C2: 'ABNT_C2',
    US_OPEN_SQUARE_BRACKET: '[',
    US_BACKSLASH: '\\',
    US_CLOSE_SQUARE_BRACKET: ']',
    US_QUOTE: '\'',
    OEM_8: 'OEM_8',
    OEM_102: 'OEM_102',
    NUMPAD_0: 'NumPad0',
    NUMPAD_1: 'NumPad1',
    NUMPAD_2: 'NumPad2',
    NUMPAD_3: 'NumPad3',
    NUMPAD_4: 'NumPad4',
    NUMPAD_5: 'NumPad5',
    NUMPAD_6: 'NumPad6',
    NUMPAD_7: 'NumPad7',
    NUMPAD_8: 'NumPad8',
    NUMPAD_9: 'NumPad9',
    NUMPAD_MULTIPLY: 'NumPad_Multiply',
    NUMPAD_ADD: 'NumPad_Add',
    NUMPAD_SEPARATOR: 'NumPad_Separator',
    NUMPAD_SUBTRACT: 'NumPad_Subtract',
    NUMPAD_DECIMAL: 'NumPad_Decimal',
    NUMPAD_DIVIDE: 'NumPad_Divide',
  };
  Object.keys(l).forEach((k) => { l[l[k]] = k; });
  D.keyMap.labels = l;
}
