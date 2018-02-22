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
    ed.HIGHLIGHT_LINE = 1;
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
      autoClosingBrackets: !!D.prf.autoCloseBrackets(),
      automaticLayout: true,
      autoIndent: true,
      cursorStyle: D.prf.blockCursor() ? 'block' : 'line',
      cursorBlinking: D.prf.blinkCursor() ? 'blink' : 'solid',
      folding: ed.isCode && !!D.prf.fold(),
      fontFamily: 'apl',
      fontSize: ed.ide.zoom2fs[D.prf.zoom() + 10],
      glyphMargin: ed.breakpoints,
      language: 'apl',
      lineNumbers: D.prf.lineNums() ? (x => `[${x - 1}]`) : 'off',
      matchBrackets: !!D.prf.matchBrackets(),
      mouseWheelZoom: false,
      renderIndentGuides: true,
      showFoldingControls: 'always',
      wordBasedSuggestions: false,
    });
    ed.me = me;

    ed.me_ready = new Promise((resolve) => {
      // ugly hack as monaco doesn't have a built in event for when the editor is ready?!
      // https://github.com/Microsoft/monaco-editor/issues/115
      const didScrollChangeDisposable = me.onDidScrollChange(() => {
        didScrollChangeDisposable.dispose();
        resolve(true);
      });
    });
    me.dyalogCmds = ed;
    ed.tracer = me.createContextKey('tracer', !!ed.tc);
    D.mapKeys(ed); D.prf.keys(D.mapKeys.bind(this, ed));

    const kc = monaco.KeyCode;
    me.addCommand(kc.DownArrow, () => ed.downOrXline(me), '!suggestWidgetVisible');
    me.addCommand(kc.Tab, () => ed.indentOrComplete(me), '!suggestWidgetVisible && !editorHasMultipleSelections && !findWidgetVisible && !inSnippetMode');

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
      const { me } = ed;
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
      const { me } = ed;
      if (l == null) {
        ed.hlDecorations = [];
      } else {
        ed.hlDecorations = [{
          range: new monaco.Range(l, 1, l, 1),
          options: {
            isWholeLine: true,
            className: 'highlighted',
          },
        }];
        me.setPosition({ lineNumber: l, column: 0 });
        me.revealLineInCenter(l);
      }
      ed.setDecorations();
    },
    setBP(x) { // update the display of breakpoints
      const ed = this;
      ed.breakpoints = !!x;
      ed.me.updateOptions({ glyphMargin: ed.isCode && ed.breakpoints });
    },
    setLN(x) { // update the display of line numbers and the state of the "[...]" button
      const ed = this;
      ed.me.updateOptions({ lineNumbers: D.prf.lineNums() ? (l => `[${l - 1}]`) : 'off' });
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
      ed.me.updateOptions({ readOnly: x });
      if (x) {
        ed.dom.getElementsByClassName('tb_AO')[0].style.display = 'none';
        ed.dom.getElementsByClassName('tb_DO')[0].style.display = 'none';
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
      ed.decorations = ed.me.deltaDecorations(
        ed.decorations,
        [...ed.stopDecorations, ...ed.hlDecorations],
      );
    },
    updSize() { },
    saveScrollPos() { },
    restoreScrollPos() { },
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
      const { me } = ed;
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
      this.me.updateOptions({ cursorStyle: x ? 'block' : 'line' });
    },
    blinkCursor(x) {
      this.me.updateOptions({ cursorBlinking: x ? 'blink' : 'solid' });
    },
    hasFocus() { return this.me.isFocused(); },
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
      this.me.focus();
    },
    insert(ch) {
      this.isReadOnly || this.me.trigger('editor', 'type', { text: ch });
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
    refresh() { },
    cword() { // apl identifier under cursor
      const { me } = this;
      const c = me.getPosition();
      const s = me.model.getLineContent(c.lineNumber);
      const r = `[${D.syn.letter}0-9]*`; // r:regex fragment used for a name
      return (
        ((RegExp(`⎕?${r}$`).exec(s.slice(0, c.column)) || [])[0] || '') + // match left  of cursor
        ((RegExp(`^${r}`).exec(s.slice(c.column)) || [])[0] || '') // match right of cursor
      ).replace(/^\d+/, ''); // trim leading digits
    },
    autoCloseBrackets(x) {
      this.me.updateOptions('autoClosingBrackets', x);
    },
    indent(x) { this.me.updateOptions('autoIndent', x >= 0); },
    fold(x) { this.me.updateOptions({ folding: this.isCode && !!x }); },
    matchBrackets(x) { this.me.updateOptions('matchBrackets', !!x); },

    zoom(z) {
      const ed = this;
      const { me } = ed;
      const r = me.getCompletelyVisibleLinesRangeInViewport();
      me.updateOptions({ fontSize: ed.zoom2fs[z + 10] });
      me.revealRangeAtTop(r);
    },

    ReplyFormatCode(lines) {
      const ed = this;
      const { me } = ed;
      const u = me.getPosition();
      ed.saveScrollPos();
      me.setValue(lines.join('\n'));
      me.model.setEOL(monaco.editor.EndOfLineSequence.LF);
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
        w.hl(line + 1);
        w.focus();
        w.HIGHLIGHT_LINE = line + 1;
      }
    },
    ValueTip(x) {
      // this.vt.processReply(x);
      const { me } = this;
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
      D.ide.Edit({
        win: this.id,
        pos: me.model.getOffsetAt(me.getPosition()),
        text: me.getValue(),
      });
    },
    QT() { D.send('CloseWindow', { win: this.id }); },
    BK(me) { this.tc ? D.send('TraceBackward', { win: this.id }) : me.trigger('D', 'undo'); },
    FD(me) { this.tc ? D.send('TraceForward', { win: this.id }) : me.trigger('D', 'redo'); },
    STL(me) {
      if (!this.tc) return;
      let steps = me.getPosition().lineNumber - this.HIGHLIGHT_LINE;
      const cmd = steps > 0 ? 'TraceForward' : 'TraceBackward';
      steps = Math.abs(steps);
      for (let i = 0; i < steps; i++) { D.send(cmd, { win: this.id }); }
    },
    EP(me) { this.isClosing = 1; this.FX(me); },
    FX(me) {
      const ed = this;
      const v = me.getValue();
      const stop = ed.getStops();
      if (ed.tc || (v === ed.oText && `${stop}` === `${ed.oStop}`)) { // if tracer or unchanged
        D.send('CloseWindow', { win: ed.id }); return;
      }
      if (!ed.me) {
        for (let i = 0; i < stop.length; i++) me.setGutterMarker(stop[i], 'breakpoints', null);
      }
      // D.send('SaveChanges', { win: ed.id, text: v.split('\n'), stop: [] });
      D.send('SaveChanges', { win: ed.id, text: v.split('\n'), stop });
    },
    TL(me) { // toggle localisation
      const name = this.cword();
      if (!name) return;
      const l0 = me.getPosition().lineNumber;
      const ta = me.model._lines[l0 - 1].getState().a.map(x => x.t);
      const ti = ta.lastIndexOf('∇');
      // const ts = (((me.model._lines[l0 - 1] || {})._state || {}).a || [])
      // .map(x => x.t)
      const ts = ta.filter(t => /^(∇|\{|namespace|class|interface)$/.test(t));
      if (ts.includes('{') || (ts.length && !ts.includes('∇'))) return;
      let l;
      for (l = l0 - 1; l >= 0; l--) {
        if (me.model._lines[l].getState().a.length === ti) break;
      }
      if (l < 0) l = 0;
      const lt = me.model.getLineContent(l + 1);
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
    AC(me) { // align comments
      const ed = this;
      if (ed.isReadOnly) return;
      const ll = me.model.getLineCount();
      const o = me.getSelections(); // o:original selections
      const sels = o.length === 1 && o[0].isEmpty() ?
        [new monaco.Selection(1, 1, ll, me.model.getLineContent(ll).length + 1)] : o;

      const a = sels.map((sel) => { // a:info about individual selections
        const p = sel.getStartPosition();
        const q = sel.getEndPosition();
        const l = me.model.getValueInRange({
          startLineNumber: p.lineNumber,
          startColumn: 0,
          endLineNumber: q.lineNumber,
          endColumn: q.column,
        }, monaco.editor.EndOfLinePreference.LF).split('\n'); //  l:lines
        const u = l.map(x => x.replace(/'[^']*'?/g, y => ' '.repeat(y.length))); // u:scrubbed strings
        const c = u.map(x => x.indexOf('⍝')); // c:column index of ⍝
        return {
          p, q, l, u, c,
        };
      });
      const m = Math.max(...a.map(sel => Math.max(...sel.c)));
      const edits = a.map((sel) => {
        const r = sel.l.map((x, i) => {
          const ci = sel.c[i];
          return ci < 0 ? x : x.slice(0, ci) + ' '.repeat(m - ci) + x.slice(ci);
        });
        r[0] = r[0].slice(sel.p.column - 1);
        return {
          range: new monaco.Range(sel.p.lineNumber, sel.p.column, sel.q.lineNumber, sel.q.column),
          text: r.join('\n'),
        };
      });
      me.executeEdits('D', edits, o);
    },
    ER(me) {
      if (this.tc) {
        D.send('RunCurrentLine', { win: this.id }); D.ide.getSIS(); return;
      }
      if (D.prf.autoCloseBlocks()) { // inactive, addCommand context limited to trace mode
        const u = me.getPosition();
        const l = u.lineNumber;
        const md = me.getModel();
        const s = md.getLineContent(l);
        let m;
        const re = /^(\s*):(class|disposable|for|if|interface|namespace|property|repeat|section|select|trap|while|with)\b([^⋄{]*)$/i;
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
            me.executeEdits('D', [{ range: new monaco.Range(l, pre.length, l, s.length), text: r }]);
            me.trigger('editor', 'editor.action.formatDocument');
          }
        }
      }
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
      } else if (me.getSelection().isEmpty()) {
        me.trigger('editor', 'editor.action.formatDocument');
      } else {
        me.trigger('editor', 'editor.action.formatSelection');
      }
    },
    VAL(me) {
      const a = me.getSelections();
      if (a.length !== 1 || monaco.Selection.spansMultipleLines(a[0])) return;
      const s = a[0].isEmpty() ? this.cword() : me.model.getValueInRange(a[0]);
      this.ide.exec([`      ${s}`], 0);
    },
    addJump() {
      const j = this.jumps;
      // monaco doesn't have line handles so jumps may be off somewhat if lines are added/deleted
      j.push(this.me.getPosition()) > 10 && j.shift();
    },
    getUnsaved() {
      const { me } = this;
      const v = me.getValue();
      return (v !== this.oText) ? v : false;
    },
    JBK(me) {
      const p = this.jumps.pop(); p && me.setPosition(p);
    },
    SC(me) { me.trigger('editor', 'actions.find'); },
    AO(me) { me.trigger('editor', 'editor.action.addCommentLine'); },
    DO(me) { me.trigger('editor', 'editor.action.removeCommentLine'); },
    indentOrComplete(me) {
      const sels = me.getSelections();

      if (sels.length !== 1 || !sels[0].isEmpty()) {
        me.trigger('editor', 'editor.action.indentLines'); return;
      }
      const c = me.getPosition();
      const ci = c.column - 1;
      const s = me.model.getLineContent(c.lineNumber);
      const ch = s[ci - 1];
      if (!ch || ch === ' ') {
        const i = D.prf.indent();
        me.trigger('editor', 'type', { text: ' '.repeat(i - (ci % i)) });
        return;
      }
      me.trigger('editor', 'editor.action.triggerSuggest');
    },
    downOrXline(me) {
      const p = me.getPosition();
      const l = p.lineNumber;
      if (l !== me.model.getLineCount() || /^\s*$/.test(me.model.getLineContent(l))) {
        me.setPosition({ lineNumber: l + 1, column: p.column });
      } else {
        me.trigger('editor', 'editor.action.insertLineAfter');
        this.xline = l + 1;
      }
    },
    onbeforeunload(e) { // called when the user presses [X] on the OS window
      const ed = this;
      const { me } = ed;
      if (D.prf.floating() && D.ide.connected) { e.returnValue = false; }
      if (ed.ide.dead) {
        D.nww && D.nww.close(true); // force close window
      } else if (ed.tc || (me.getValue() === ed.oText && `${ed.getStops()}` === `${ed.oStop}`)) {
        ed.EP(me);
      } else {
        setTimeout(() => {
          window.focus();
          const r = D.el.dialog.showMessageBox(D.elw, {
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
    },
  };
  D.Ed = Ed;
}
