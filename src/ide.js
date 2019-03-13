// represents the main screen of a connected RIDE
// holds refs to the session (.win[0]), editors/tracers (.win[i])
// and an instance of the workspace explorer (.wse) defined in wse.js
// manages the language bar, its tooltips, and the insertion of characters
// processes incoming RIDE protocol messages
D.IDE = function IDE(opts = {}) {
  const ide = this;
  I.cn.hidden = 1;
  this.lbarRecreate();
  D.ide = ide;
  ide.dom = I.ide; I.ide.hidden = 0;
  ide.floating = opts.floating;
  ide.hadErr = -1;
  ide.ipc = opts.ipc;
  // lines to execute: AtInputPrompt consumes one item from the queue, HadError empties it
  ide.pending = [];
  ide.promptType = 1;
  ide.exec = (a, tc) => {
    if (a && a.length) {
      tc || (ide.pending = a.slice(1));
      D.send('Execute', { trace: tc, text: `${a[0]}\n` });
      ide.getStats();
    }
  };
  ide.host = ''; ide.port = ''; ide.wsid = '';
  ide.wins = {};
  if (ide.floating) {
    ide.connected = 1;
    this._focusedWin = null;
    Object.defineProperty(ide, 'focusedWin', {
      set(w) {
        ide.ipc.emit('focusedWin', w.id);
        this._focusedWin = w;
      },
      get() { return this._focusedWin; },
    });
    ide.switchWin = (x) => { ide.ipc.emit('switchWin', x); };
  } else {
    D.prf.title(ide.updTitle.bind(ide));
    I.sb_sis.hidden = !1;
    I.sb_threads.hidden = !1;
    ide.wins[0] = new D.Se(ide);
    D.wins = ide.wins;

    ide.focusedWin = ide.wins['0']; // last focused window, it might not have the focus right now
    ide.switchWin = (x) => { // x: +1 or -1
      const a = [];
      let i = -1;
      const { wins } = D.ide;
      Object.keys(wins).forEach((k) => {
        wins[k].hasFocus() && (i = a.length);
        a.push(wins[k]);
      });
      const j = i < 0 ? 0 : (i + a.length + x) % a.length;
      const w = a[j];
      if (!w.bwId) D.elw.focus();
      w.focus(); return !1;
    };
    D.el && D.prf.floating() && D.IPC_CreateWindow(1);
  }
  // We need to be able to temporarily block the stream of messages coming from socket.io
  // Creating a floating window can only be done asynchronously and it's possible that a message
  // for it comes in before the window is ready.
  const mq = []; // mq:message queue
  let blk = 0; // blk:blocked?
  let tid = 0; // tid:timeout id
  let last = 0; // last:when last rundown finished
  const pfq = []; // pfkey queue
  let pfqtid = 0; // pfkey timeout id
  // pfkeys
  function pfKeyRun() {
    if (pfq.length && ide.wins[0].promptType && !blk) {
      const { text, cmd } = pfq.shift();
      const w = D.ide.focusedWin;
      if (text) w.insert(text);
      else w.execCommand(cmd);
    }
    if (pfq.length) pfqtid = setTimeout(pfKeyRun, D.prf.floating() ? 100 : 20);
    else pfqtid = 0;
  }
  ide.pfKey = (x) => {
    if (ide.floating) ide.ipc.emit('pfKey', x);
    else {
      D.prf.pfkeys()[x].replace(/<(.+?)>|([^<>]+)/g, (_, cmd, text) => {
        pfq.push({ cmd, text });
      });
      pfqtid = pfqtid || setTimeout(pfKeyRun, 1);
    }
  };
  function rd() { // run down the queue
    while (mq.length && !blk) {
      const a = mq.shift(); // a[0]:command name, a[1]:command args
      if (a[0] === 'AppendSessionOutput') { // special case: batch sequences of AppendSessionOutput together
        let s = a[1].result;
        const nq = Math.min(mq.length, 256);
        if (typeof s === 'object') { s = s.join('\n'); ide.bannerDone = 0; }
        let i;
        for (i = 0; i < nq && mq[i][0] === 'AppendSessionOutput'; i++) {
          const r = mq[i][1].result;
          s += typeof r === 'string' ? r : r.join('\n');
        }
        i && mq.splice(0, i);
        ide.wins[0].add(s);
      } else {
        const f = ide.handlers[a[0]];
        f ? f.apply(ide, a.slice(1)) : D.send('UnknownCommand', { name: a[0] });
      }
      if (pfqtid) {
        clearTimeout(pfqtid);
        pfqtid = setTimeout(pfKeyRun, 100);
      }
    }
    last = +new Date(); tid = 0;
  }
  function rrd() { // request rundown
    tid || (new Date() - last < 20 ? (tid = setTimeout(rd, 20)) : rd());
  }
  D.recv = (x, y) => { mq.push([x, y]); rrd(); };
  ide.block = () => { blk += 1; };
  ide.unblock = () => { (blk -= 1) || rrd(); };
  ide.tracer = () => {
    const tc = Object.keys(ide.wins).find(k => !!ide.wins[k].tc);
    return tc && ide.wins[tc];
  };
  [{ comp_name: 'wse', prop_name: 'WSEwidth' }, { comp_name: 'dbg', prop_name: 'DBGwidth' }].forEach((obj) => {
    Object.defineProperty(ide, obj.prop_name, {
      get() {
        const comp = this.gl.root.getComponentsByName(obj.comp_name)[0];
        return comp && comp.container && comp.container.width;
      },
      set(w) {
        const comp = this.gl.root.getComponentsByName(obj.comp_name)[0];
        comp && comp.container && comp.container.setSize(w);
      },
    });
  });

  // language bar
  let ttid; // tooltip timeout id
  let tthide = 0;
  let lbDragged;
  const reqTip = (x, desc, text, t) => { // request tooltip, x:event
    clearTimeout(tthide); tthide = 0;
    clearTimeout(ttid);
    ttid = setTimeout(() => {
      ttid = 0;
      I.lb_tip_desc.textContent = desc;
      I.lb_tip_text.textContent = text;
      I.lb_tip.hidden = 0;
      const s = I.lb_tip.style;
      const x0 = t.offsetLeft - 21;
      const x1 = x0 + I.lb_tip.offsetWidth;
      const y0 = (t.offsetTop + t.offsetHeight) - 3;
      s.top = `${y0}px`;
      const maxHeight = window.innerHeight - (I.lb_tip_body.getBoundingClientRect().top + 30);
      I.lb_tip_body.style.maxHeight = `${maxHeight}px`;
      if (x1 > document.body.offsetWidth) {
        s.left = ''; s.right = '0';
      } else {
        s.left = `${Math.max(0, x0)}px`;
        s.right = '';
      }
    }, 20);
  };
  I.lb.onclick = (x) => {
    const s = x.target.textContent;
    if (lbDragged || x.target.nodeName !== 'B' || /\s/.test(s)) return !1;
    const w = ide.focusedWin;
    if (w.hasFocus()) {
      w.insert(s);
    } else {
      const ae = document.activeElement;
      D.util.insert(ae, s);
      const fw = w.me._overlayWidgets['editor.contrib.findWidget'].widget;
      const fi = fw._findInput;
      const fr = fw._replaceInputBox.inputElement;
      if (fi.inputBox.input === ae) fi._onInput.fire();
      else if (fr === ae) fw._state.change({ replaceString: fr.value }, false);
    }
    return !1;
  };
  function hideTT() { I.lb_tip.hidden = 1; tthide = 0; }
  I.lb.onmouseout = (x) => {
    if (x.target.nodeName === 'B') {
      clearTimeout(ttid); ttid = 0;
      tthide = tthide || setTimeout(hideTT, 200);
    }
  };
  I.lb_tip.onmouseover = () => {
    clearTimeout(tthide); tthide = 0;
  };
  I.lb_tip.onmouseout = () => {
    clearTimeout(tthide);
    tthide = setTimeout(hideTT, 200);
  };
  I.lb.onmouseover = (x) => {
    if (lbDragged || x.target.nodeName !== 'B') return;
    const c = x.target.textContent;
    const k = D.getBQKeyFor(c);
    const s = k && c.charCodeAt(0) > 127 ? `Keyboard: ${D.prf.prefixKey()}${k}\n\n` : '';
    if (/\S/.test(c)) { const h = D.lb.tips[c] || [c, '']; reqTip(x, h[0], s + h[1], x.target); }
  };
  I.lb_prf.onmouseover = (x) => {
    const h = D.prf.keys();
    const pfk = D.prf.pfkeys();
    let s = '';
    for (let i = 0; i < D.cmds.length; i++) {
      const cmd = D.cmds[i];
      const [c, desc, df] = cmd; // c:code, d:description, df:defaults
      const shc = (h[c] || df).slice(-1)[0];
      const code = `${c}  `.slice(0, 4);
      const d = desc || c.replace(/PF(\d+)/, (_, n) => pfk[n]);
      shc && d && (s += `${code}: ${d}:${' '.repeat(Math.max(1, 25 - d.length))}${shc}\n`);
    }
    reqTip(x, 'Keyboard Shortcuts', s, x.currentTarget);
  };
  I.lb_prf.onmouseout = I.lb_tip.onmouseout;
  I.lb_prf.onmousedown = () => { D.prf_ui('shc'); return !1; };
  I.lb_prf.onclick = () => !1; // prevent # from appearing in the URL bar
  I.sb_prf.onmousedown = () => { D.prf_ui(); return !1; };
  I.sb_prf.onclick = () => !1; // prevent # from appearing in the URL bar
  $(I.lb_inner).sortable({
    forcePlaceholderSize: 1,
    placeholder: 'lb_placeholder',
    revert: 1,
    distance: 8,
    start() { lbDragged = 1; },
    stop() { D.prf.lbarOrder(I.lb_inner.textContent); lbDragged = 0; },
  });
  D.prf.lbarOrder(this.lbarRecreate);

  const eachWin = (f) => { Object.keys(ide.wins).forEach((k) => { f(ide.wins[k]); }); };
  const gl = new GoldenLayout({
    settings: { showPopoutIcon: 0 },
    dimensions: { borderWidth: 7, headerHeight: 25 },
    labels: { minimise: 'unmaximise' },
    content: [ide.floating ? { type: 'stack' } : {
      title: 'Session',
      type: 'component',
      componentName: 'win',
      componentState: { id: 0 },
    }],
  }, $(ide.dom));
  ide.gl = gl;
  function Win(c, h) {
    const w = ide.wins[h.id];
    w.container = c;
    c.getElement().append(w.dom);
    c.on('tab', (tab) => {
      tab.element.click(() => {
        w.me && w.me.focus();
        w.focus();
      });
    });
    c.on('open', () => {
      $(c.getElement()).closest('.lm_item').find('.lm_maximise').onFirst('click', () => {
        w.saveScrollPos();
      });
    });
    if (ide.ipc) {
      w.me_ready.then(() => ide.ipc.emit('mounted', h.id));
    } else {
      ide.hadErr > 0 && (ide.hadErr -= 1);
      setTimeout(() => ide.focusWin(w), 10);
    }
    return w;
  }
  function WSE(c) {
    const u = new D.WSE();
    ide.wse = u;
    u.container = c;
    c.on('tab', (tab) => {
      tab.element.click(() => {
        u.focus();
      });
    });
    c.getElement().append(u.dom);
    ide.DBGwidth = ide.dbgw;
    return u;
  }
  function DBG(c) {
    const u = new D.DBG();
    ide.dbg = u;
    u.container = c;
    c.getElement().append(u.dom);
    ide.WSEwidth = ide.wsew;
    return u;
  }
  gl.registerComponent('win', Win);
  gl.registerComponent('wse', WSE);
  gl.registerComponent('dbg', DBG);
  let sctid; // stateChanged timeout id
  gl.on('stateChanged', () => {
    clearTimeout(sctid);
    sctid = setTimeout(() => {
      eachWin((w) => { w.stateChanged(); });
    }, 50);
    ide.wsew = ide.WSEwidth;
    ide.dbgw = ide.DBGwidth;
  });
  gl.on('itemDestroyed', () => { ide.wins[0] && ide.wins[0].saveScrollPos(); });
  gl.on('tabCreated', (x) => {
    x.element.off('mousedown', x._onTabClickFn); // remove default binding
    x.element.on('mousedown', (e) => {
      if (e.button === 0 || e.type === 'touchstart') {
        x.header.parent.setActiveContentItem(x.contentItem);
        x.element.click();
      } else if (e.button === 1 && x.contentItem.config.isClosable) {
        if (x.middleClick) x.middleClick();
        else x._onTabClick(e);
      }
    });
    const cls = x.closeElement;
    switch (x.contentItem.componentName) {
      case 'dbg':
        x.middleClick = D.prf.dbg.toggle;
        cls.off('click').click(D.prf.dbg.toggle);
        break;
      case 'wse':
        x.middleClick = D.prf.wse.toggle;
        cls.off('click').click(D.prf.wse.toggle);
        break;
      case 'win': {
        const { id } = x.contentItem.config.componentState;
        if (id) {
          const ep = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ide.wins[id].onClose();
          };
          x.middleClick = ep;
          cls.off('click').click(ep);
        } else {
          x.contentItem.parent.header.position(false);
        }
      }
        break;
      default:
    }
  });
  gl.init();

  let statsTid = 0;
  ide.getStats = $.debounce(100, () => {
    if (ide.floating) ide.ipc.emit('getStats');
    else if (statsTid) {
      D.send('GetSIStack', {});
      D.send('GetThreads', {});
    }
  });
  const toggleStats = () => {
    if (ide.floating) return;
    if (statsTid && !D.prf.dbg() && !D.prf.sbar()) {
      clearInterval(statsTid); statsTid = 0;
    } else if (!statsTid && (D.prf.dbg() || D.prf.sbar())) {
      ide.getStats();
      statsTid = statsTid || setInterval(ide.getStats, 5000);
    }
  };
  toggleStats();
  const updTopBtm = $.debounce(100, () => {
    ide.dom.style.top = `${(D.prf.lbar() ? I.lb.offsetHeight : 0) + (D.el ? 0 : 23)}px`;
    ide.dom.style.bottom = `${I.sb.offsetHeight}px`;
    gl.updateSize(ide.dom.clientWidth, ide.dom.clientHeight);
  });
  I.lb.hidden = !D.prf.lbar();
  I.sb.hidden = !D.prf.sbar();
  updTopBtm();
  $(window).resize(updTopBtm);
  D.prf.lbar((x) => {
    I.lb.hidden = !x;
    updTopBtm();
    updMenu();
  });
  D.prf.sbar((x) => {
    toggleStats();
    I.sb.hidden = !x; updTopBtm();
    updMenu();
  });
  const updMenu = () => {
    try {
      D.installMenu(D.parseMenuDSL(D.prf.menu()));
    } catch (e) {
      $.err('Invalid menu configuration -- the default menu will be used instead');
      console.error(e);
      D.installMenu(D.parseMenuDSL(D.prf.menu.getDefault()));
    }
  };
  D.prf.menu(updMenu);
  D.prf.keys(updMenu);
  !ide.floating && setTimeout(updMenu, 100);
  D.prf.autoCloseBrackets((x) => { eachWin((w) => { !w.bwId && w.autoCloseBrackets(!!x); }); });
  D.prf.ilf((x) => {
    const i = x ? -1 : D.prf.indent();
    eachWin((w) => { !w.bwId && w.id && w.indent(i); });
  });
  D.prf.indent((x) => {
    const i = D.prf.ilf() ? -1 : x;
    eachWin((w) => { !w.bwId && w.id && w.indent(i); });
  });
  D.prf.fold((x) => {
    eachWin((w) => { w.id && !w.bwId && w.fold(!!x); });
    updMenu();
  });
  D.prf.matchBrackets((x) => { eachWin((w) => { !w.bwId && w.matchBrackets(!!x); }); });
  const togglePanel = (on, compName, compTitle, left) => {
    if (!on) {
      gl.root.getComponentsByName(compName).forEach((x) => { x.container.close(); });
      return;
    }
    // var si=D.ide.wins[0].cm.getScrollInfo() //remember session scroll position
    let p = gl.root.contentItems[0];
    if (p.type !== 'row') {
      const row = gl.createContentItem({ type: 'row' }, p);
      p.parent.replaceChild(p, row);
      row.addChild(p, 0, true); row.callDownwards('setSize');
      p = row;
    }
    p.addChild({
      type: 'component',
      componentName: compName,
      title: compTitle,
      fixedSize: true,
    }, left ? 0 : p.contentItems.length);
    // // D.ide.wins[0].me.scrollTo(si.left,si.top)
    const w = left ? 200 : 300;
    D.ide[`${compName.toUpperCase()}width`] = w;
    D.ide[`${compName}w`] = w;
    D.ide.focusMRUWin();
  };
  const toggleWSE = (x) => {
    togglePanel(x, 'wse', 'Workspace Explorer', 1);
    ide.wse.autoRefresh(x && 5000);
    updMenu();
  };
  const toggleDBG = (x) => {
    toggleStats();
    togglePanel(x, 'dbg', 'Debug', 0);
    updMenu();
  };
  if (!ide.floating) {
    D.prf.wse(toggleWSE);
    D.prf.dbg(toggleDBG);
    D.prf.wse() && setTimeout(() => toggleWSE(D.prf.wse()), 500);
    D.prf.dbg() && setTimeout(() => toggleDBG(D.prf.dbg()), 500);
  }
  // OSX is stealing our focus.  Let's steal it back!  Bug #5
  D.mac && !ide.floating && setTimeout(() => { ide.wins[0].focus(); }, 500);
  D.prf.lineNums((x) => {
    eachWin(w => w.setLN && w.setLN(x)); 
    updMenu();
  });
  D.prf.breakPts((x) => {
    eachWin(w => w.setBP && w.setBP(x));
    updMenu();
  });
  D.prf.wrap((x) => { updMenu(); });
  D.prf.blockCursor((x) => { eachWin(w => !w.bwId && w.blockCursor(!!x)); });
  D.prf.cursorBlinking((x) => { eachWin(w => !w.bwId && w.cursorBlinking(x)); });
  D.prf.renderLineHighlight((x) => { eachWin(w => !w.bwId && w.renderLineHighlight(x)); });
  D.prf.autocompletion((x) => { eachWin(w => !w.bwId && w.autocompletion(x === 'classic')); });
  D.prf.autocompletionDelay((x) => { eachWin(w => !w.bwId && w.autocompletionDelay(x)); });
  D.prf.minimapEnabled((x) => { eachWin(w => !w.bwId && w.minimapEnabled(!!x)); });
  D.prf.minimapRenderCharacters((x) => { eachWin(w => !w.bwId && w.minimapRenderCharacters(!!x)); });
  D.prf.minimapShowSlider((x) => { eachWin(w => !w.bwId && w.minimapShowSlider(x)); });
  D.prf.selectionHighlight((x) => { eachWin(w => !w.bwId && w.selectionHighlight(x)); });
  D.prf.showEditorToolbar((x) => { $('.ride_win.edit_trace').toggleClass('no-toolbar', !x); });
  D.prf.snippetSuggestions((x) => { eachWin(w => !w.bwId && w.snippetSuggestions(x)); });
  D.prf.zoom(ide.zoom.bind(ide));

  ide.handlers = { // for RIDE protocol messages
    Identify(x) {
      D.remoteIdentification = x;
      ide.updTitle();
      ide.connected = 1;
      ide.updPW(1);
      clearTimeout(D.tmr);
      delete D.tmr;
    },
    Disconnect(x) {
      const m = x.message.toLowerCase(); ide.die();
      if (m === 'dyalog session has ended') {
        ide.connected = 0; window.close();
      } else { $.err(x.message, 'Interpreter disconnected'); }
    },
    SysError(x) { $.err(x.text, 'SysError'); ide.die(); },
    InternalError(x) { $.err(`An error (${x.error}) occurred processing ${x.message}`, 'Internal Error'); },
    NotificationMessage(x) { $.alert(x.message, 'Notification'); },
    UpdateDisplayName(x) {
      ide.wsid = x.displayName;
      ide.updTitle();
      ide.wse && ide.wse.refresh();
    },
    EchoInput(x) { ide.wins[0].add(x.input); },
    SetPromptType(x) {
      const t = x.type;
      ide.promptType = t;
      if (t && ide.pending.length) D.send('Execute', { trace: 0, text: `${ide.pending.shift()}\n` });
      else eachWin((w) => { w.prompt(t); });
      t === 4 && ide.wins[0].focus(); // ⍞ input
      t === 1 && ide.getStats();
      if (t === 1 && ide.bannerDone === 0) {
        // arrange for the banner to appear at the top of the session window
        ide.bannerDone = 1;
        const { me } = ide.wins[0];
        me.focus();
        if (!D.spawned) return;
        const txt = me.getValue().split('\n');
        let i = txt.length;
        while (--i) { if (/^Dyalog APL/.test(txt[i])) break; }
        setTimeout(() => {
          me.revealRangeAtTop(new monaco.Range(i + 1, 1, i + 1, 1));
          me.setPosition({ ...me.getPosition(), column: 7 });
        }, 1);
      }
    },
    HadError() {
      // On error interpreter may open a new tracer window within a goldenlayout container
      // and if configured, code formatted by interpretter.
      // Each of these will set the focus on the new window,
      // but on error we want focus on SE.
      ide.pending.splice(0, ide.pending.length);
      const se = ide.wins['0'];
      se.focus();
      // set timer in case no new window is opened
      se.hadErrTmr = setTimeout(() => { ide.hadErr = -1; delete se.hadErrTmr; }, 100);
      // gl mounted + SetHighlightLine + ReplyFormatCode
      ide.hadErr = 2 + (D.prf.ilf() && D.prf.indentOnOpen());
    },
    GotoWindow(x) { const w = ide.wins[x.win]; w && w.focus(); },
    WindowTypeChanged(x) { return ide.wins[x.win].setTC(x.tracer); },
    ReplyGetAutocomplete(x) { const w = ide.wins[x.token]; w && w.processAutocompleteReply(x); },
    ValueTip(x) { ide.wins[x.token].ValueTip(x); },
    SetHighlightLine(x) {
      const w = D.wins[x.win];
      w.SetHighlightLine(x.line, ide.hadErr);
      ide.hadErr > 0 && (ide.hadErr -= 1);
      ide.focusWin(w);
    },
    UpdateWindow(x) {
      const w = ide.wins[x.token];
      w && w.update(x);
    },
    ReplySaveChanges(x) { const w = ide.wins[x.win]; w && w.saved(x.err); },
    CloseWindow(x) {
      const w = ide.wins[x.win];
      if (!w) return;
      if (w.bwId) {
        w.close();
        w.id = -1;
      } else if (w) {
        w.me.getModel().dispose();
        w.container && w.container.close();
      }
      delete ide.wins[x.win]; ide.focusMRUWin();
      ide.WSEwidth = ide.wsew; ide.DBGwidth = ide.dbgw;
      w.tc && ide.getStats();
    },
    OpenWindow(ee) {
      if (!ee.debugger && D.el && process.env.RIDE_EDITOR) {
        const fs = nodeRequire('fs');
        const os = nodeRequire('os');
        const cp = nodeRequire('child_process');
        const d = `${os.tmpdir()}/dyalog`;
        fs.existsSync(d) || fs.mkdirSync(d, 7 * 8 * 8); // rwx------
        const f = `${d}/${ee.name}.dyalog`;
        fs.writeFileSync(f, ee.text.join('\n'), { encoding: 'utf8', mode: 6 * 8 * 8 }); // rw-------
        const p = cp.spawn(
          process.env.RIDE_EDITOR,
          [f],
          { env: $.extend({}, process.env, { LINE: `${1 + (ee.currentRow || 0)}` }) },
        );
        p.on('error', (x) => { $.err(x); });
        p.on('exit', () => {
          const s = fs.readFileSync(f, 'utf8'); fs.unlinkSync(f);
          D.send('SaveChanges', {
            win: ee.token,
            text: s.split('\n'),
            stop: ee.stop,
            trace: ee.trace,
            monitor: ee.monitor,
          });
          D.send('CloseWindow', { win: ee.token });
        });
        return;
      }
      ide.wins[0].hadErrTmr && clearTimeout(ide.wins[0].hadErrTmr);
      const w = ee.token;
      let done;
      const editorOpts = { id: w, name: ee.name, tc: ee.debugger };
      !editorOpts.tc && (ide.hadErr = -1);
      ide.block(); // unblock the message queue once monaco ready
      if (D.el && D.prf.floating() && !ide.dead) {
        D.IPC_LinkEditor({ editorOpts, ee });
        done = 1;
      } else if (D.elw && !D.elw.isFocused()) D.elw.focus();
      if (done) return;
      const ed = new D.Ed(ide, editorOpts);
      ide.wins[w] = ed;
      ed.me_ready.then(() => {
        ed.open(ee);
        ide.unblock();
      });
      // add to golden layout:
      const tc = !!ee.debugger;
      const bro = gl.root.getComponentsByName('win').filter(x => x.id && tc === !!x.tc)[0]; // existing editor
      let p;
      if (bro) { // add next to existing editor
        p = bro.container.parent.parent;
      } else { // add to the right
        [p] = gl.root.contentItems;
        const t0 = tc ? 'column' : 'row';
        if (p.type !== t0) {
          const q = gl.createContentItem({ type: t0 }, p);
          p.parent.replaceChild(p, q);
          q.addChild(p); q.callDownwards('setSize'); p = q;
        }
      }
      const ind = p.contentItems.length - !(editorOpts.tc || !!bro || !D.prf.dbg());
      p.addChild({
        type: 'component',
        componentName: 'win',
        componentState: { id: w },
        title: ee.name,
      }, ind);
      ide.WSEwidth = ide.wsew; ide.DBGwidth = ide.dbgw;
      if (tc) {
        ide.getStats();
        ide.wins[0].scrollCursorIntoView();
      }
    },
    ShowHTML(x) {
      if (D.el) {
        let w = ide.w3500;
        if (!w || w.isDestroyed()) {
          ide.w3500 = new D.el.BrowserWindow({
            width: 800,
            height: 500,
            webPreferences: {
              nodeIntegration: false,
            },
          });
          w = ide.w3500;
        }
        w.loadURL(`file://${__dirname}/empty.html`);
        w.webContents.executeJavaScript(`document.body.innerHTML=${JSON.stringify(x.html)}`);
        w.setTitle(x.title || '3500 I-beam');
      } else {
        const init = () => {
          ide.w3500.document.body.innerHTML = x.html;
          ide.w3500.document.getElementsByTagName('title')[0].innerHTML = D.util.esc(x.title || '3500⌶');
        };
        if (ide.w3500 && !ide.w3500.closed) {
          ide.w3500.focus(); init();
        } else {
          ide.w3500 = window.open('empty.html', '3500 I-beam', 'width=800,height=500');
          ide.w3500.onload = init;
        }
      }
    },
    OptionsDialog(x) {
      D.util.optionsDialog(x, (r) => {
        D.send('ReplyOptionsDialog', { index: r, token: x.token });
      });
    },
    StringDialog(x) {
      D.util.stringDialog(x, (r) => {
        D.send('ReplyStringDialog', { value: r, token: x.token });
      });
    },
    TaskDialog(x) {
      D.util.taskDialog(x, (r) => {
        D.send('ReplyTaskDialog', { index: r, token: x.token });
      });
    },
    ReplyClearTraceStopMonitor(x) {
      $.alert(`The following items were cleared:
      ${x.traces} traces
      ${x.stops} stops
      ${x.monitors} monitors`, 'Clear all trace/stop/monitor');
    },
    ReplyGetSIStack(x) {
      const l = x.stack.length;
      I.sb_sis.innerText = `⎕SI: ${l}`;
      I.sb_sis.classList.toggle('active', l > 0);
      ide.dbg && ide.dbg.sistack.render(x.stack);
    },
    ReplyGetThreads(x) {
      const l = x.threads.length;
      I.sb_threads.innerText = `&: ${l}`;
      I.sb_threads.classList.toggle('active', l > 1);
      ide.dbg && ide.dbg.threads.render(x.threads);
    },
    ReplyFormatCode(x) {
      const w = D.wins[x.win];
      w.ReplyFormatCode(x.text);
      ide.hadErr > 0 && (ide.hadErr -= 1);
      ide.focusWin(w);
    },
    ReplyTreeList(x) { ide.wse.replyTreeList(x); },
    StatusOutput(x) {
      let w = ide.wStatus;
      if (!D.el) return;
      if (!w) {
        ide.wStatus = new D.el.BrowserWindow({
          width: 600,
          height: 400,
          parent: D.elw,
          webPreferences: {
            nodeIntegration: false,
          },
        });
        w = ide.wStatus;
        w.setTitle(`Status Output - ${document.title}`);
        w.loadURL(`file://${__dirname}/status.html`);
        w.on('closed', () => { delete ide.wStatus; });
      }
      w.webContents.executeJavaScript(`add(${JSON.stringify(x)})`);
    },
    ReplyGetLog(x) { ide.wins[0].add(x.result.join('\n')); ide.bannerDone = 0; },
    UnknownCommand(x) {
      if (x.name === 'ClearTraceStopMonitor') toastr.warning('Clear all trace/stop/monitor not supported by the interpreter');
    },
  };
};
D.IDE.prototype = {
  setConnInfo(x, y, z) {
    const ide = this;
    ide.host = x;
    ide.port = y;
    ide.profile = z;
    ide.updTitle();
  },
  setCursorPosition(p) {
    I.sb_cp.innerText = `Ln ${p.lineNumber - 1}, Col ${p.column - 1}`;
  },
  die() { // don't really, just pretend
    const ide = this;
    if (ide.dead) return;
    ide.dead = 1;
    ide.connected = 0;
    ide.dom.className += ' disconnected';
    Object.keys(ide.wins).forEach((k) => { ide.wins[k].die(); });
  },
  updPW(x) { this.wins[0] && this.wins[0].updPW(x); },
  updTitle() { // change listener for D.prf.title
    const ide = this;
    const ri = D.remoteIdentification || {};
    const [ch, bits] = (ri.arch || '').split('/');
    const [va, vb, vc] = (ri.version || '').split('.');
    const v = D.versionInfo || {};
    const [rva, rvb, rvc] = (v.version || '').split('.');
    const m = {
      '{WSID}': ide.wsid,
      '{HOST}': ide.host,
      '{PORT}': ide.port,
      '{VER_A}': va,
      '{VER_B}': vb,
      '{VER_C}': vc,
      '{VER}': ri.version,
      '{PROFILE}': ide.profile,
      '{PID}': ri.pid,
      '{CHARS}': ch,
      '{BITS}': bits,
      '{RIDE_PID}': D.el ? D.el.process.pid : '?',
      '{RIDE_VER_A}': rva,
      '{RIDE_VER_B}': rvb,
      '{RIDE_VER_C}': rvc,
      '{RIDE_VER}': v.version,
    };
    ide.caption = D.prf.title().replace(/\{\w+\}/g, x => m[x.toUpperCase()] || x) || 'Dyalog';
    D.ipc && D.ipc.server.broadcast('caption', ide.caption);
    document.title = ide.caption;
  },
  focusWin(w) {
    if (this.hadErr === 0) {
      D.elw && D.elw.focus();
      this.wins[0].focus();
      delete this.wins[0].hadErrTmr;
      this.hadErr = -1;
    } else if (this.hadErr < 0) { w.focus(); }
  },
  focusMRUWin() { // most recently used
    const { wins } = this;
    let t = 0;
    let w = wins[t];
    Object.keys(wins).forEach((k) => {
      const x = wins[k];
      if (x.id && t <= x.focusTS) { w = x; t = x.focusTS; }
    });
    D.elw && !w.bwId && D.elw.focus();
    w.focus();
  },
  zoom(z) {
    const b = this.dom.ownerDocument.body;
    b.className = `zoom${z} ${b.className.split(/\s+/).filter(s => !/^zoom-?\d+$/.test(s)).join(' ')}`;
    this.gl.container.resize();
    if (this.floating) {
      D.ipc.of.ride_master.emit('zoom', z);
      return;
    }
    const { wins } = this;
    const se = wins['0'];
    Object.keys(wins).forEach((x) => { wins[x].zoom(z); });
    se && se.restoreScrollPos();
  },
  LBR: D.prf.lbar.toggle,
  SBR: D.prf.sbar.toggle,
  FLT: D.prf.floating.toggle,
  WRP: D.prf.wrap.toggle,
  TVB: D.prf.breakPts.toggle,
  LN: D.prf.lineNums.toggle,
  TVO: D.prf.fold.toggle,
  UND() { this.focusedWin.me.trigger('D', 'undo'); },
  RDO() { this.focusedWin.me.trigger('D', 'redo'); },
  Edit(data) {
    if (this.floating) { this.ipc.emit('Edit', data); return; }
    D.pendingEdit = D.pendingEdit || data;
    D.pendingEdit.unsaved = D.pendingEdit.unsaved || {};
    const u = D.pendingEdit.unsaved;
    let v;
    let w;
    let bws = 0;
    Object.keys(this.wins).forEach((k) => {
      w = this.wins[k];
      v = +k && (w.getUnsaved ? w.getUnsaved() : -1);
      if (v) u[k] = v;
      bws = bws || v === -1;
    });
    if (bws && D.ipc.server) {
      D.ipc.server.broadcast('getUnsaved');
    } else {
      D.send('Edit', D.pendingEdit);
      delete D.pendingEdit;
    }
  },
  getUnsaved() {
    const r = {};
    Object.keys(this.wins).forEach((k) => {
      r[k] = this.wins[k].getUnsaved();
    });
    return r;
  },
  _disconnected() { this.die(); }, // invoked from cn.js
  lbarRecreate() {
    const d = D.lb.order; // d:default order
    const u = D.prf.lbarOrder(); // u:user's order
    let r = '';
    if (d !== u) {
      for (let i = 0; i < d.length; i++) {
        if (!u.includes(d[i]) && /\S/.test(d[i])) r += d[i]; // r:set difference between d and u
      }
    }
    I.lb_inner.innerHTML = D.prf.lbarOrder()
      .replace(/\s*$/, `\xa0${r}${r && '\xa0'}`) // replace any trailing spaces with missing glyphs and final nbs
      .replace(/\s+/g, '\xa0').replace(/(.)/g, '<b>$1</b>'); // replace white spaces with single nbs and markup
  },
  onbeforeunload(e) { // called when the user presses [X] on the OS window
    const ide = this;
    if (ide.floating && ide.connected) { e.returnValue = false; }
    if (!ide.dead) {
      Object.keys(ide.wins).forEach((k) => {
        const ed = ide.wins[k];
        const { me } = ed;
        if (ed.tc || (me.getValue() === ed.oText && `${ed.getStops()}` === `${ed.oStop}`)) {
          ed.EP(me);
        } else {
          setTimeout(() => {
            window.focus();
            const r = D.el.dialog.showMessageBox(D.el.getCurrentWindow(), {
              title: 'Save?',
              buttons: ['Yes', 'No', 'Cancel'],
              cancelId: -1,
              message: `The object "${ed.name}" has changed.\nDo you want to save the changes?`,
            });
            if (r === 0) ed.EP(me);
            else if (r === 1) ed.QT(me);
            return '';
          }, 10);
        }
      });
    }
  },
};
