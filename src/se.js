{
  // session
  // holds a reference to a Monaco editor instance (.me)
  // and processes some of its commands (e.g. .ED(), .ER(), ...)
  function Se(ide) { // constructor
    const se = this;
    se.ide = ide;
    se.hist = [''];
    se.histIdx = 0;
    se.focusTS = 0;
    se.id = 0;
    se.decorations = [];
    // modified lines: lineNumber→originalContent
    // inserted lines: lineNumber→0 (also used in syn.js)
    se.dirty = {};
    se.isReadOnly = !1;

    se.dom = document.createElement('div');
    se.dom.className = 'ride_win';
    se.$e = $(se.dom);
    // se.dom.oncontextmenu = D.oncmenu;
    const fs = D.zoom2fs[D.prf.zoom() + 10];
    const me = monaco.editor.create(se.dom, {
      acceptSuggestionOnCommitCharacter: true,
      acceptSuggestionOnEnter: 'off',
      autoClosingBrackets: !!D.prf.autoCloseBrackets(),
      automaticLayout: false,
      autoIndent: false,
      cursorStyle: D.prf.blockCursor() ? 'block' : 'line',
      cursorBlinking: D.prf.cursorBlinking(),
      emptySelectionClipboard: false,
      folding: false,
      fontFamily: 'apl',
      fontSize: fs,
      glyphMargin: se.breakpoints,
      iconsInSuggestions: false,
      language: 'apl-session',
      lineHeight: fs + 2,
      lineNumbers: 'off',
      matchBrackets: !!D.prf.matchBrackets(),
      minimap: {
        enabled: D.prf.minimapEnabled(),
        renderCharacters: D.prf.minimapRenderCharacters(),
        showSlider: D.prf.minimapShowSlider(),
      },
      mouseWheelZoom: false,
      quickSuggestions: D.prf.autocompletion() === 'classic',
      quickSuggestionsDelay: D.prf.autocompletionDelay(),
      renderIndentGuides: false,
      renderLineHighlight: D.prf.renderLineHighlight(),
      selectionHighlight: D.prf.selectionHighlight(),
      snippetSuggestions: D.prf.snippetSuggestions(),
      suggestOnTriggerCharacters: D.prf.autocompletion() === 'classic',
      useTabStops: false,
      wordBasedSuggestions: false,
      wordSeparators: D.wordSeparators,
      wordWrap: D.prf.wrap() ? 'on' : 'off',
    });
    se.me = me;
    se.me_ready = new Promise((resolve) => {
      // ugly hack as monaco doesn't have a built in event for when the editor is ready?!
      // https://github.com/Microsoft/monaco-editor/issues/115
      const didScrollChangeDisposable = me.onDidScrollChange(() => {
        didScrollChangeDisposable.dispose();
        resolve(true);
      });
    });
    me.model.winid = 0;
    me.dyalogCmds = se;
    se.session = me.createContextKey('session', true);
    se.tracer = me.createContextKey('tracer', true);
    me.listen = true;
    se.oModel = monaco.editor.createModel('');
    D.mapScanCodes(me);
    D.mapKeys(se); D.prf.keys(D.mapKeys.bind(this, se));

    let mouseL = 0; let mouseC = 0; let mouseTS = 0;
    me.onMouseDown((e) => {
      const t = e.target;
      const mt = monaco.editor.MouseTargetType;
      const p = t.position;
      const l = p.lineNumber;
      const c = p.column;
      if (e.event.middleButton) {
        e.event.preventDefault();
        e.event.stopPropagation();
      } else if (t.type === mt.CONTENT_TEXT) {
        if (e.event.timestamp - mouseTS < 400 && mouseL === l && mouseC === c) {
          e.event.preventDefault();
          e.event.stopPropagation();
          se.ED(me);
        }
        mouseL = l; mouseC = c; mouseTS = e.event.timestamp;
      }
    });
    me.onDidChangeModelContent((e) => {
      if (!me.listen || me.model.bqc) return;
      e.changes.forEach((c) => {
        const l0 = c.range.startLineNumber;
        const l1 = c.range.endLineNumber;
        const m = (l1 - l0) + 1;
        const text = c.text.split('\n');
        let n = text.length;
        if (m < n) {
          const h = se.dirty;
          se.dirty = {};
          Object.keys(h).forEach((x) => { se.dirty[+x + ((n - m) * (+x > l1))] = h[x]; });
        } else if (n < m) {
          for (let j = n; j < m; j++) text.push(''); // pad shrinking changes with empty lines
          se.edit([{ range: new monaco.Range(l0 + n, 1, l0 + 1, 1), text: '\n'.repeat(m - n) }]);
          n = m;
        }
        let l = l0;
        while (l <= l1) {
          const base = se.dirty;
          base[l] == null && (base[l] = se.oModel.getLineContent(l));
          l += 1;
        }
        while (l < l0 + n) se.dirty[l++] = 0;
        se.hl();
      });
    });
    me.onDidScrollChange((e) => {
      se.btm = se.me.getLayoutInfo().contentHeight + e.scrollTop;
    });
    me.onDidFocusEditor(() => { se.focusTS = +new Date(); se.ide.focusedWin = se; });
    me.onDidChangeCursorPosition(e => ide.setCursorPosition(e.position));
    se.promptType = 0; // see ../docs/protocol.md #SetPromptType
    se.processAutocompleteReply = D.ac(me);
    me.viewModel.viewLayout.constructor.LINES_HORIZONTAL_EXTRA_PX = 14;
    D.prf.wrap((x) => {
      se.me.updateOptions({ wordWrap: x ? 'on' : 'off' });
      se.me.revealLineInCenterIfOutsideViewport(se.me.model.getLineCount());
    });
    se.histRead();
    se.taBuffer = []; // type ahead buffer
    se.taReplay = () => {
      if (!se.taBuffer.length) return;
      const k = se.taBuffer.shift();
      if (typeof k === 'string') se.insert(k);
      else document.activeElement.dispatchEvent(k);
      setTimeout(se.taReplay, 1);
    };
  }
  Se.prototype = {
    histRead() {
      if (!D.el || !D.prf.persistentHistory()) return;
      const fs = nodeRequire('fs');
      const d = D.el.app.getPath('userData');
      const f = `${d}/hist.txt`;
      try {
        if (fs.existsSync(f)) {
          const l = fs.readFileSync(f, 'utf8').split('\n');
          this.histAdd(l);
        }
      } catch (e) { console.error(e); }
    },
    histWrite() {
      if (!D.el || !D.prf.persistentHistory()) return;
      const fs = nodeRequire('fs');
      const d = D.el.app.getPath('userData');
      const f = `${d}/hist.txt`;
      fs.writeFileSync(f, this.hist.slice(1, 1 + D.prf.persistentHistorySize()).join('\n'));
    },
    histAdd(lines) {
      this.hist[0] = '';
      this.hist.splice(...[1, 0].concat(lines));
      this.histIdx = 0;
    },
    histMove(d) { // go back or forward in history
      const se = this;
      const { me } = se;
      const i = se.histIdx + d;
      const l = me.getPosition().lineNumber;
      if (i < 0 || i >= se.hist.length) {
        toastr.info('Reached end of history');
        return;
      }
      if (!se.histIdx) se.hist[0] = me.model.getLineContent(l);
      if (se.hist[i] == null) return;
      me.executeEdits('D', [{
        range: new monaco.Range(l, 1, l, me.model.getLineMaxColumn(l)),
        text: se.hist[i],
      }]);
      me.setPosition({ lineNumber: l, column: 1 + se.hist[i].search(/\S|$/) });
      se.histIdx = i;
    },
    hl() { // highlight modified lines
      const se = this;
      se.decorations = se.me.deltaDecorations(
        se.decorations,
        Object.keys(se.dirty).map(l => ({
          range: new monaco.Range(+l, 1, +l, 1),
          options: {
            isWholeLine: true,
            className: 'modified',
          },
        })),
      );
    },
    add(s) { // append text to session
      const se = this;
      const { me } = se;
      const l = me.model.getLineCount();
      const s0 = me.model.getLineContent(l);
      let sp = s;
      se.isReadOnly && me.updateOptions({ readOnly: false });
      if (this.dirty[l] != null) {
        const cp = me.getPosition();
        se.edit([{ range: new monaco.Range(l, 1, l, 1 + s0.length), text: `${s0}\n${sp}` }]);
        me.setPosition(cp);
      } else {
        sp = se.isReadOnly && s0 ? (s0 + sp) : sp;
        se.edit([{ range: new monaco.Range(l, 1, l, 1 + s0.length), text: sp }]);
        const ll = me.model.getLineCount();
        const lc = me.model.getLineMaxColumn(ll);
        me.setPosition({ lineNumber: ll, column: lc });
        me.revealLine(ll);
        se.btm = Math.max(se.dom.clientHeight + me.getScrollTop(), me.getTopForLineNumber(ll));
      }
      se.isReadOnly && me.updateOptions({ readOnly: true });
      se.oModel.setValue(me.getValue());
      me.model._commandManager.clear();
    },
    edit(edits, sel) {
      const { me } = this;
      me.listen = false;
      me.executeEdits('D', edits, sel);
      me.listen = true;
    },
    prompt(x) {
      const se = this;
      const { me } = se;
      const l = me.model.getLineCount();
      const t = me.model.getLineContent(l);
      se.promptType = x;
      se.isReadOnly = !x;
      me.updateOptions({ readOnly: !x });
      if ((x === 1 && this.dirty[l] == null) || ![0, 1, 3, 4].includes(x)) {
        se.edit(
          [{ range: new monaco.Range(l, 1, l, 1 + t.length), text: '      ' }],
          [new monaco.Selection(l, 7, l, 7)],
        );
      } else if (t === '      ') {
        se.edit([{ range: new monaco.Range(l, 1, l, 7), text: '' }]);
      } else {
        me.setPosition({ lineNumber: l, column: 1 + t.length });
      }
      if (!x) {
        se.taBuffer.length = 0;
        se.taCb = se.taCb || me.onKeyDown((ke) => {
          const be = ke.browserEvent;
          const k = be.key;
          if (k.length === 1 && !be.ctrlKey && !be.altKey && !be.metaKey) se.taBuffer.push(k);
          else se.taBuffer.push(be);
        });
      } else {
        if (se.taCb) { se.taCb.dispose(); delete se.taCb; }
        se.taBuffer.length && se.taReplay();
      }
      // x && me.model._commandManager.clear();
    },
    updSize() {
      const se = this;
      const { me } = se;
      const oldHeight = me.getLayoutInfo().contentHeight;
      const top = me.getScrollTop();
      const lh = me.getConfiguration().lineHeight;
      const ll = me.model.getLineCount();
      const llt = me.getTopForLineNumber(ll);
      const ontop = top > (llt + lh + lh) - oldHeight;
      const { startLineNumber, endLineNumber } = me.getCompletelyVisibleLinesRangeInViewport();
      const onbottom = endLineNumber === ll;
      me.layout({ width: se.dom.clientWidth, height: se.dom.clientHeight });
      const flt = me.getTopForLineNumber(startLineNumber);
      const newHeight = me.getLayoutInfo().contentHeight;
      this.updPW();
      if (se.hadErrTmr) {
        me.revealLine(ll);
      } else if (ontop) {
        this.btm = flt + newHeight;
      } else if (onbottom) {
        me.setScrollTop(0);
        this.btm = null;
        me.revealLine(ll);
      }
    },
    updPW(force) {
      // force:emit a SetPW message even if the width hasn't changed
      const se = this;
      const pw = Math.max(42, se.me.getLayoutInfo().viewportColumn);
      if ((pw !== se.pw && se.ide.connected) || force) D.send('SetPW', { pw: se.pw = pw });
    },
    scrollCursorIntoView() {
      const { me } = this;
      setTimeout(() => { me.revealLine(me.model.getLineCount()); }, 1);
    },
    saveScrollPos() {
      // workaround for Monaco scrolling under GoldenLayout on Windows when editor is closed
      const { me } = this;
      if (this.btm == null) {
        this.btm = me.getScrollTop() + me.getLayoutInfo().contentHeight;
      }
    },
    restoreScrollPos() {
      if (this.btm != null) {
        this.me.setScrollTop(this.btm - this.me.getLayoutInfo().contentHeight);
      }
    },
    stateChanged() {
      const w = this;
      w.updSize();
      w.updGutters && w.updGutters();
      w.restoreScrollPos();
    },
    blockCursor(x) { this.me.updateOptions({ cursorStyle: x ? 'block' : 'line' }); },
    cursorBlinking(x) { this.me.updateOptions({ cursorBlinking: x }); },
    hasFocus() { return this.me.isFocused(); },
    focus() {
      let q = this.container;
      let p = q && q.parent;
      const l = q && q.layoutManager;
      const m = l && l._maximisedItem;
      if (m && m !== (p && p.parent)) m.toggleMaximise();
      while (p) {
        p.setActiveContentItem && p.setActiveContentItem(q); q = p; p = p.parent;
      } // reveal in golden layout
      D.elw && D.elw.focus();
      window.focused || window.focus();
      this.me.focus();
      this.ide.setCursorPosition(this.me.getPosition());
    },
    insert(ch) {
      this.isReadOnly || this.me.trigger('editor', 'type', { text: ch });
    },
    die() { this.me.updateOptions({ readOnly: (this.isReadOnly = true) }); },
    getDocument() { return this.dom.ownerDocument; },
    refresh() { },
    loadLine(s) {
      const { me } = this;
      const l = me.model.getLineCount();
      me.executeEdits('D', [{
        range: new monaco.Range(l, 1, l, me.model.getLineMaxColumn(l)),
        text: s,
      }], [new monaco.Selection(l, s.length + 1, l, s.length + 1)]);
    },
    exec(trace) {
      let w;
      let es;
      const se = this;
      const { me } = se;
      if (!se.promptType) return;
      const ls = Object.keys(se.dirty).map(l => +l);
      if (ls.length) {
        ls.sort((x, y) => x - y);
        const max = me.model.getLineCount();
        es = ls.map((l) => {
          if (l > max) {
            console.log('out of range', l);
            return '';
          }
          return me.model.getLineContent(l) || '';
        }); // strings to execute
        ls.reverse().forEach((l) => {
          if (se.dirty[l] === 0) {
            se.edit([{
              range: new monaco.Range(l, 1, l + 1, 1),
              text: '',
            }]);
          } else {
            se.edit([{
              range: new monaco.Range(l, 1, l, me.model.getLineMaxColumn(l)),
              text: se.dirty[l],
            }]);
          }
        });
      } else {
        const sel = me.getSelection();
        if (sel.isEmpty()) {
          es = [me.model.getLineContent(sel.startLineNumber)];
          trace && /^\s*$/.test(es[0]) && (w = se.ide.tracer()) && w.focus();
        } else {
          es = [me.model.getValueInRange(sel)];
        }
      }
      se.ide.exec(es, trace);
      se.dirty = {};
      se.hl();
      se.histAdd(es.filter(x => !/^\s*$/.test(x)));
      me.model._commandManager.clear();
    },
    autoCloseBrackets(x) { this.me.updateOptions({ autoClosingBrackets: x }); },
    matchBrackets(x) { this.me.updateOptions({ matchBrackets: !!x }); },
    minimapEnabled(x) { this.me.updateOptions({ minimap: { enabled: !!x } }); },
    minimapRenderCharacters(x) { this.me.updateOptions({ minimap: { renderCharacters: !!x } }); },
    minimapShowSlider(x) { this.me.updateOptions({ minimap: { showSlider: x } }); },
    renderLineHighlight(x) { this.me.updateOptions({ renderLineHighlight: x }); },
    selectionHighlight(x) { this.me.updateOptions({ selectionHighlight: x }); },
    snippetSuggestions(x) { this.me.updateOptions({ snippetSuggestions: x ? 'bottom' : 'none' }); },
    autocompletion(x) {
      this.me.updateOptions({
        quickSuggestions: x,
        suggestOnTriggerCharacters: x,
      });
    },
    autocompletionDelay(x) { this.me.updateOptions({ quickSuggestionsDelay: x }); },
    execCommand(cmd) { this[cmd] && this[cmd](this.me); },
    zoom(z) {
      const se = this;
      const { me } = se;
      const r = me.getCompletelyVisibleLinesRangeInViewport();
      const fs = D.zoom2fs[z + 10];
      me.updateOptions({ fontSize: fs, lineHeight: fs + 2 });
      me.revealRangeAtTop(r);

      // const w = this;
      // const b = w.getDocument().body;
      // const top = w.cm.heightAtLine(w.cm.lastLine(), 'local') < w.btm;
      // const i = w.cm.getScrollInfo();
      // const line = w.cm.lineAtHeight(top ? i.top : w.btm, 'local');
      // const diff = w.btm - (line * w.cm.defaultTextHeight());
      // const ch = i.clientHeight;
      // const cls = b.className.split(/\s+/).filter(s => !/^zoom-?\d+$/.test(s)).join(' ');
      // b.className = `zoom${z} ${cls}`;
      // w.refresh();
      // w.btm = (w.cm.defaultTextHeight() * line) + (top ? ch + 5 : diff) +
      //   (w.cm.getScrollInfo().clientHeight - ch);
    },

    ValueTip(x) {
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
      const c = me.getPosition();
      const txt = me.model.getLineContent(c.lineNumber);
      if (/^\s*$/.test(txt)) {
        const tc = this.ide.tracer();
        if (tc) { tc.focus(); tc.ED(tc.me); }
      } else {
        const offset = me.model.getOffsetAt(c);
        const text = me.getValue();
        const pos = D.util.ucLength(text.slice(0, offset));
        D.ide.Edit({ win: 0, pos, text });
      }
    },
    BK() { this.histMove(1); },
    FD() { this.histMove(-1); },
    QT(me) {
      const se = this;
      const c = me.getPosition();
      const l = c.lineNumber;
      const lc = me.model.getLineCount();
      if (se.dirty[l] === 0) {
        if (l === me.model.getLineCount()) {
          se.edit([{ range: new monaco.Range(l, 1, l + 1, 1), text: '' }]);
        } else {
          se.edit([{
            range: new monaco.Range(
              l - 1, me.model.getLineMaxColumn(l - 1),
              l, me.model.getLineMaxColumn(l),
            ),
            text: '',
          }]);
        }
        delete se.dirty[l];
        const h = se.dirty;
        se.dirty = {};
        Object.keys(h).forEach((x) => { se.dirty[+x - (+x > l)] = h[x]; });
      } else if (se.dirty[l] != null) {
        const text = l === lc && !se.dirty[l].length ? '      ' : se.dirty[l];
        se.edit([{
          range: new monaco.Range(l, 1, l, me.model.getLineMaxColumn(l)),
          text,
        }]);
        me.setPosition({ lineNumber: l, column: 1 + text.search(/\S|$/) });
        delete se.dirty[l];
      }
      se.oModel.setValue(me.getValue());
      se.hl();
    },
    EP() { this.ide.focusMRUWin(); },
    ER() { this.exec(0); },
    TC() { this.exec(1); },
    LN() { D.prf.lineNums.toggle(); },
    MA() { D.send('RestartThreads', {}); },
    DC() {
      const { me } = this;
      const l = me.getPosition().lineNumber;
      if (l < me.model.getLineCount() || /^\s*$/.test(me.model.getLineContent(l))) {
        me.trigger('editor', 'cursorDown');
      }
    },
    UC() { this.me.trigger('editor', 'cursorUp'); },
    LC() { this.me.trigger('editor', 'cursorLeft'); },
    RC() { this.me.trigger('editor', 'cursorRight'); },
    SA() { this.me.trigger('editor', 'selectAll'); },
    TO() { this.me.trigger('editor', 'editor.fold'); }, // (editor.unfold) is there a toggle?
    TVO() { D.prf.fold.toggle(); },
    indentOrComplete(me) {
      const sels = me.getSelections();

      const c = me.getPosition();
      const ci = c.column - 1;
      const s = me.model.getLineContent(c.lineNumber);
      const ch = s[ci - 1];
      if (sels.length !== 1 || !sels[0].isEmpty()
        || this.promptType === 4 || /^ *$/.test(s.slice(0, ci))) {
        me.trigger('editor', 'editor.action.indentLines'); return;
      }
      if (!ch || ch === ' ') {
        const i = D.prf.indent();
        me.trigger('editor', 'type', { text: ' '.repeat(i - (ci % i)) });
        return;
      }
      if (D.prf.autocompletion() !== 'off') {
        me.tabComplete += 1;
        me.trigger('editor', 'editor.action.triggerSuggest');
      }
    },
  };
  D.Se = Se;
}
