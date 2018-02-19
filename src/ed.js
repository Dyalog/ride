{
  // represents an editor (.tc==0) or a tracer (.tc==1)
  // holds a ref to a Monaco editor instance (.me),
  // handles most commands in editors (e.g. .LN(), .QT(), .TL(), ...)
  function Ed(ide, opts) { // constructor
    const ed = this;
    ed.ide = ide;
    ed.id = opts.id;
    ed.name = opts.name;
    ed.tc = opts.tc;
    ed.HIGHLIGHT_LINE = 0;
    ed.decorations = [];
    ed.hlDecorations = [];
    ed.stopDecorations = [];
    ed.dom = I.ed_tmpl.cloneNode(1);
    ed.dom.id = null;
    ed.dom.style.display = '';
    ed.$e = $(ed.dom);
    ed.jumps = [];
    ed.focusTS = 0;
    ed.dom.oncontextmenu = D.oncmenu;
    ed.oText = '';
    ed.oStop = []; // remember original text and "stops" to avoid pointless saving on EP
    ed.stop = new Set(); // remember original text and "stops" to avoid pointless saving on EP
    ed.isCode = 1;
    ed.isReadOnly = !1;
    ed.breakpoints = D.prf.breakPts();
    const me = monaco.editor.create(ed.dom.querySelector('.ride_win_cm'), {
      automaticLayout: true,
      autoIndent: true,
      cursorStyle: D.prf.blockCursor() ? 'block' : 'line',
      cursorBlinking: D.prf.blinkCursor() ? 'blink' : 'solid',
      folding: ed.isCode && !!D.prf.fold(),
      fontFamily: 'apl',
      glyphMargin: ed.breakpoints,
      language: 'apl',
      lineNumbers: D.prf.lineNums() ? (x => `[${x - 1}]`) : 'off',
      matchBrackets: true,
      mouseWheelZoom: true,
      renderIndentGuides: true,
      showFoldingControls: 'always',
      wordBasedSuggestions: false,
    });
    ed.monaco = me;

    ed.monaco_ready = new Promise((resolve) => {
      // ugly hack as monaco doesn't have a built in event for when the editor is ready?!
      // https://github.com/Microsoft/monaco-editor/issues/115
      const didScrollChangeDisposable = me.onDidScrollChange(() => {
        didScrollChangeDisposable.dispose();
        resolve(true);
      });
    });
    me.dyalogCmds = ed;
    ed.tracer = me.createContextKey('tracer', !!ed.tc);
    ed.mapKeys(); D.prf.keys(ed.mapKeys.bind(ed));
    // ed.cm = CM(ed.dom.querySelector('.ride_win_hide'), {
    //   smartIndent: !D.prf.ilf() && D.prf.indent() >= 0,
    //   indentUnit: D.prf.indent(),
    //   scrollButtonHeight: 12,
    //   matchBrackets: !!D.prf.matchBrackets(),
    //   autoCloseBrackets: !!D.prf.autoCloseBrackets() && ACB_VALUE,
    //   scrollbarStyle: 'simple',
    //   keyMap: 'dyalog',
    //   extraKeys: { 'Shift-Tab': 'indentLess', Tab: 'indentOrComplete', Down: 'downOrXline' },
    // });
    // ed.cm.on('cursorActivity', ed.cursorActivity.bind(ed));
    me.onDidChangeCursorPosition(ed.cursorActivity.bind(ed));
    let mouseL = 0; let mouseC = 0; let mouseTS = 0;
    me.onMouseDown((e) => {
      const t = e.target;
      const mt = monaco.editor.MouseTargetType;
      const p = t.position;
      if (t.type === mt.GUTTER_GLYPH_MARGIN) {
        const l = p.lineNumber - 1;
        ed.stop.has(l) ? ed.stop.delete(l) : ed.stop.add(l);
        ed.setStop();
        ed.tc && D.send('SetLineAttributes', { win: ed.id, stop: ed.getStops() });
      } else if (t.type === mt.CONTENT_TEXT) {
        if (e.event.timestamp - mouseTS < 400 && mouseL === p.lineNumber && mouseC === p.column) {
          ed.ED(me); e.event.preventDefault(); e.event.stopPropagation();
        }
        mouseL = p.lineNumber; mouseC = p.column; mouseTS = e.event.timestamp;
      }
    });
    // ed.cm.on('scroll', (c) => { const i = c.getScrollInfo(); ed.btm = i.clientHeight + i.top; });
    me.onDidFocusEditor(() => { ed.focusTS = +new Date(); ed.ide.focusedWin = ed; });
    ed.processAutocompleteReply = (x) => {
      if (me.model.ac && me.model.ac.complete) {
        me.model.ac.complete(x.options.map(i => ({ label: i })));
      }
    };
    ed.tb = ed.dom.querySelector('.toolbar');
    ed.tb.onmousedown = (x) => {
      if (x.target.matches('.tb_btn')) {
        x.target.classList.add('armed');
        x.preventDefault();
      }
    };
    ed.tb.onmouseout = (x) => {
      if (x.target.matches('.tb_btn')) {
        x.target.classList.remove('armed');
        x.preventDefault();
      }
    };
    ed.tb.onmouseup = ed.tb.onmouseout;
    ed.tb.onclick = (x) => {
      const t = x.target;
      if (t.matches('.tb_btn')) {
        const c = t.className.replace(/^.*\btb_([A-Z]{2,3})\b.*$/, '$1');
        if (ed[c]) ed[c](ed.me);
        else if (CM.commands[c]) CM.commands[c](ed.me);
        return !1;
      }
      return !0;
    };
    ed.setTC(!!ed.tc);
    // this.vt = D.vt(this);
    this.setLN(D.prf.lineNums());
    ed.firstOpen = true;
  }
  Ed.prototype = {
    mapKeys() {
      const me = this.monaco;
      const kc = monaco.KeyCode;
      const km = monaco.KeyMod;
      const ctrlcmd = {
        Ctrl: D.mac ? km.WinCtrl : km.CtrlCmd,
        Cmd: km.CtrlCmd,
        Esc: kc.Escape,
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
          const nkc = ks.split('-').reduce(((a, ko) => {
            const k = ko.replace(/^[A-Z0-9]$/, 'KEY_$&')
              .replace(/^Numpad(.*)/, (m, p) => `NUMPAD_${p.toUpperCase()}`)
              .replace(/^(Up|Left|Right|Down)$/, '$1Arrow')
              .replace(/--/g, '-US_MINUS')
              .replace(/^'(.)'$/, '$1');
            return a | (ctrlcmd[k] || km[k] || kc[k]); // eslint-disable-line no-bitwise
          }), 0);
          if (nkc) {
            const cmd = map[ks];
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
            } else if (cmd === 'ER' || cmd === 'TC') cond = 'tracer';
            else if (nkc === kc.Escape) cond = '!suggestWidgetVisible && !editorHasMultipleSelections && !findWidgetVisible && !inSnippetMode';
            me.addCommand(nkc, () => CM.commands[cmd](me), cond);
          }
        });
      }
      addCmd(CM.keyMap.dyalogDefault);
      addCmd(CM.keyMap.dyalog);
      me.addCommand(kc.DownArrow, () => this.downOrXline(me));
    },
    createBPEl() { // create breakpoint element
      const e = this.dom.ownerDocument.createElement('div');
      e.className = 'breakpoint'; e.innerHTML = '●'; return e;
    },
    getStops() { // returns an array of line numbers
      return [...this.stop].sort((x, y) => x - y);
    },
    cursorActivity(e) { // handle "cursor activity" event from CodeMirror
      // xline:the line number of the empty line inserted when you press <down> at eof
      const ed = this;
      const me = ed.monaco;
      if (ed.xline == null) return;
      const n = me.model.getLineCount();
      const l = e.position.lineNumber;
      const s = me.model.getLineContent(n);
      if (l === ed.xline && l === n && /^\s*$/.test(s)) return;
      if (l < ed.xline && ed.xline === n && /^\s*$/.test(s)) {
        const t = me.model.getLineContent(n - 1);
        me.executeEdits('D', [{
          range: new monaco.Range(n - 1, t.length + 1, n, s.length + 1),
          text: '',
        }]);
      }
      delete ed.xline;
    },
    hl(l) { // highlight - set current line in tracer
      const ed = this;
      const me = ed.monaco;
      if (l == null) {
        ed.hlDecorations = [];
      } else {
        const lm = l + 1;
        ed.hlDecorations = [{
          range: new monaco.Range(lm, 1, lm, 1),
          options: {
            isWholeLine: true,
            className: 'highlighted',
          },
        }];
        me.setPosition({ lineNumber: lm, column: 0 });
        me.revealLineInCenter(l);
      }
      ed.setDecorations();
    },
    setBP(x) { // update the display of breakpoints
      const ed = this;
      ed.breakpoints = !!x;
      ed.monaco.updateOptions({ glyphMargin: ed.isCode && ed.breakpoints });
    },
    setLN(x) { // update the display of line numbers and the state of the "[...]" button
      const ed = this;
      ed.monaco.updateOptions({ lineNumbers: D.prf.lineNums() ? (l => `[${l - 1}]`) : 'off' });
      const a = ed.tb.querySelectorAll('.tb_LN');
      for (let i = 0; i < a.length; i++) a[i].classList.toggle('pressed', !!x);
    },
    setTC(x) {
      const ed = this;
      ed.tc = x;
      ed.tracer.set(x);
      ed.dom.classList.toggle('tracer', !!x);
      ed.hl(null);
      ed.setRO(x);
    },
    setRO(x) {
      const ed = this;
      ed.isReadOnly = x;
      ed.monaco.updateOptions({ readOnly: x });
      if (x) {
        ed.dom.getElementsByClassName('tb_AO')[0].style.display = 'none';
        ed.dom.getElementsByClassName('tb_DO')[0].style.display = 'none';
        ed.dom.getElementsByClassName('tb_RP')[0].style.display = 'none';
      }
    },
    setStop() {
      const ed = this;
      ed.stopDecorations = [...ed.stop].map(x => ({
        range: new monaco.Range(x + 1, 1, x + 1, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: 'breakpoint',
        },
      }));
      ed.setDecorations();
    },
    setDecorations() {
      const ed = this;
      ed.decorations = ed.monaco.deltaDecorations(
        ed.decorations,
        [...ed.stopDecorations, ...ed.hlDecorations],
      );
    },
    updSize() { },
    saveScrollPos() {
      // workaround for CodeMirror scrolling up to
      // the top under GoldenLayout when editor is closed
      // const ed = this;
      // if (ed.btm == null) {
      //   const i = ed.cm.getScrollInfo();
      //   ed.btm = i.clientHeight + i.top;
      // }
    },
    restoreScrollPos() {
      // const ed = this;
      // if (ed.btm != null) {
      //   const i = ed.cm.getScrollInfo();
      //   ed.cm.scrollTo(0, ed.btm - i.clientHeight);
      // } else { ed.cm.scrollTo(0, 0); }
    },
    updateSIStack(x) {
      this.dom.querySelector('.si_stack').innerHTML = x.stack.map(o => `<option>${o}`).join('');
    },
    stateChanged() {
      const w = this;
      w.updSize();
      w.restoreScrollPos();
    },
    open(ee) { // ee:editable entity
      const ed = this;
      const me = ed.monaco;
      me.model.winid = ed.id;
      me.model.onDidChangeContent((x) => {
        if (!me.dyalogBQ && x.changes.length === 1
          && x.changes[0].text === D.prf.prefixKey()) CM.commands.BQC(me);
      });
      me.model.setValue(ed.oText = ee.text.join('\n'));
      me.model.setEOL(monaco.editor.EndOfLineSequence.LF);
      me.focus();
      // entityType:            16 NestedArray        512 AplClass
      // 1 DefinedFunction      32 QuadORObject      1024 AplInterface
      // 2 SimpleCharArray      64 NativeFile        2048 AplSession
      // 4 SimpleNumericArray  128 SimpleCharVector  4096 ExternalFunction
      // 8 MixedSimpleArray    256 AplNamespace
      ed.isCode = [1, 256, 512, 1024, 2048, 4096].indexOf(ee.entityType) >= 0;
      me.language = ed.isCode ? 'apl' : 'text';
      me.updateOptions({ folding: ed.isCode && !!D.prf.fold() });
      if (ed.isCode && D.prf.indentOnOpen()) ed.RD(me);
      ed.setRO(ee.readOnly || ee.debugger);
      ed.setBP(ed.breakpoints);
      const line = ee.currentRow;
      let col = ee.currentColumn || 0;
      if (line === 0 && col === 0 && ee.text.length === 1
        && /\s?[a-z|@]+$/.test(ee.text[0])) col = ee.text[0].length;
      me.setPosition({ lineNumber: line + 1, column: col + 1 });
      me.revealLineInCenter(line + 1);
      ed.oStop = (ee.stop || []).slice(0).sort((x, y) => x - y);
      ed.stop = new Set(ed.oStop);
      ed.setStop();
      D.prf.floating() && $('title', ed.dom.ownerDocument).text(ee.name);
    },
    blockCursor(x) {
      this.monaco.updateOptions({ cursorStyle: x ? 'block' : 'line' });
    },
    blinkCursor(x) {
      this.monaco.updateOptions({ cursorBlinking: x ? 'blink' : 'solid' });
    },
    hasFocus() { return this.monaco.isFocused(); },
    focus() {
      let q = this.container;
      let p = q && q.parent;
      const l = q && q.layoutManager;
      const m = l && l._maximisedItem;
      if (m && m !== (p && p.parent)) m.toggleMaximise();
      while (p) {
        p.setActiveContentItem && p.setActiveContentItem(q);
        q = p; p = p.parent;
      } // reveal in golden layout
      window.focused || window.focus();
      this.monaco.focus();
    },
    insert(ch) {
      this.isReadOnly || this.monaco.trigger('editor', 'type', { text: ch });
    },
    saved(err) {
      if (err) {
        this.isClosing = 0;
        $.err('Cannot save changes');
      } else {
        this.isClosing && D.send('CloseWindow', { win: this.id });
      }
    },
    close() {
      if (D.prf.floating()) {
        window.onbeforeunload = null;
        I.ide.removeChild(I.ide.firstChild);
        D.el.getCurrentWindow().hide();
      }
    },
    prompt(x) {
      this.setRO(this.tc || !x);
      this.tc && this.dom.classList.toggle('pendent', !x);
    },
    die() { this.setRO(1); },
    getDocument() { return this.dom.ownerDocument; },
    refresh() { /* this.cm.refresh(); */ },
    cword() { // apl identifier under cursor
      const me = this.monaco;
      const c = me.getPosition();
      const s = me.model.getLineContent(c.lineNumber);
      const r = `[${D.syn.letter}0-9]*`; // r:regex fragment used for a name
      return (
        ((RegExp(`⎕?${r}$`).exec(s.slice(0, c.column)) || [])[0] || '') + // match left  of cursor
        ((RegExp(`^${r}`).exec(s.slice(c.column)) || [])[0] || '') // match right of cursor
      ).replace(/^\d+/, ''); // trim leading digits
    },
    autoCloseBrackets(x) {
      this.cm.setOption('autoCloseBrackets', x);
    },
    indent(x) { this.cm.setOption('smartIndent', x >= 0); this.cm.setOption('indentUnit', x); },
    fold(x) { this.monaco.updateOptions({ folding: this.isCode && !!x }); },
    matchBrackets(x) { this.cm.setOption('matchBrackets', !!x); },
    zoom(z) {
      const w = this;
      const b = w.getDocument().body;
      const top = w.cm.heightAtLine(w.cm.lastLine(), 'local') < w.btm;
      const i = w.cm.getScrollInfo();
      const line = w.cm.lineAtHeight(top ? i.top : w.btm, 'local');
      const diff = w.btm - (line * w.cm.defaultTextHeight());
      const ch = i.clientHeight;
      b.className = `zoom${z} ${b.className.split(/\s+/).filter(s => !/^zoom-?\d+$/.test(s)).join(' ')}`;
      w.refresh();
      w.btm = (w.cm.defaultTextHeight() * line)
        + (top ? ch + 5 : diff)
        + (w.cm.getScrollInfo().clientHeight - ch);
    },

    ReplyFormatCode(lines) {
      const ed = this;
      const me = ed.monaco;
      const u = me.getPosition();
      ed.saveScrollPos();
      me.setValue(lines.join('\n'));
      ed.setStop();
      if (ed.tc) {
        ed.hl(ed.HIGHLIGHT_LINE);
        u.lineNumber = ed.HIGHLIGHT_LINE;
      }
      if (ed.firstOpen === true) {
        if (lines.length === 1 && /\s?[a-z|@]+$/.test(lines[0])) u.column = me.model.getLineContent(u.lineNumber).length + 1;
        else if (lines[0][0] === ':') u.column = 1;
        else u.column = 2;
        ed.firstOpen = false;
      }
      ed.restoreScrollPos();
      me.setPosition(u);
      if (D.ide.hadErr) {
        D.ide.wins[0].focus(); D.ide.hadErr = 0;
      } else { ed.focus(); }
    },
    SetHighlightLine(line) {
      const w = this;
      if (w && w.hl) {
        w.hl(line);
        w.focus();
        w.HIGHLIGHT_LINE = line;
      }
    },
    ValueTip(x) {
      // this.vt.processReply(x);
      const me = this.monaco;
      if (me.model.vt && me.model.vt.complete) {
        const { vt } = me.model;
        const l = vt.position.lineNumber;
        const s = me.model.getLineContent(l);
        vt.complete({
          range: new monaco.Range(l, x.startCol + 1, l, x.endCol + 1),
          contents: [
            s.slice(x.startCol, x.endCol),
            { language: x.class === 2 ? 'text' : 'apl', value: x.tip.join('\n') },
          ],
        });
      }
    },
    ED(me) {
      this.addJump();
      // D.ide.Edit({win:this.id,pos:cm.indexFromPos(cm.getCursor()),text:cm.getValue()})
      D.ide.Edit({
        win: this.id,
        pos: me.model.getOffsetAt(me.getPosition()),
        text: me.getValue(),
      });
    },
    QT() { D.send('CloseWindow', { win: this.id }); },
    BK(me) { this.tc ? D.send('TraceBackward', { win: this.id }) : me.trigger('D', 'undo'); },
    FD(me) { this.tc ? D.send('TraceForward', { win: this.id }) : me.trigger('D', 'redo'); },
    STL(cm) {
      if (!this.tc) return;
      let steps = cm.getCursor().line - this.HIGHLIGHT_LINE;
      const cmd = steps > 0 ? 'TraceForward' : 'TraceBackward';
      steps = Math.abs(steps);
      for (let i = 0; i < steps; i++) { D.send(cmd, { win: this.id }); }
    },
    EP(me) { this.isClosing = 1; this.FX(me); },
    FX(me) {
      const ed = this;
      const v = me.getModel().getValue(monaco.editor.EndOfLinePreference.LF);
      const stop = ed.getStops();
      if (ed.tc || (v === ed.oText && `${stop}` === `${ed.oStop}`)) { // if tracer or unchanged
        D.send('CloseWindow', { win: ed.id }); return;
      }
      if (!ed.monaco) {
        for (let i = 0; i < stop.length; i++) me.setGutterMarker(stop[i], 'breakpoints', null);
      }
      // D.send('SaveChanges', { win: ed.id, text: v.split('\n'), stop: [] });
      D.send('SaveChanges', { win: ed.id, text: v.split('\n'), stop });
    },
    TL(me) { // toggle localisation
      const name = this.cword();
      if (!name) return;
      const l0 = me.getPosition().lineNumber;
      const ta = me.model._lines[l0 - 1]._state.a.map(x => x.t);
      const ti = ta.lastIndexOf('∇');
      // const ts = (((me.model._lines[l0 - 1] || {})._state || {}).a || [])
      // .map(x => x.t)
      const ts = ta.filter(t => /^(∇|\{|namespace|class|interface)$/.test(t));
      if (ts.includes('{') || (ts.length && !ts.includes('∇'))) return;
      let f; // f:found?
      let l;
      for (l = l0 - 1; l >= 0; l--) {
        // const b = me.model.getLineTokens(l);
        // for (let i = b.length - 1; i >= 0; i--) if (b[i].type === 'apl-trad') { f = 1; break; }
        // if (f) break;
        if (me.model._lines[l]._state.a.length === ti) break;
      }
      if (l < 0) l = 0;
      const lt = me.model.getLineContent(l + 1)
      const u = lt.split('⍝');
      let s = u[0]; // s:the part before the first "⍝"
      const com = u.slice(1).join('⍝'); // com:the rest
      const a = s.split(';');
      const head = a[0].replace(/\s+$/, '');
      let tail = a.length > 1 ? a.slice(1) : [];
      tail = tail.map(x => x.replace(/\s+/g, ''));
      const i = tail.indexOf(name); i < 0 ? tail.push(name) : tail.splice(i, 1);
      s = [head].concat(tail.sort()).join(';') + (com ? ` ${com}` : '');
      me.executeEdits('D', [{ range: new monaco.Range(l + 1, 1, l + 1, lt.length + 1), text: s }]);
      me.trigger('editor', 'editor.action.formatDocument');
    },
    LN() { D.prf.lineNums.toggle(); },
    TVO() { D.prf.fold.toggle(); },
    TVB() { D.prf.breakPts.toggle(); },
    TC() { D.send('StepInto', { win: this.id }); D.ide.getSIS(); },
    AC(cm) { // align comments
      const ed = this;
      if (ed.isReadOnly) return;
      const ll = cm.lastLine();
      const o = cm.listSelections(); // o:original selections
      const sels = cm.somethingSelected() ? o : [{
        anchor: { line: 0, ch: 0 },
        head: { line: ll, ch: cm.getLine(ll).length },
      }];
      const a = sels.map((sel) => { // a:info about individual selections
        let p = sel.anchor;
        let q = sel.head;
        if ((p.line - q.line || p.ch - q.ch) > 0) { const h = p; p = q; q = h; } // p:from, q:to
        const l = ed.cm.getRange({ line: p.line, ch: 0 }, q, '\n').split('\n'); //  l:lines
        const u = l.map(x => x.replace(/'[^']*'?/g, y => ' '.repeat(y.length))); // u:scrubbed strings
        const c = u.map(x => x.indexOf('⍝')); // c:column index of ⍝
        return {
          p, q, l, u, c,
        };
      });
      const m = Math.max(...a.map(sel => Math.max(...sel.c)));
      a.forEach((sel) => {
        const r = sel.l.map((x, i) => {
          const ci = sel.c[i];
          return ci < 0 ? x : x.slice(0, ci) + ' '.repeat(m - ci) + x.slice(ci);
        });
        r[0] = r[0].slice(sel.p.ch); ed.cm.replaceRange(r.join('\n'), sel.p, sel.q, 'D');
      });
      cm.setSelections(o);
    },
    ER(me) {
      if (this.tc) { D.send('RunCurrentLine', { win: this.id }); D.ide.getSIS(); return; }
      if (D.prf.autoCloseBlocks()) { // inactive, addCommand context limited to trace mode
        // var u=cm.getCursor(),l=u.line,s=cm.getLine(l),m
        const u = me.getPosition();
        const l = u.lineNumber;
        const md = me.getModel();
        const s = md.getLineContent(l);
        let m;
        const re = /^(\s*):(class|disposable|for|if|interface|namespace|property|repeat|section|select|trap|while|with)\b([^⋄{]*)$/i;
        // if(u.ch===s.length&&(m=re.exec(s))&&!D.syn.dfnDepth(cm.getStateAfter(l-1))){
        md.getLineTokens(l, false);
        const state = md._lines[l - 1].getState().clone();
        if (u.column === s.length + 1 && (m = re.exec(s)) && !D.syn.dfnDepth(state)) {
          const [, pre, kwc, post] = m;
          let l1 = l + 1;
          const end = md.getLineCount();
          const kw = kwc[0].toUpperCase() + kwc.slice(1).toLowerCase();
          while (l1 <= end && /^\s*(?:$|⍝)/.test(md.getLineContent(l1))) l1 += 1; // find the next non-blank line
          const s1 = md.getLineContent(l1) || '';
          const pre1 = s1.replace(/\S.*$/, '');
          if (pre.length > pre1.length ||
            (pre.length === pre1.length && !/^\s*:(?:end|else|andif|orif|case|until|access)/i.test(s1))) {
            let r = `:${kw}${post}\n${pre}:End`;
            D.prf.autoCloseBlocksEnd() || (r += kw);
            // cm.replaceRange(r, { line: l, ch: pre.length }, { line: l, ch: s.length });
            me.executeEdits('D', [{ range: new monaco.Range(l, pre.length, l, s.length), text: r }]);
            me.trigger('editor', 'editor.action.formatDocument');
            // cm.execCommand('indentAuto');cm.execCommand('goLineUp');cm.execCommand('goLineEnd')
          }
        }
      }
      // cm.getOption('mode') === 'apl' ? cm.execCommand('newlineAndIndent')
      //   : cm.replaceSelection('\n', 'end');
      me.trigger('editor', 'type', { text: '\n' });
    },
    BH() { D.send('ContinueTrace', { win: this.id }); },
    RM() { D.send('Continue', { win: this.id }); },
    MA() { D.send('RestartThreads', { win: this.id }); },
    CBP() { // Clear trace/stop/monitor for this object
      const ed = this;
      ed.stop.clear();
      ed.setStop();
      ed.tc && D.send('SetLineAttributes', {
        win: ed.id,
        stop: ed.getStops(),
        trace: [],
        monitor: [],
      });
    },
    BP(me) { // toggle breakpoint
      const ed = this;
      const t = ed.stop.has(me.getSelection().positionLineNumber - 1);
      me.getSelections().forEach((s) => {
        let p = { l: s.selectionStartLineNumber - 1, c: s.selectionStartColumn - 1 };
        let q = { l: s.positionLineNumber - 1, c: s.positionColumn - 1 };
        if (p.l > q.l) { const h = p; p = q; q = h; }
        const l1 = q.l - (p.l < q.l && q.c === 1);
        for (let { l } = p; l <= l1; l++) {
          // ed.stop.has(l1) ? ed.stop.delete(l1) : ed.stop.add(l1);
          t ? ed.stop.delete(l) : ed.stop.add(l);
        }
      });
      ed.setStop();
      this.tc && D.send('SetLineAttributes', { win: this.id, stop: this.getStops() });
    },
    RD(me) {
      if (D.prf.ilf()) {
        const text = me.getValue().split('\n');
        D.send('FormatCode', { win: this.id, text });
        // } else if (cm.somethingSelected()) {
        //   cm.execCommand('indentAuto');
        // } else {
        //   const u = cm.getCursor();
        //   cm.execCommand('SA');
        //   cm.execCommand('indentAuto');
        //   cm.setCursor(u);
      }
    },
    VAL(cm) {
      const a = cm.getSelections();
      let s;
      if (a.length !== 1) s = '';
      else if (!a[0]) s = this.cword();
      else if (a[0].indexOf('\n') < 0)[s] = a;
      s && this.ide.exec([`      ${s}`], 0);
    },
    addJump() {
      const j = this.jumps;
      // const u = this.cm.getCursor();
      // j.push({ lh: this.cm.getLineHandle(u.line), ch: u.ch }) > 10 && j.shift();
      // monaco doesn't have line handles so jumps may be off somewhat if lines are added/deleted
      j.push(this.monaco.getPosition()) > 10 && j.shift();
    },
    getUnsaved() {
      const me = this.monaco;
      const v = me.getValue();
      return (v !== this.oText) ? v : false;
    },
    JBK(me) {
      const p = this.jumps.pop(); p && me.setPosition(p);
    },
    indentOrComplete(cm) {
      if (cm.somethingSelected()) { cm.execCommand('indentMore'); return; }
      const c = cm.getCursor();
      const s = cm.getLine(c.line);
      const ch = s[c.ch - 1];
      if (!ch || ch === ' ') { cm.execCommand('insertSoftTab'); return; }
      this.autocompleteWithTab = 1;
      D.send('GetAutocomplete', { line: s, pos: c.ch, token: this.id });
    },
    downOrXline(me) {
      const p = me.getPosition();
      const l = p.lineNumber;
      if (l !== me.model.getLineCount() || /^\s*$/.test(me.model.getLineContent(l))) {
        me.setPosition({ lineNumber: l + 1, column: p.column });
      } else {
        me.trigger('editor', 'editor.action.insertLineAfter');
        // cm.execCommand('newlineAndIndent');
        this.xline = l + 1;
      }
    },
    onbeforeunload(e) { // called when the user presses [X] on the OS window
      const ed = this;
      if (D.prf.floating() && D.ide.connected) { e.returnValue = false; }
      if (ed.ide.dead) {
        D.nww && D.nww.close(true); // force close window
      } else if (ed.tc || (ed.cm.getValue() === ed.oText && `${ed.getStops()}` === `${ed.oStop}`)) {
        ed.EP(ed.cm);
      } else {
        setTimeout(() => {
          window.focus();
          const r = D.el.dialog.showMessageBox(D.elw, {
            title: 'Save?',
            buttons: ['Yes', 'No', 'Cancel'],
            cancelId: -1,
            message: `The object "${ed.name}" has changed.\nDo you want to save the changes?`,
          });
          if (r === 0) ed.EP(ed.monaco);
          else if (r === 1) ed.QT(ed.monaco);
          return '';
        }, 10);
      }
    },
  };
  D.Ed = Ed;
}
