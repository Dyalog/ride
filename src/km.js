// various stuff related to keymapping
{
  D.prf.prefixKey((x, old) => {
    if (x !== old) {
      const m = CM.keyMap.dyalogDefault;
      m[`'${x}'`] = m[`'${old}'`]; delete m[`'${old}'`];
    }
  });

  CM.keyMap.dyalogDefault = { fallthrough: 'default', End: 'goLineEndSmart' };
  // D.db is initialised later in init.js, so we must wait until the next tick for D.prf.prefixKey()
  setTimeout(() => { CM.keyMap.dyalogDefault[`'${D.prf.prefixKey()}'`] = 'BQC'; }, 1);
  $.extend(CM.commands, {
    TB() { D.ide.switchWin(1); },
    BT() { D.ide.switchWin(-1); },
    SA: CM.commands.selectAll,
    CT() { document.execCommand('Cut'); },
    CP() { document.execCommand('Copy'); },
    PT() { document.execCommand('Paste'); },
    EMD(cm) { D.send('Edit', { win: cm.dyalogCmds.id, pos: 0, text: '' }); },
    TO: CM.commands.toggleFold,
    PRF() { D.prf_ui(); },
    ABT() { D.abt(); },
    CNC() {
      const p = D.el.process.argv; // if(D.mac)p=p.replace(/(\/Contents\/).*$/,'$1MacOS/nwjs')
      node_require('child_process').spawn(p[0], p.slice(1), {
        detached: true,
        stdio: ['ignore', 'ignore', 'ignore'],
        env: $.extend({}, process.env, { RIDE_SPAWN: '' }),
      });
      if (D.ide.dead) window.close();
    },
    OWS() {
      if (D.el && D.lastSpawnedExe) {
        const v = D.el.dialog.showOpenDialog(D.elw, {
          title: 'Load Workspace',
          filters: [{ name: 'Workspaces', extensions: ['dws'] }],
          properties: ['openFile'],
        });
        if (v) {
          $.confirm(
            `Run Latent Expression of ${v[0].replace(/^.*[\\/]/, '')}?`,
            'Load Workspace',
            x => D.ide.exec([`      )${(x ? '' : 'x')}load ${v[0]}\n`], 0),
          );
        }
      }
    },
    NEW() {
      if (!D.el) return;
      if (D.lastSpawnedExe) {
        const e = {};
        Object.keys(process.env).forEach((k) => { e[k] = process.env[k]; });
        e.RIDE_SPAWN = D.lastSpawnedExe; const p = D.el.process.argv;
        node_require('child_process').spawn(p[0], p.slice(1), {
          detached: true, stdio: ['ignore', 'ignore', 'ignore'], env: e,
        });
      } else {
        $.err('The current session is remote.\nTo connect elsewhere or\nlaunch a local interpreter,\n' +
              'please use "Connect..." instead.', 'Cannot Start New Session');
      }
    },
    QIT() { D.quit(); },
    LBR: D.prf.lbar.toggle,
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
    EXP(me) {
      const sels = me.getSelections();
      const ll = me.model.getLineCount();
      const u = me.getPosition();
      const l = u.lineNumber;
      if (sels.length !== 1) return;
      // candidates for selection as [line0,ch0,line1,ch1], more candidates will be added later
      const ranges = [
        [l, 1, l, me.model.getLineMaxColumn(l)], // current line
        [1, 1, ll, me.model.getLineMaxColumn(ll)], // whole document
      ];
      // choose token on the left or right based on how important it looks, and add it to "ranges"
      const t0 = me.getTokenAt(u);
      const t1 = me.getTokenAt({ line: u.lineNumber, ch: u.column + 1 });
      let tu = t0 || t1;
      if (t0 && t1 && (t0.start !== t1.start || t0.end !== t1.end)) {
        // we must decide which token looks more important
        const lr = [t0, t1].map(ti => (ti.type || '').replace(/^.*\bapl-(\w*)$/, '$1')); // lft and rgt token type
        const I = { // importance table
          var: 5, glb: 5, quad: 4, str: 3, num: 2, kw: 1, par: -1, sqbr: -1, semi: -1, dfn: -1, '': -2,
        };
        tu = (I[lr[0]] || 0) > (I[lr[1]] || 0) ? t0 : t1; // tu is the more important of t0 t1
      }
      tu && ranges.push([l, tu.start, l, tu.end]);
      // look for surrounding pairs of balanced brackets and add them to "ranges"
      const ts = me.getLineTokens(l);
      const tl = [];
      const tr = []; // tl,tr: tokens for closest op. and cl. brackets, indexed by stack height
      for (let i = 0; i < ts.length; i++) {
        const t = ts[i];
        const h = (t.state.a || []).length; // stack height
        if (t.end <= u.ch && '([{'.indexOf(t.string) >= 0) tl[h] = t;
        if (t.start >= u.ch && ')]}'.indexOf(t.string) >= 0) tr[h + 1] = tr[h + 1] || t;
      }
      const mh = (tu.state.a || []).length; // stack height at current token
      for (let h = Math.min(mh, Math.min(tl.length, tr.length) - 1); h >= 0; h--) {
        tl[h] && tr[h] &&
          ranges.push([l, tl[h].end, l, tr[h].start], [l, tl[h].start, l, tr[h].end]);
      }
      const sA = sels[0].anchor;
      const sH = sels[0].head;
      let s = [sA.line, sA.ch, sH.line, sH.ch];
      // anchor and head could be in reverse order
      if ((s[0] - s[2] || s[1] - s[3]) > 0) s = [s[2], s[3], s[0], s[1]];
      let b = ranges[0]; // best candidate for new selection
      for (let i = 0; i < ranges.length; i++) {
        // choose candidate that wraps tightest around current selection
        const r = ranges[i];
        const d0 = r[0] - s[0] || r[1] - s[1] || 0;
        const d1 = r[2] - s[2] || r[3] - s[3] || 0;
        if (d0 <= 0 && d1 >= 0 && (d0 || d1) &&
          ((b[0] - r[0] || b[1] - r[1] || 0) <= 0 ||
          (b[2] - r[2] || b[3] - r[3] || 0) >= 0)) b = r;
      }
      me.setSelection(CM.Pos(b[0], b[1]), CM.Pos(b[2], b[3]));
    },
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
        u = h[x] || (x[0] === '⎕' ? h.SYSFNS : x[0] === ':' ? h.CTRLSTRUCTS : h.LANGELEMENTS);
      }
      D.openExternal(u);
    },
    BQC(me) {
      if (me.dyalogBQ) return;
      me.dyalogBQ = me.model.onDidChangeContent(x => bqChangeHandlerMe(me, x));
    },
    goLineEndSmart(me) { // CodeMirror provides a goLineStartSmart but not a goLineEndSmart command.
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
    },
    JSC() {
      let w; D.el && (w = D.el.BrowserWindow.getFocusedWindow()) && w.webContents.toggleDevTools();
    },
    LOG() {
      if (!D.el) return;
      const w = new D.el.BrowserWindow({ width: 400, height: 500, parent: D.elw });
      const cn = node_require(`${__dirname}/src/cn`);
      D.logw = w;
      w.setTitle('Protocol Log');
      w.loadURL(`file://${__dirname}/empty.html`);
      w.webContents.executeJavaScript('var d = document, b=d.body,e=d.createElement("div");' +
                                      'b.style.fontFamily="monospace";b.style.overflow="scroll";' +
                                      'e.style.whiteSpace="pre";b.appendChild(e)');
      const f = (x) => {
        const t = JSON.stringify(`${x}\n`);
        w.webContents.executeJavaScript(`e.textContent += ${t}; b.scrollTop = b.scrollHeight`);
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
    SC: CM.commands.find,
    RP: CM.commands.replace,
    PV: CM.commands.findPrev,
    NX: CM.commands.findNext,
  });
  // pfkeys
  function nop() {}
  function fakeEvent(s) {
    const e = {
      type: 'keydown',
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: nop,
      stopPropagation: nop,
    };
    const h = { C: 'ctrlKey', A: 'altKey', S: 'shiftKey' };
    const s1 = s.replace(/(\w+)-/g, (_, type) => {
      e[h[type] || `${type.toLowerCase()}Key`] = true; return '';
    });
    // for (var k in CM.keyNames)if(CM.keyNames[k]===s1){e.keyCode=k;break}
    e.keyCode = Object.keys(CM.keyNames).find(k => CM.keyNames[k] === s1);
    e.keyCode || fail(`Unknown key:${JSON.stringify(s)}`);
    return e;
  }
  for (let i = 1; i <= 12; i++) {
    CM.commands[`PF${i}`] = function pfk(j) {
      D.prf.pfkeys()[j].replace(/<(.+?)>|(.)/g, (_, x, y) => {
        const w = D.ide.focusedWin;
        if (y) w.insert(y);
        else if (CM.commands[x]) w.cm.execCommand(x);
        else w.cm.triggerOnKeyDown(fakeEvent(x));
      });
    }.bind(this, i);
  }

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
  function bqCleanUpMe(me) {
    if (me.dyalogBQ) {
      me.dyalogBQ.dispose(); delete me.dyalogBQ;
      me.trigger('editor', 'hideSuggestWidget');
      // const sw = me.contentWidgets['editor.widget.suggestWidget'];
      // setTimeout(() => sw && sw.widget && sw.widget.hideWidget(), 50);
    }
  }
  function bqChangeHandlerMe(me, o) { // o:changeObj
    if (!me.dyalogBQ) return;
    const chg = o.changes[0];
    const r = chg.range;
    const l = r.startLineNumber;
    const c = r.startColumn;
    const x = chg.text[0];
    const pk = D.prf.prefixKey();
    const s = me.model.getLineContent(l);
    if (s.slice(c - 3, c) === `${pk}${pk}${pk}`) { // ``` for ⋄
      const nr = new monaco.Range(l, c - 2, l, c + 1);
      const ns = new monaco.Selection(l, c - 1, l, c - 1);
      bqCleanUpMe(me);
      setTimeout(() => {
        me.listen = false;
        me.executeEdits('D', [{ range: nr, text: bq[pk] || '' }], [ns]);
        me.listen = true;
      }, 1);
    } else if (s.slice(c - 3, c - 1) === `${pk}${pk}`) { // bqbqc
      me.dyalogBQ && me.dyalogBQ.dispose(); delete me.dyalogBQ;
    } else if (s[c - 2] !== pk) {
      bqCleanUpMe(me);
    } else if (x !== pk) {
      const y = x === ' ' ? pk : bq[x];
      if (y) {
        const nr = new monaco.Range(l, c - 1, l, c + chg.text.length);
        const ns = new monaco.Selection(l, c, l, c);
        bqCleanUpMe(me);
        setTimeout(() => {
          me.listen = false;
          me.executeEdits('D', [{ range: nr, text: y }], [ns]);
          me.listen = true;
        }, 1);
      } else {
        bqCleanUpMe(me);
      }
    }
  }

  const bqbqc = []; // backquote-backquote completions
  D.bqbqc = bqbqc;
  for (let i = 0; i < D.informal.length; i++) {
    const a = D.informal[i].split(' ');
    for (let j = 1; j < a.length; j++) {
      bqbqc.push({
        name: a[j],
        text: a[0],
        render: ((squiggle, name) => (x) => { // bind squiggle=a[0] and name=a[j]
          const key = D.getBQKeyFor(squiggle);
          const pk = D.prf.prefixKey(); // the actual .render() function
          x.textContent = `${squiggle} ${key ? pk + key : '  '} ${pk}${pk}${name}`;
        })(a[0], a[j]),
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
    'BP', 'AB', 'HT', 'TH', 'RM', 'CB', 'PR', 'SR', null, 'TL', 'UA', 'AO', 'DO', 'GL', 'CH', 'PU', // 50
    'PA', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, // 60
    null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, // 70
    null, null, null, null, null, null, 'TO', 'MO', null, null, null, null, null, 'S1', 'S2', 'OS', // 80
  ];
  function defCmd(x) {
    const c = CM.commands;
    c[x] || (c[x] = (cm) => { const h = cm.dyalogCmds; h && h[x] && h[x](cm); });
  }
  ('CBP MA AC VAL indentOrComplete downOrXline indentMoreOrAutocomplete STL TVO TVB' +
  ' TGC JBK JSC LOG WSE').split(' ').forEach(defCmd);
  for (let i = 0; i < C.length; i++) {
    if (C[i]) {
      defCmd(C[i]);
      CM.keyMap.dyalogDefault[`'${String.fromCharCode(0xf800 + i)}'`] = C[i];
    }
  }
  D.mapKeys = (ed) => {
    const { me } = ed;
    const kc = monaco.KeyCode;
    const km = monaco.KeyMod;
    const ctrlcmd = {
      Ctrl: D.mac ? km.WinCtrl : km.CtrlCmd,
      Cmd: km.CtrlCmd,
      Esc: kc.Escape,
      Pause: kc.PauseBreak,
      '\\': kc.US_BACKSLASH,
      '`': kc.US_BACKTICK,
      ']': kc.US_CLOSE_SQUARE_BRACKET,
      ',': kc.US_COMMA,
      '.': kc.US_DOT,
      '=': kc.US_EQUAL,
      '-': kc.US_MINUS,
      '[': kc.US_OPEN_SQUARE_BRACKET,
      '\'': kc.US_QUOTE,
      ';': kc.US_SEMICOLON,
      '/': kc.US_SLASH,
    };
    function addCmd(map) {
      Object.keys(map).forEach((ks) => {
        const nkc = ks.replace(/--/g, '-US_MINUS').split('-').reduce(((a, ko) => {
          const k = ko.replace(/^[A-Z0-9]$/, 'KEY_$&')
            .replace(/^Numpad(.*)/, (m, p) => `NUMPAD_${p.toUpperCase()}`)
            .replace(/^(Up|Left|Right|Down)$/, '$1Arrow')
            .replace(/^'(.)'$/, '$1');
          return a | (ctrlcmd[k] || km[k] || kc[k]); // eslint-disable-line no-bitwise
        }), 0);
        const cmd = map[ks];
        if (nkc) {
          let cond;
          if (cmd === 'BQC') {
            return;
          } else if (cmd === 'TGC') {
            me.addCommand(nkc, () => me.trigger('editor', 'editor.action.commentLine'));
            return;
          } else if (cmd === 'AO') {
            me.addCommand(nkc, () => me.trigger('editor', 'editor.action.addCommentLine'));
            return;
          } else if (cmd === 'DO') {
            me.addCommand(nkc, () => me.trigger('editor', 'editor.action.removeCommentLine'));
            return;
          } else if (cmd === 'SC') {
            me.addCommand(nkc, () => me.trigger('editor', 'actions.find'));
            return;
          } else if (cmd === 'RP') {
            me.addCommand(nkc, () => me.trigger('editor', 'editor.action.startFindReplaceAction'));
            return;
          } else if (cmd === 'ER') {
            cond = 'tracer && !suggestWidgetVisible && !editorHasMultipleSelections && !findWidgetVisible && !inSnippetMode';
          } else if (cmd === 'TC') {
            cond = 'tracer';
          } else if (nkc === kc.Escape) cond = '!suggestWidgetVisible && !editorHasMultipleSelections && !findWidgetVisible && !inSnippetMode';
          me.addCommand(nkc, () => CM.commands[cmd](me), cond);
        }
      });
    }
    addCmd(CM.keyMap.dyalogDefault);
    addCmd(CM.keyMap.dyalog);
  };
}
