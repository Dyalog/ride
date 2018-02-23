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
    se.dom.oncontextmenu = D.oncmenu;
    const me = monaco.editor.create(se.dom, {
      autoClosingBrackets: !!D.prf.autoCloseBrackets(),
      automaticLayout: true,
      autoIndent: true,
      cursorStyle: D.prf.blockCursor() ? 'block' : 'line',
      cursorBlinking: D.prf.blinkCursor() ? 'blink' : 'solid',
      folding: false,
      fontFamily: 'apl',
      fontSize: D.zoom2fs[D.prf.zoom() + 10],
      glyphMargin: se.breakpoints,
      language: 'apl-session',
      lineNumbers: 'off',
      matchBrackets: !!D.prf.matchBrackets(),
      mouseWheelZoom: false,
      renderIndentGuides: false,
      wordBasedSuggestions: false,
      wordWrap: D.prf.wrap() ? 'on' : 'off',
    });
    se.me = me;
    me.model.winid = 0;
    me.dyalogCmds = se;
    se.tracer = me.createContextKey('tracer', true);
    me.listen = true;
    se.oModel = monaco.editor.createModel('');
    D.mapKeys(se); D.prf.keys(D.mapKeys.bind(this, se));
    me.addCommand(
      monaco.KeyCode.Tab,
      () => se.indentOrComplete(me),
      '!suggestWidgetVisible && !editorHasMultipleSelections && !findWidgetVisible && !inSnippetMode',
    );

    let mouseL = 0; let mouseC = 0; let mouseTS = 0;
    me.onMouseDown((e) => {
      const t = e.target;
      const mt = monaco.editor.MouseTargetType;
      const p = t.position;
      if (t.type === mt.CONTENT_TEXT) {
        if (e.event.timestamp - mouseTS < 400 && mouseL === p.lineNumber && mouseC === p.column) {
          se.ED(me); e.event.preventDefault(); e.event.stopPropagation();
        }
        mouseL = p.lineNumber; mouseC = p.column; mouseTS = e.event.timestamp;
      }
    });
    me.onDidChangeModelContent((e) => {
      if (!me.listen) return;
      if (!me.dyalogBQ && e.changes.length === 1
        && e.changes[0].text === D.prf.prefixKey()) {
        CM.commands.BQC(me);
        return;
      }
      e.changes.forEach((c) => {
        const l0 = c.range.startLineNumber;
        const l1 = c.range.endLineNumber;
        const m = (l1 - l0) + 1;
        const text = c.text.split('\n');
        let n = text.length;
        if (m < n) {
          const h = se.dirty;
          se.dirty = {};
          Object.keys(h).forEach((x) => { se.dirty[x + ((n - m) * (x > l1))] = h[x]; });
        } else if (n < m) {
          // if (!c.update) { c.cancel(); return; } // the change is probably the result of Undo
          for (let j = n; j < m; j++) text.push(''); // pad shrinking changes with empty lines
          me.listen = false;
          me.executeEdits('D', [{ range: new monaco.Range(l0 + n, 1, l0 + 1, 1), text: '\n'.repeat(m - n) }]);
          me.listen = true;
          // c.update(c.from, c.to, text);
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
    me.onDidLayoutChange((e) => {
      const r = me.viewModel.getCompletelyVisibleViewRange();
      // const viewport = me.viewModel.viewLayout.getLinesViewportData();
      const flt = me.getTopForLineNumber(r.startLineNumber);
      const llt = me.getTopForLineNumber(r.endLineNumber + 1);
      const ontop = (flt + se.dom.clientHeight) > llt;
      se.top = ontop ? r.startLineNumber : null;
    });
    // cm.on('scroll', (c) => { const i = c.getScrollInfo(); se.btm = i.clientHeight + i.top; });
    me.onDidFocusEditor(() => { se.focusTS = +new Date(); se.ide.focusedWin = se; });
    se.promptType = 0; // see ../docs/protocol.md #SetPromptType
    se.processAutocompleteReply = (x) => {
      if (me.model.ac && me.model.ac.complete) {
        me.model.ac.complete(x.options.map(i => ({ label: i.replace(/^(]|\))?([^.]*\.)?(.*)/, '$3') })));
      }
    };
    D.prf.wrap((x) => {
      se.me.updateOptions({ wordWrap: x ? 'on' : 'off' });
      se.me.revealLineInCenterIfOutsideViewport(se.me.model.getLineCount());
    });
    D.prf.blockCursor((x) => {
      Object.keys(D.wins).forEach((i) => { D.wins[i].blockCursor(!!x); });
    });
    D.prf.blinkCursor((x) => {
      Object.keys(D.wins).forEach((i) => {
        D.wins[i].blinkCursor(x * CM.defaults.cursorBlinkRate);
      });
      this.vt = D.vt(this); // value tips
    });
  }
  Se.prototype = {
    histAdd(lines) {
      this.hist[0] = '';
      [].splice.apply(this.hist, [1, 0].concat(lines));
      this.histIdx = 0;
    },
    histMove(d) { // go back or forward in history
      const se = this;
      const { me } = se;
      const i = se.histIdx + d;
      const l = me.getPosition().lineNumber;
      if (i < 0) { $.alert('There is no next line', 'Dyalog APL Error'); return; }
      if (i >= se.hist.length) { $.alert('There is no previous line', 'Dyalog APL Error'); return; }
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
      const p = '      ';
      let sp = s.slice(-1) === '\n' ? s + p : s;
      me.listen = false;
      se.isReadOnly && me.updateOptions({ readOnly: false });
      if (this.dirty[l] != null) {
        const cp = me.getPosition();
        me.executeEdits('D', [{ range: new monaco.Range(l, 1, l, 1 + s0.length), text: `${s0}\n${sp}` }]);
        me.setPosition(cp);
      } else {
        sp = se.isReadOnly && s0 !== p ? (s0 + sp) : sp;
        me.executeEdits('D', [{ range: new monaco.Range(l, 1, l, 1 + s0.length), text: sp }]);
        const ll = me.model.getLineCount();
        const lc = me.model.getLineMaxColumn(ll);
        me.setPosition({ lineNumber: ll, column: lc });
        se.me.revealLine(ll);
        // me.revealLineInCenterIfOutsideViewport(ll);
      }
      se.isReadOnly && me.updateOptions({ readOnly: true });
      se.oModel.setValue(me.getValue());
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
      me.listen = false;
      if ((x === 1 && this.dirty[l] == null) || [0, 1, 3, 4].indexOf(x) < 0) {
        me.executeEdits('D', [{
          range: new monaco.Range(l, 1, l, 1 + t.length),
          text: '      ',
        }]);
      } else if (t === '      ') {
        me.executeEdits('D', [{
          range: new monaco.Range(l, 1, l, 7),
          text: '',
        }]);
      } else {
        me.setPosition({ lineNumber: l, column: 1 + t.length });
      }
      me.listen = true;
      // x && cm.clearHistory();
    },
    updSize() {
      const se = this;
      const { me } = se;
      const r = me.viewModel.getCompletelyVisibleViewRange();
      const viewport = me.viewModel.viewLayout.getLinesViewportData();
      const flt = me.getTopForLineNumber(r.startLineNumber);
      const llt = me.getTopForLineNumber(r.endLineNumber + 1);
      const ontop = (flt + se.dom.clientHeight) > llt;
      console.log('ontop', ontop);
      // const i = this.cm.getScrollInfo();
      // const { top } = i;
      // const ontop = top > this.cm.heightAtLine(this.cm.lastLine(), 'local') - i.clientHeight;
      // this.cm.setSize(this.dom.clientWidth, this.dom.clientHeight);
      // this.updPW();
      // if (ontop) {
      //   this.btm = top + this.cm.getScrollInfo().clientHeight;
      // } else if (i.top === 0) {
      //   this.btm += this.cm.getScrollInfo().clientHeight - i.clientHeight;
      // }
    },
    updPW(force) {
      // force:emit a SetPW message even if the width hasn't changed
      // discussion about CodeMirror's width in chars: https://github.com/codemirror/CodeMirror/issues/3618
      // We can get the scrollbar's width through cm.display.scrollbarFiller.clientWidth, it's 0 if not present.
      // But it's better to reserve a hard-coded width for it regardless of its presence.
      // const pw = Math.max(42, Math.floor((this.dom.clientWidth - 20) / this.cm.defaultCharWidth()));
      const pw = this.me.getLayoutInfo().viewportColumn;
      if ((pw !== this.pw && this.ide.connected) || force) D.send('SetPW', { pw: this.pw = pw });
    },
    scrollCursorIntoView() {
      const { me } = this;
      me.revealLine(me.model.getLineCount());
      // cm.scrollTo(0, cm.getScrollInfo().top);
      // setTimeout(() => { cm.scrollIntoView(); }, 1);
    },
    saveScrollPos() {
      // workaround for CodeMirror scrolling up to the top under GoldenLayout when editor is closed
      if (this.btm === null) {
        // const i = this.cm.getScrollInfo();
        // this.btm = i.clientHeight + i.top;
      }
    },
    restoreScrollPos() {
      if (this.btm != null) {
        // const i = this.cm.getScrollInfo();
        // this.cm.scrollTo(0, this.btm - i.clientHeight);
      }
    },
    stateChanged() {
      const w = this;
      w.updSize();
      // w.cm.refresh();
      w.updGutters && w.updGutters();
      w.restoreScrollPos();
    },
    blockCursor(x) { this.me.updateOptions({ cursorStyle: x ? 'block' : 'line' }); },
    blinkCursor(x) { this.me.updateOptions({ cursorBlinking: x ? 'blink' : 'solid' }); },
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
      window.focused || window.focus(); this.me.focus();
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
      }]);
    },
    exec(trace) {
      let w;
      let es;
      const se = this;
      const { me } = se;
      if (!se.promptType) return;
      const ls = Object.keys(se.dirty).map(l => +l);
      if (ls.length) {
        me.listen = false;
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
            me.executeEdits('D', [{
              range: new monaco.Range(l, 1, l + 1, 1),
              text: '',
            }]);
          } else {
            me.executeEdits('D', [{
              range: new monaco.Range(l, 1, l, me.model.getLineMaxColumn(l)),
              text: se.dirty[l],
            }]);
          }
        });
        me.listen = true;
      } else {
        const sel = me.getSelection();
        if (sel.isEmpty()) {
          es = [me.model.getLineContent(sel.startLineNumber)];
          if (trace && /^\s*$/.test(es[0]) && (w = se.ide.tracer())) {
            w.focus();
            return;
          }
        } else {
          es = [me.model.getValueInRange(sel)];
        }
      }
      se.ide.exec(es, trace);
      se.dirty = {};
      se.hl();
      se.histAdd(es.filter(x => !/^\s*$/.test(x)));
      // se.cm.clearHistory();
    },
    autoCloseBrackets(x) { this.me.updateOptions('autoClosingBrackets', x); },
    matchBrackets(x) { this.me.updateOptions('matchBrackets', !!x); },
    zoom(z) {
      const se = this;
      const { me } = se;
      const r = me.getCompletelyVisibleLinesRangeInViewport();
      me.updateOptions({ fontSize: se.ide.zoom2fs[z + 10] });
      me.revealRangeAtTop(r);

      // const w = this;
      // const b = w.getDocument().body;
      // const top = w.cm.heightAtLine(w.cm.lastLine(), 'local') < w.btm;
      // const i = w.cm.getScrollInfo();
      // const line = w.cm.lineAtHeight(top ? i.top : w.btm, 'local');
      // const diff = w.btm - (line * w.cm.defaultTextHeight());
      // const ch = i.clientHeight;
      // b.className = `zoom${z} ${b.className.split(/\s+/).filter(s => !/^zoom-?\d+$/.test(s)).join(' ')}`;
      // w.refresh();
      // w.btm = (w.cm.defaultTextHeight() * line) + (top ? ch + 5 : diff) +
      //   (w.cm.getScrollInfo().clientHeight - ch);
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
      const c = me.getPosition();
      const txt = me.model.getLineContent(c.lineNumber);
      if (/^\s*$/.test(txt)) {
        const tc = this.ide.tracer();
        if (tc) { tc.focus(); tc.ED(tc.me); }
      } else {
        D.ide.Edit({
          win: 0,
          pos: me.model.getOffsetAt(c),
          text: me.getValue(),
        });
      }
    },
    BK() { this.histMove(1); },
    FD() { this.histMove(-1); },
    QT(me) {
      const se = this;
      const c = me.getPosition();
      const l = c.lineNumber;
      me.listen = false;
      if (se.dirty[l] === 0) {
        if (l === me.model.getLineCount()) {
          me.executeEdits('D', [{ range: new monaco.Range(l, 1, l + 1, 1), text: '' }]);
        } else {
          me.executeEdits('D', [{
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
        Object.keys(h).forEach((x) => { se.dirty[x - (x > l)] = h[x]; });
      } else if (se.dirty[l] != null) {
        me.executeEdits('D', [{
          range: new monaco.Range(l, 1, l, me.model.getLineMaxColumn(l)),
          text: se.dirty[l],
        }]);
        me.setPosition({ lineNumber: l, column: 1 + se.dirty[l].search(/\S|$/) });
        delete se.dirty[l];
      }
      se.oModel.setValue(me.getValue());
      se.hl();
      me.listen = true;
    },
    EP() { this.ide.focusMRUWin(); },
    ER() { this.exec(0); },
    TC() { this.exec(1); },
    LN() { D.prf.lineNums.toggle(); },
    MA() { D.send('RestartThreads', { win: 0 }); },
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
      me.trigger('editor', 'editor.action.triggerSuggest');
    },
  };
  D.Se = Se;
}
