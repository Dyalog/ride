// various stuff related to keymapping
{
  D.prf.prefixKey((x, old) => {
    if (x !== old) {
      const m = D.keyMap.dyalogDefault;
      m[`'${x}'`] = m[`'${old}'`]; delete m[`'${old}'`];
    }
  });

  D.defaultPrefix = (lc) => (/^d[ae]/.test(lc) ? '<' : D.prf.prefixKey.getDefault());

  const { layouts } = D.kbds;
  if (!layouts[D.prf.kbdLocale()]) {
    const s = D.el ? nodeRequire('os-locale').sync() : navigator.language;
    const l = s.slice(0, 2).toLowerCase(); // language
    const c = s.slice(3, 5).toUpperCase(); // country
    // default layout for country c
    const d = Object.keys(layouts).filter((x) => x.slice(3, 5) === c).sort()[0];
    let lc;
    if (D.mac && layouts[`${l}_${c}_Mac`]) lc = `${l}_${c}_Mac`;
    else if (layouts[`${l}_${c}`]) lc = `${l}_${c}`;
    else lc = d || 'en_US';
    D.prf.kbdLocale(lc);
    D.prf.prefixKey(D.defaultPrefix(lc));
  }
  // D.kbds.layouts[lc] contains four strings describing how keys map to characters:
  //  0:normal  1:shifted
  //  2:APL     3:APL shifted
  // Each string can be indexed by scancode: http://www.abreojosensamblador.net/Productos/AOE/html/Pags_en/ApF.html
  // "APL" and "APL shifted" are the defaults upon which the user can build customisations.
  let bq; // effective ` map as a dictionary, kept in sync with the prefs
  const updBQ = () => {
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
  };
  updBQ(); D.prf.prefixMaps(updBQ); D.prf.kbdLocale(updBQ);
  const openURI = (uri) => { D.openExternal(encodeURI(uri)); };

  D.keyMap.dyalogDefault = { };

  $.extend(D.commands, {
    TB() { D.ide.switchWin(-1); },
    BT() { D.ide.switchWin(1); },
    CT() { document.execCommand('Cut'); },
    CP() { document.execCommand('Copy'); },
    PT(me) {
      if (D.el) {
        document.execCommand('Paste');
      } else if (me) {
        navigator.clipboard.readText().then((text) => {
          me.executeEdits('D', me.getSelections().map((range) => ({ range, text, forceMoveMarkers: true })));
        }, (error) => {
          console.log('Failed to read clipboard', error);
        });
      }
    },
    SA(me) {
      if (me) me.setSelection(me.getModel().getFullModelRange());
      else document.execCommand('SelectAll');
    },
    RDO(me) { me.trigger('D', 'redo'); },
    UND(me) { me.trigger('D', 'undo'); },
    PRF() { D.prf_ui(); },
    ABT() {
      if (D.el && D.ide && D.ide.floating) D.ipc.of.ride_master.emit('ABT');
      else D.abt();
    },
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
        env: {
          ...process.env,
          RIDE_CONNECT: '',
          RIDE_SPAWN: '',
          DYALOG_SPAWN: '',
          RIDE_AUTO_START: 0,
        },
      });
      if (D.ide.dead) window.close();
    },
    CNNW() { D.configNew(); },
    CNCL() { D.configClone(); },
    CNDL() { D.configDelete(); },
    CNCP() { D.recreatePresets(); },
    DHI() {
      openURI(D.hlp.INDEX);
    },
    RHP() {
      openURI(D.hlp.RIDEHLP);
    },
    DOX() {
      openURI(D.hlp.DOX);
    },
    EMD() {
      openURI(D.hlp.MAILTO);
    },
    ENH() {
      openURI(D.hlp.ENHANCEMENTS);
    },
    LEL() {
      openURI(D.hlp.LANGELEMENTS);
    },
    RME() {
      openURI(D.hlp.README);
    },
    TPL() {
      openURI(D.hlp.THIRDPARTY);
    },
    OWS() {
      if (D.el && D.ide.floating) {
        D.ipc.of.ride_master.emit('OWS');
        return;
      }
      if (D.el && D.isLocalInterpreter) {
        const x = D.el.dialog.showOpenDialogSync(D.elw, {
          title: 'Open file',
          filters: [],
          properties: ['openFile'],
        });
        if (!x) return;
        const [v] = x;
        const qt = /\s/.test(v) ? '"' : '';
        if (/\.dws$/i.test(v)) {
          $.confirm(
            `Run Latent Expression of ${v.replace(/^.*[\\/]/, '')}?`,
            'Load Workspace',
            (y) => D.ide.exec([`      )${(y ? '' : 'x')}load ${qt}${v}${qt}\n`], 0),
          );
        } else {
          D.ide.exec([`      )ED ${qt}file://${v}${qt}\n`], 0);
        }
      }
    },
    NEW() {
      if (!D.el) return;
      if (D.ide.floating) {
        D.ipc.of.ride_master.emit('NEW');
        return;
      }
      if (D.lastSpawnedExe) {
        const e = {};
        Object.keys(process.env).forEach((k) => { e[k] = process.env[k]; });
        e.RIDE_SPAWN = D.lastSpawnedExe; const p = D.el.process.argv;
        nodeRequire('child_process').spawn(p[0], p.slice(1), {
          detached: true, stdio: ['ignore', 'ignore', 'ignore'], env: e,
        });
      } else {
        $.err('The current session is remote.\nTo connect elsewhere or\nlaunch a local interpreter,\n'
            + 'please use "New Session..." instead.', 'Cannot Start New Session');
      }
    },
    DK(me) { me.trigger('editor', 'editor.action.deleteLines'); },
    QCP(me) { me.trigger('editor', 'editor.action.quickCommand'); },
    QIT() { D.quit(); },
    ASW: D.prf.autoStatus.toggle,
    LBR: D.prf.lbar.toggle,
    SBR: D.prf.sbar.toggle,
    SSW: D.prf.statusWindow.toggle,
    WI() { D.send('WeakInterrupt', {}); },
    SI() { D.send('StrongInterrupt', {}); },
    FUL() {
      const d = document;
      const e = d.body;
      let x;
      if (d.fullscreenElement || d.webkitFullscreenElement
        || d.mozFullScreenElement || d.msFullscreenElement) {
        x = d.exitFullscreen || d.webkitExitFullscreen
          || d.mozCancelFullScreen || d.msExitFullscreen;
        x && x.apply(d);
      } else {
        x = e.requestFullscreen || e.webkitRequestFullscreen
          || e.mozRequestFullScreen || e.msRequestFullscreen;
        x && x.apply(e);
      }
    },
    EXP(me) { me.trigger('editor', 'editor.action.smartSelect.grow'); },
    HLP(me) {
      const c = me.getPosition();
      let s = me.getModel().getLineContent(c.lineNumber);

      D.ide.requestHelp(s, c.column - 1).then(
        (url) => {
          openURI(url);
        },
        () => {
          s = s.toLowerCase();
          const h = D.hlp;
          let u; // u: the URL
          let m; // m: match object
          if ((m = /^ *(\)[a-z]+).*$/.exec(s))) u = h[m[1]] || h.WELCOME;
          else if ((m = /^ *(\][a-z]+).*$/.exec(s))) u = h[m[1]] || h.UCMDS;
          else if ((m = /(\d+) *⌶$/.exec(s.slice(0, c.column)))) u = h[`${m[1]}⌶`] || `${h['⌶']}#${m[1]}`;
          else {
            const cc = c.column - 1;
            const r = '[A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ0-9]*'; // r:regex fragment used for a name
            const word = (
              ((RegExp(`⎕?${r}$`).exec(s.slice(0, cc)) || [])[0] || '') // match left of cursor
              + ((RegExp(`^${r}`).exec(s.slice(cc)) || [])[0] || '') // match right of cursor
            ).replace(/^\d+/, ''); // trim leading digits
            const x = s.slice(s.slice(0, c.column).replace(/.[áa-z]*$/i, '').length)
              .replace(/^([⎕:][áa-z]*|.).*$/i, '$1').replace(/^:end/, ':');
            if (word.length > x.length) u = `${h.INDEX}#search-${word}`;
            else if (h[x]) u = h[x];
            else if (x[0] === '⎕') u = h.SYSFNS;
            else if (x[0] === ':') u = h.CTRLSTRUCTS;
            else u = h.LANGELEMENTS;
          }
          openURI(u);
        },
      );
    },
    LL(me) { me.trigger('editor', 'cursorHome'); },
    RL(me) {
      const sels = me.getSelections().map((c) => {
        const pl = c.positionLineNumber;
        const sc = c.startColumn - 1;
        const t = me.getModel().getLineContent(pl);
        const n = t.length;
        const m = t.replace(/ +$/, '').length;
        const nc = 1 + ((m <= sc && sc < n) || !m ? n : m);
        return new monaco.Selection(pl, nc, pl, nc);
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
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
        },
      });
      D.elm.enable(w.webContents);
      const cn = nodeRequire(`${__dirname}/src/cn`);
      D.logw = w;
      w.setTitle(`Protocol Log - ${D.ide.caption}`);
      w.loadURL(`file://${__dirname}/empty.html`);
      w.webContents.executeJavaScript('var d = document, h=d.documentElement, b=d.body, e=d.createElement("div");'
                                    + 'b.style.fontFamily="monospace";b.style.overflow="scroll";'
                                    + 'e.style.whiteSpace="pre";!!b.appendChild(e);');
      const f = (x) => {
        const t = JSON.stringify(`${x}\n`);
        w.webContents.executeJavaScript(`e.textContent += ${t}; h.scrollTop = h.scrollHeight`);
      };
      f(cn.getLog().filter((x) => x).join('\n'));
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
    POE() { D.prf.pauseOnError.toggle(); },
    PAT() { D.send('PauseAllThreads', { pause: 1 }); },
    UAT() { D.send('PauseAllThreads', { pause: 0 }); },
    ZM(me) {
      const w = me.dyalogCmds;
      w.container.parent.toggleMaximise();
      setTimeout(() => { me && me.focus(); }, 100);
    },
    ZMI() { D.prf.zoom(Math.min(12, D.prf.zoom() + 1)); },
    ZMO() { D.prf.zoom(Math.max(-10, D.prf.zoom() - 1)); },
    ZMR() { D.prf.zoom(0); },
    RLB() { D.prf.lbarOrder(D.lb.order); },
  });

  const pfKey = (i) => () => D.ide.pfKey(i);
  for (let i = 1; i <= 48; i++) D.commands[`PF${i}`] = pfKey(i);

  // order: used to measure how "complicated"
  // (for some made-up definition of the word) a shortcut is.
  // Tooltips in the lbar show the simplest one.
  const order = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const complexity = (x) => (1 + order.indexOf(x)) || (1 + order.length + x.charCodeAt(0));

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
  const defCmd = (x) => {
    const c = D.commands;
    c[x] || (c[x] = (me) => {
        const h = me.dyalogCmds;
        (h && h[x]) ? h.execCommand(x) : $.alert(`Command ${x} not implemented.`);
    });
  };
  ('CLS CBP EMI MA AC IT VAL indentOrComplete indentMoreOrAutocomplete STL TVO TVB'
  + ' TGC JBK JSC LOG WSE').split(' ').forEach(defCmd);
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
      Cmd: D.mac ? km.CtrlCmd : km.WinCtrl,
      Option: km.Alt,
      Win: km.WinCtrl,
      Meta: km.CtrlCmd,
    };
    const stlkbs = [];
    const fxkbs = [];
    function monacoKeyBinding(ks) {
      return ks.replace(/\+(.)/g, '\n$1').split('\n').reduce((a, ko) => {
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
        if (cmd === 'FX') { fxkbs.push(nkc); return; }
        if (cmd === 'ER') {
          cond = 'tracer && !editorHasMultipleSelections && !findInputFocussed && !inSnippetMode';
        } else if (cmd === 'TC' || cmd === 'IT') {
          cond = 'tracer';
        } else if (cmd === 'LL' || cmd === 'RL') {
          cond = '!suggestWidgetVisible && !findInputFocussed';
        } else if (nkc === kc.Escape) cond = '!suggestWidgetVisible && !editorHasMultipleSelections && !findWidgetVisible && !inSnippetMode';
        me.addCommand(nkc, () => D.commands[cmd](me), cond);
      });
    }
    addCmd(D.keyMap.dyalogDefault);
    addCmd(D.keyMap.dyalog);
    me.addCommand(
      kc.Tab,
      () => ed.indentOrComplete(me),
      '!suggestWidgetVisible && !editorHasMultipleSelections && !findWidgetVisible && !inSnippetMode && !editorTabMovesFocus',
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
      keybindings: stlkbs,
      label: 'Skip to line',
      run: (e) => ed.STL(e),
    });
    me.addAction({
      id: 'dyalog-fix',
      contextMenuGroupId: 'modification',
      contextMenuOrder: 0,
      precondition: '!tracer && !session',
      keybindings: fxkbs,
      label: 'Fix',
      run: (e) => ed.FX(e),
    });
  };
  D.remDefaultMap = (me) => {
    const kbs = me._standaloneKeybindingService;
    kbs.addDynamicKeybinding('-editor.action.insertCursorAtEndOfEachLineSelected', null, () => {});
    kbs.addDynamicKeybinding('-editor.action.blockComment', null, () => {});
    kbs.addDynamicKeybinding('-editor.action.formatDocument', null, () => {});
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
    Digit0: '0',
    Digit1: '1',
    Digit2: '2',
    Digit3: '3',
    Digit4: '4',
    Digit5: '5',
    Digit6: '6',
    Digit7: '7',
    Digit8: '8',
    Digit9: '9',
    KeyA: 'A',
    KeyB: 'B',
    KeyC: 'C',
    KeyD: 'D',
    KeyE: 'E',
    KeyF: 'F',
    KeyG: 'G',
    KeyH: 'H',
    KeyI: 'I',
    KeyJ: 'J',
    KeyK: 'K',
    KeyL: 'L',
    KeyM: 'M',
    KeyN: 'N',
    KeyO: 'O',
    KeyP: 'P',
    KeyQ: 'Q',
    KeyR: 'R',
    KeyS: 'S',
    KeyT: 'T',
    KeyU: 'U',
    KeyV: 'V',
    KeyW: 'W',
    KeyX: 'X',
    KeyY: 'Y',
    KeyZ: 'Z',
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
    Semicolon: ';',
    Equal: '=',
    Comma: ',',
    Minus: '-',
    Period: '.',
    Slash: '/',
    Backquote: '`',
    BracketLeft: '[',
    Backslash: '\\',
    BracketRight: ']',
    Quote: '\'',
    OEM_8: 'OEM_8',
    IntlBackslash: 'OEM_102',
    Numpad0: 'NumPad0',
    Numpad1: 'NumPad1',
    Numpad2: 'NumPad2',
    Numpad3: 'NumPad3',
    Numpad4: 'NumPad4',
    Numpad5: 'NumPad5',
    Numpad6: 'NumPad6',
    Numpad7: 'NumPad7',
    Numpad8: 'NumPad8',
    Numpad9: 'NumPad9',
    NumpadMultiply: 'NumPad_Multiply',
    NumpadAdd: 'NumPad_Add',
    NUMPAD_SEPARATOR: 'NumPad_Separator',
    NumpadSubtract: 'NumPad_Subtract',
    NumpadDecimal: 'NumPad_Decimal',
    NumpadDivide: 'NumPad_Divide',
    KEY_IN_COMPOSITION: 'KEY_IN_COMPOSITION',
    ABNT_C1: 'ABNT_C1',
    ABNT_C2: 'ABNT_C2',
    AudioVolumeMute: 'AudioVolumeMute',
    AudioVolumeUp: 'AudioVolumeUp',
    AudioVolumeDown: 'AudioVolumeDown',
    BrowserSearch: 'BrowserSearch',
    BrowserHome: 'BrowserHome',
    BrowserBack: 'BrowserBack',
    BrowserForward: 'BrowserForward',
    MediaTrackNext: 'MediaTrackNext',
    MediaTrackPrevious: 'MediaTrackPrevious',
    MediaStop: 'MediaStop',
    MediaPlayPause: 'MediaPlayPause',
    LaunchMediaPlayer: 'LaunchMediaPlayer',
    LaunchMail: 'LaunchMail',
    LaunchApp2: 'LaunchApp2',
    MAX_VALUE: 'MAX_VALUE',
  };
  Object.keys(l).forEach((k) => { l[l[k]] = k; });
  D.keyMap.labels = l;
}
