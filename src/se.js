// session
// holds a reference to a Monaco editor instance (.me)
// and processes some of its commands (e.g. .ED(), .ER(), ...)
D.Se = function Se(ide) { // constructor
  const se = this;
  se.ide = ide;
  se.hist = [''];
  se.histIdx = 0;
  se.focusTS = 0;
  se.id = 0;
  se.decorations = [];
  se.hlDecorations = [];
  se.groupDecorations = [];
  se.groupid = 0;
  // modified lines: lineNumber→originalContent
  // inserted lines: lineNumber→0 (also used in syn.js)
  se.dirty = {};
  se.isReadOnly = !1;
  se.lineEditor = {};
  se.multiLineBlocks = [];
  se.lines = [];

  se.dom = document.createElement('div');
  se.dom.className = 'ride_win';
  se.$e = $(se.dom);
  D.createContextMenu(se.dom, se);
  const fs = D.zoom2fs[D.prf.zoom() + 10];
  const me = monaco.editor.create(se.dom, {
    acceptSuggestionOnCommitCharacter: true,
    acceptSuggestionOnEnter: 'off',
    autoClosingBrackets: !!D.prf.autoCloseBrackets(),
    automaticLayout: false,
    autoIndent: false,
    'bracketPairColorization.enabled': false,
    contextmenu: false,
    cursorStyle: D.prf.blockCursor() ? 'block' : 'line',
    cursorBlinking: D.prf.cursorBlinking(),
    emptySelectionClipboard: false,
    folding: false,
    fontFamily: 'apl',
    fontSize: fs,
    fixedOverflowWidgets: true,
    glyphMargin: D.prf.showSessionMargin(),
    iconsInSuggestions: false,
    language: 'apl-session',
    lineHeight: fs + 2,
    lineNumbers: 'off',
    lineDecorationsWidth: 1,
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
    unicodeHighlight: { ambiguousCharacters: false },
    useTabStops: false,
    wordBasedSuggestions: false,
    wordSeparators: D.wordSeparators,
    wordWrap: D.prf.wrap() ? 'on' : 'off',
    unusualLineTerminators: 'off', // iss646: Prevent message prompt about unusual line endings
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
  me.getModel().winid = 0;
  me.dyalogCmds = se;
  se.session = me.createContextKey('session', true);
  se.tracer = me.createContextKey('tracer', true);
  me.listen = true;
  D.remDefaultMap(me);
  D.mapScanCodes(me);
  D.mapKeys(se); D.prf.keys(D.mapKeys.bind(this, se));
  let mouseL = 0; let mouseC = 0; let mouseTS = 0;
  me.onMouseDown((e) => {
    const t = e.target;
    const mt = monaco.editor.MouseTargetType;
    if (e.event.middleButton) {
      e.event.preventDefault();
      e.event.stopPropagation();
    } else if (t.type === mt.CONTENT_TEXT) {
      const p = t.position;
      const l = p.lineNumber;
      const c = p.column;
      if (e.event.timestamp - mouseTS < 400 && mouseL === l && mouseC === c) {
        if (D.prf.doubleClickToEdit() && D.ide.cword(me, p)) {
          se.ED(me);
          me.setPosition(p);
        }
      }
      mouseL = l; mouseC = c; mouseTS = e.event.timestamp;
    }
  });
  const messageContribution = me.getContribution('editor.contrib.messageController');
  me.onDidAttemptReadOnlyEdit(() => {
    if (!se.promptType) {
      messageContribution.showMessage('Cannot edit while interpreter busy.', me.getPosition());
    } else if (!se.ide.connected) {
      messageContribution.showMessage('Cannot edit while disconnected from interpreter.', me.getPosition());
    }
  });
  me.onDidChangeModelContent((e) => {
    if (!me.listen || me.getModel().bqc) return;
    e.changes.forEach((c) => {
      const l0 = c.range.startLineNumber;
      const l1 = c.range.endLineNumber;
      let dl0 = l0;
      let dl1 = l1;
      const m = (l1 - l0) + 1;
      const text = c.text.split(/\r?\n/);
      for (let i = 0; i < se.multiLineBlocks.length; i++) {
        const element = se.multiLineBlocks[i];
        if (l0 <= (element.end || 0) && l1 >= element.start) {
          dl0 = Math.min(dl0, element.start);
          dl1 = Math.max(dl1, element.end);
        }
      }
      let n = text.length;
      if (m < n) {
        const h = se.dirty;
        se.dirty = {};
        Object.keys(h).forEach((x) => { se.dirty[+x + ((n - m) * (+x > l1))] = h[x]; });
      } else if (n < m) {
        for (let j = n; j < m; j++) text.push(''); // pad shrinking changes with empty lines
        se.edit([{ range: new monaco.Range(l0 + n, 1, l0 + n, 1), text: '\n'.repeat(m - n) }]);
        n = m;
      }
      if (dl0 < l0 && !se.dirty[dl0]) {
        se.edit([
          { range: new monaco.Range(dl0, 1, dl0, 1), text: ' ' },
          { range: new monaco.Range(dl0, 1, dl0, 2), text: '' },
        ]);
      }
      let l = dl0;
      while (l <= dl1) {
        if (se.dirty[l] == null) {
          const oldt = se.lines.length === l - 1 ? '      ' : se.lines[l - 1].text.slice(0, -1);
          se.dirty[l] = oldt;
        }
        l += 1;
      }
      while (l <= dl1 + n - m) {
        se.dirty[l] = 0;
        l += 1;
      }
    });
    se.hl();
  });
  me.onDidScrollChange((e) => {
    se.btm = se.me.getContentHeight() + e.scrollTop;
  });
  me.onDidFocusEditorText(() => { se.focusTS = +new Date(); se.ide.focusedWin = se; });
  me.onDidChangeCursorPosition(
    (e) => ide.setCursorPosition(e.position, se.me.getModel().getLineCount()),
  );
  se.promptType = 0; // see ../docs/protocol.md #SetPromptType
  se.processAutocompleteReply = D.ac(me);
  // me.viewModel.viewLayout.constructor.LINES_HORIZONTAL_EXTRA_PX = 14;
  D.prf.wrap((x) => {
    se.me.updateOptions({ wordWrap: x ? 'on' : 'off' });
    se.me.revealLineInCenterIfOutsideViewport(se.me.getModel().getLineCount());
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
  se.setPendent = $.debounce(100, (x) => se.dom.classList.toggle('pendent', x));
};
D.Se.prototype = {
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
    const model = me.getModel();
    const i = se.histIdx + d;
    const l = me.getPosition().lineNumber;
    if (i < 0 || i >= se.hist.length) {
      toastr.info('Reached end of history');
      return;
    }
    if (!se.histIdx) se.hist[0] = model.getLineContent(l);
    if (se.hist[i] == null) return;
    me.executeEdits('D', [{
      range: new monaco.Range(l, 1, l, model.getLineMaxColumn(l)),
      text: se.hist[i],
    }]);
    me.setPosition({ lineNumber: l, column: 1 + se.hist[i].search(/\S|$/) });
    se.histIdx = i;
  },
  hl() { // highlight modified lines
    const se = this;
    se.hlDecorations = Object.keys(se.dirty).map((l) => ({
      range: new monaco.Range(+l, 1, +l, 1),
      options: {
        isWholeLine: true,
        className: 'modified',
        glyphMarginClassName: 'modified',
      },
    }));
    se.setDecorations();
  },
  add(s, type) { // append text to session
    const se = this;
    const { me } = se;
    const model = me.getModel();
    const l = model.getLineCount();
    const s0 = model.getLineContent(l);
    const cp = se.cursorPosition || me.getPosition();
    const ssp = '      ';
    const isLog = type === 2;
    const isEcho = type === 1 || (!isLog && s[0].type === 14);
    let text;
    let scp = cp.column;
    const texti = s.map((line) => line.text).join('');
    s.forEach((v) => {
      const ll = se.lines[se.lines.length - 1];
      if (!ll || ll.text[ll.text.length - 1] === '\n') {
        se.lines.push(v);
      } else {
        ll.text += v.text;
        ll.type = v.type;
        ll.group = v.group;
      }
    });
    if (isLog) {
      const blocks = {};
      se.lines.forEach((ll, i) => {
        if (ll.group > 0) {
          const group = blocks[ll.group] || {};
          if (!group.start) group.start = i + 1;
          group.end = i + 1;
          blocks[ll.group] = group;
        }
      });
      Object.keys(blocks).forEach((group) => se.multiLineBlocks.push(blocks[group]));
    }
    if (!type && texti[texti.length - 1] !== '\n') se.lines.pop();
    if (se.promptType === 3 || se.promptType === 4) {
      text = texti;
    } else {
      const res = (isEcho || s0 === ssp) ? se.preProcessOutput({ line: '', column: 1, input: texti })
        : se.preProcessOutput({ line: s0, column: scp, input: texti });
      scp = res.column;
      text = res.text;
    }
    if (se.promptType === 3 && isEcho) {
      se.lastEchoLine = l;
      se.lineEditor[l] = true;
    }
    if (texti[texti.length - 1] === '\n' && se.promptType === 1) text += ssp;
    let truncate = 0;
    const sls = D.prf.sessionLogSize();
    if (sls > 0) {
      const lines = text.split('\n');
      const n = l - 1;
      truncate = Math.max(0, (n + lines.length) - sls);
      if (truncate > 0) {
        const h = se.dirty;
        se.dirty = {};
        Object.keys(h).forEach((x) => {
          if (+x > truncate) se.dirty[+x - truncate] = h[x];
        });
        if (truncate > n) {
          text = lines.slice(truncate - n).join('\n');
          truncate = n;
        }
      }
    }
    se.isReadOnly && me.updateOptions({ readOnly: false });
    if (truncate) {
      const top = me.getScrollTop();
      const lh = me.getOption(monaco.editor.EditorOption.lineHeight);
      me.setScrollTop(top - truncate * lh);
    }
    if (this.dirty[l] != null) {
      se.edit([
        { range: new monaco.Range(l, 1, l, 1 + s0.length), text: `${s0}\n${text}` },
        { range: new monaco.Range(1, 1, 1 + truncate, 1), text: '' },
      ]);
      me.setPosition(cp);
    } else {
      se.edit([
        { range: new monaco.Range(l, 1, l, 1 + s0.length), text },
        { range: new monaco.Range(1, 1, 1 + truncate, 1), text: '' },
      ]);
      const ll = model.getLineCount();
      const lc = se.isReadOnly ? scp : model.getLineMaxColumn(ll);
      const ncp = { lineNumber: ll, column: lc };
      me.setPosition(ncp);
      se.isReadOnly && (se.cursorPosition = ncp);
      me.revealLine(ll);
      me.setScrollLeft(0);
      se.btm = Math.max(se.dom.clientHeight + me.getScrollTop(), me.getTopForLineNumber(ll));
    }
    se.isReadOnly && me.updateOptions({ readOnly: true });
    model._commandManager.clear();
    se.setGroupDecorations();
    se.setDecorations();
  },
  edit(edits, sel) {
    const se = this;
    const { me } = se;
    me.listen = false;
    me.executeEdits('D', edits, sel);
    me.listen = true;
    se.setGroupDecorations();
    se.setDecorations();
  },
  preProcessOutput(args) {
    const { line, column, input } = args;
    const x = line.split('');
    let p = column - 1;
    let nl = 0;
    for (let i = 0; i < input.length; i++) {
      const c = input[i];
      if (c === '\b') {
        (p > 0) && (x[p - 1] !== '\n') && (p -= 1);
      } else if (c === '\n') {
        x[x.length] = c;
        p = x.length;
        nl = p;
      } else {
        x[p] = c;
        p += 1;
      }
    }
    return { text: x.join(''), column: p - nl + 1 };
  },
  prompt(x) {
    const se = this;
    const { me } = se;
    const model = me.getModel();
    const ssp = '      ';
    const line = model.getLineCount();
    const column = model.getLineMaxColumn(line);
    const t = model.getLineContent(line);
    const wasMultiLine = se.promptType === 3;
    const promptChanged = se.promptType !== x;
    se.promptType = x;
    se.isReadOnly = !x;
    me.updateOptions({
      readOnly: !x,
      quickSuggestions: [2, 4].includes(x) ? false : D.prf.autocompletion() === 'classic',
    });
    se.setPendent(!x);
    if (!wasMultiLine && x === 3) {
      const pl = line - 1;
      se.lineEditor[pl] = true;
      se.multiLineBlocks.push({ start: pl });
      se.edit([
        { range: new monaco.Range(pl, 1, pl, 1), text: ' ' },
        { range: new monaco.Range(pl, 1, pl, 2), text: '' },
      ]);
    } else if (wasMultiLine && x !== 3) {
      const block = se.multiLineBlocks[se.multiLineBlocks.length - 1];
      block.end = se.lastEchoLine;
      if (D.apiVersion < 1) {
        se.groupid += 1;
        se.lines.slice(block.start - 1, block.end).forEach((ll) => { ll.group = se.groupid; });
        se.setGroupDecorations();
        se.setDecorations();
      }
    }
    if (promptChanged) {
      if (x) delete se.cursorPosition;
      else se.cursorPosition = me.getPosition();
    }
    if ((x === 1 && this.dirty[line] == null) || ![0, 1, 3, 4].includes(x)) {
      const isEmpty = /^\s*$/.test(t);
      const text = isEmpty ? ssp : `${t}\n${ssp}`;
      se.edit(
        [{ range: new monaco.Range(line, 1, line, column), text }],
        (promptChanged || !isEmpty)
          ? [new monaco.Selection(line + !isEmpty, 7, line + !isEmpty, 7)] : me.getSelections(),
      );
    } else if (t === ssp) {
      se.edit([{ range: new monaco.Range(line, 1, line, 7), text: '' }]);
    } else {
      me.setPosition({ lineNumber: line, column });
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
  },
  setDecorations() {
    const se = this;
    const lines = se.hlDecorations.map((x) => x.range.startLineNumber);
    se.decorations = se.me.deltaDecorations(
      se.decorations,
      [
        ...se.groupDecorations.filter((x) => !lines.includes(x.range.startLineNumber)),
        ...se.hlDecorations,
      ],
    );
  },
  setGroupDecorations() {
    const se = this;
    se.groupDecorations = [{
      range: new monaco.Range(1, 1, 1 + se.me.getModel().getLineCount(), 1),
      options: {
        isWholeLine: false,
        glyphMarginClassName: 'sessionmargin',
        stickiness: monaco.editor.TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges,
      },
    }];
    const logLineStyles = {
      1: 'session-unpsec',
      2: 'session-stdout',
      3: 'session-stderr',
      4: 'session-syscmd',
      5: 'session-aplerr',
      7: 'session-quad',
      8: 'session-quotequad',
      9: 'session-info',
      11: 'session-echo-input',
      12: 'session-trace',
      14: 'session-input',
    };
    se.lines.forEach((x, i) => {
      const prev = se.lines[i - 1] || {};
      const next = se.lines[i + 1] || {};
      let type;
      if (logLineStyles[x.type]) {
        se.groupDecorations.push({
          range: new monaco.Range(i + 1, 1, i + 1, 1),
          options: {
            isWholeLine: true,
            inlineClassName: logLineStyles[x.type],
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
      }
      if (x.group === 0) return;
      if (x.group === prev.group
        && (x.group === next.group
          || (se.promptType === 3 && next.group === undefined))) type = 'middle';
      else if (x.group === prev.group) type = 'end';
      else if (x.group === next.group || next.group === undefined) type = 'start';
      else return;
      se.groupDecorations.push({
        range: new monaco.Range(i + 1, 1, i + 1, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: `group_${type}`,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });
    });
    const li = se.lines.length - 1;
    const ll = se.lines[li];
    if (se.promptType === 3 && ll.group > 0) {
      se.groupDecorations.push({
        range: new monaco.Range(li + 2, 1, li + 2, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: 'group_end',
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });
    }
  },
  setLineGroup(offset, group) {
    const se = this;
    if (offset > 0) {
      se.lines[se.lines.length - offset].group = group;
      se.setGroupDecorations();
      se.setDecorations();
    }
  },
  updSize() {
    const se = this;
    const { me } = se;
    const top = me.getScrollTop();
    const lh = me.getOption(monaco.editor.EditorOption.lineHeight);
    const ll = me.getModel().getLineCount();
    const llt = me.getTopForLineNumber(ll);
    const onbottom = (me.getPosition().lineNumber === ll)
      && ((llt + lh + lh - top) > se.dom.clientHeight);
    me.layout({ width: se.dom.clientWidth, height: se.dom.clientHeight });
    const newHeight = me.getContentHeight();
    this.updPW();
    if (se.hadErrTmr) {
      me.revealLine(ll);
      this.btm = null;
    } else if (onbottom) {
      me.setScrollTop(0);
      this.btm = null;
      me.revealLine(ll);
    } else {
      const [{ startLineNumber }] = me.getVisibleRanges();
      const flt = me.getTopForLineNumber(startLineNumber);
      this.btm = flt + newHeight;
    }
  },
  updPW(force) {
    // force:emit a SetPW message even if the width hasn't changed
    const se = this;
    if (!D.prf.autoPW()) return;
    const pw = Math.max(42, se.me.getLayoutInfo().viewportColumn);
    if ((force || pw !== se.pw) && se.ide.connected) {
      D.send('SetPW', { pw: se.pw = pw });
    }
  },
  scrollCursorIntoView() {
    const { me } = this;
    setTimeout(() => { me.revealLine(me.getModel().getLineCount()); }, 1);
  },
  saveScrollPos() {
    // workaround for Monaco scrolling under GoldenLayout on Windows when editor is closed
    const { me } = this;
    if (this.btm == null) {
      this.btm = me.getScrollTop() + me.getContentHeight();
    }
  },
  restoreScrollPos() {
    if (this.btm != null) {
      this.me.setScrollTop(this.btm - this.me.getContentHeight());
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
  hasFocus() { return this.me.hasTextFocus(); },
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
    this.ide.setCursorPosition(this.me.getPosition(), this.me.getModel().getLineCount());
  },
  insert(ch) {
    this.isReadOnly || this.me.trigger('editor', 'type', { text: ch });
  },
  die() { this.me.updateOptions({ readOnly: (this.isReadOnly = true) }); },
  getDocument() { return this.dom.ownerDocument; },
  refresh() { },
  loadLine(s) {
    const { me } = this;
    const model = me.getModel();
    const l = model.getLineCount();
    me.executeEdits('D', [{
      range: new monaco.Range(l, 1, l, model.getLineMaxColumn(l)),
      text: s,
    }], [new monaco.Selection(l, s.length + 1, l, s.length + 1)]);
  },
  exec(trace) {
    let w;
    let es;
    const se = this;
    const { me } = se;
    const model = me.getModel();
    if (!se.promptType) return;
    const allLines = Object.keys(se.dirty).map((l) => +l);
    const ls = allLines.filter((l) => !/^\s*$/.test(model.getLineContent(l)));
    if (ls.length) {
      ls.sort((x, y) => x - y);
      const max = model.getLineCount();
      es = ls.map((l) => {
        if (l > max) {
          console.log('out of range', l);
          return '';
        }
        return model.getLineContent(l) || '';
      }); // strings to execute
    } else { // no dirty lines, check selection
      const sel = me.getSelection();
      if (sel.isEmpty()) { // no selection
        // check if cursor in multiline block
        const block = se.multiLineBlocks.find(
          (element) => sel.startLineNumber <= (element.end || 0)
            && sel.startLineNumber >= element.start,
        );
        if (block) {
          es = se.lines.slice(block.start - 1, block.end).map((l) => l.text.slice(0, -1));
        } else {
          es = [model.getLineContent(sel.startLineNumber)];
        }
        trace && /^\s*$/.test(es[0]) && (w = se.ide.tracer()) && w.focus();
      } else {
        es = [model.getValueInRange(sel)];
      }
    }
    allLines.reverse().forEach((l) => {
      if (se.dirty[l] === 0) {
        se.edit([{
          range: new monaco.Range(l - 1, model.getLineMaxColumn(l - 1), l, 1),
          text: '',
        }]);
      } else {
        se.edit([{
          range: new monaco.Range(l, 1, l, model.getLineMaxColumn(l)),
          text: se.dirty[l],
        }]);
      }
    });
    se.ide.exec(es, trace);
    se.dirty = {};
    se.hl();
    se.histAdd(es.filter((x) => !/^\s*$/.test(x)));
    model._commandManager.clear();
  },
  autoCloseBrackets(x) { this.me.updateOptions({ autoClosingBrackets: x }); },
  matchBrackets(x) { this.me.updateOptions({ matchBrackets: !!x }); },
  minimapEnabled(x) { this.me.updateOptions({ minimap: { enabled: !!x } }); },
  minimapRenderCharacters(x) { this.me.updateOptions({ minimap: { renderCharacters: !!x } }); },
  minimapShowSlider(x) { this.me.updateOptions({ minimap: { showSlider: x } }); },
  renderLineHighlight(x) { this.me.updateOptions({ renderLineHighlight: x }); },
  selectionHighlight(x) { this.me.updateOptions({ selectionHighlight: x }); },
  showSessionMargin(x) { this.me.updateOptions({ glyphMargin: x }); },
  snippetSuggestions(x) { this.me.updateOptions({ snippetSuggestions: x ? 'bottom' : 'none' }); },
  autocompletion(x) {
    this.me.updateOptions({
      quickSuggestions: x,
      suggestOnTriggerCharacters: x,
    });
  },
  autocompletionDelay(x) { this.me.updateOptions({ quickSuggestionsDelay: x }); },
  execCommand(cmd) {
    if (this[cmd]) this[cmd](this.me);
    else if (D.commands[cmd]) D.commands[cmd](this.me);
  },
  zoom(z) {
    const se = this;
    const { me } = se;
    const [r] = me.getVisibleRanges();
    const fs = D.zoom2fs[z + 10];
    me.updateOptions({ fontSize: fs, lineHeight: fs + 2 });
    me.revealRangeAtTop(r);
  },

  ValueTip(x) {
    const { me } = this;
    const model = me.getModel();
    if (model.vt && model.vt.complete) {
      const { vt } = model;
      const l = vt.position.lineNumber;
      const value = '```'
        + `${x.class === 2 || x.class === 14 ? 'plaintext' : 'apl'}\n`
        + `${x.tip.join('\n')}\n`
        + '```';
      vt.complete({
        range: new monaco.Range(l, x.startCol + 1, l, x.endCol + 1),
        contents: [{ isTrusted: true, value }],
      });
    }
  },
  BP() { /* NA */ },
  ED(me) {
    const c = me.getPosition();
    const model = me.getModel();
    const text = model.getLineContent(c.lineNumber);
    if (/^\s*$/.test(text)) {
      const tc = this.ide.tracer();
      if (tc) { tc.focus(); tc.ED(tc.me); }
    } else {
      const pos = D.util.ucLength(text.slice(0, c.column - 1));
      D.ide.Edit({ win: 0, pos, text });
    }
  },
  RD() { /* NA */ },
  BK() { this.histMove(1); },
  FD() { this.histMove(-1); },
  QT(me) {
    const se = this;
    const model = me.getModel();
    const c = me.getPosition();
    const l = c.lineNumber;
    const lc = model.getLineCount();
    if (se.dirty[l] === 0) {
      if (l === model.getLineCount()) {
        se.edit([{ range: new monaco.Range(l, 1, l + 1, 1), text: '' }]);
      } else {
        se.edit([{
          range: new monaco.Range(
            l - 1, model.getLineMaxColumn(l - 1),
            l, model.getLineMaxColumn(l),
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
        range: new monaco.Range(l, 1, l, model.getLineMaxColumn(l)),
        text,
      }]);
      me.setPosition({ lineNumber: l, column: 1 + text.search(/\S|$/) });
      delete se.dirty[l];
    }
    se.hl();
  },
  CLS() {},
  EP() { this.ide.focusMRUWin(); },
  ER() { this.exec(0); },
  TC() { this.exec(1); },
  TP() { this.exec(2); },
  LN() { D.prf.lineNums.toggle(); },
  MA() { D.send('RestartThreads', {}); }, // Threads > Restart All Threads
  VAL() {
    const se = this;
    const l = se.me.getPosition().lineNumber;
    se.me.executeEdits('D', [{ range: new monaco.Range(l, 1, l, 1), text: ' ' }]);
    se.me.executeEdits('D', [{ range: new monaco.Range(l, 1, l, 2), text: '' }]);
  },
  DC() {
    const { me } = this;
    const model = me.getModel();
    const l = me.getPosition().lineNumber;
    if (l < model.getLineCount() || /^\s*$/.test(model.getLineContent(l))) {
      me.trigger('editor', 'cursorDown');
    }
  },
  UC() { this.me.trigger('editor', 'cursorUp'); },
  LC() { this.me.trigger('editor', 'cursorLeft'); },
  RC() { this.me.trigger('editor', 'cursorRight'); },
  TO() { this.me.trigger('editor', 'editor.fold'); }, // (editor.unfold) is there a toggle?
  TVB() { D.prf.breakPts.toggle(); },
  TVO() { D.prf.fold.toggle(); },
  indentOrComplete(me) {
    const sels = me.getSelections();

    const c = me.getPosition();
    const ci = c.column - 1;
    if (sels.length === 1 && sels[0].startLineNumber !== sels[0].endLineNumber) {
      me.trigger('editor', 'editor.action.indentLines');
    } else if (D.prf.autocompletion() === 'off' || this.promptType === 4) {
      let i = D.prf.indent();
      i = i > 0 ? i : 4;
      me.trigger('editor', 'type', { text: ' '.repeat(i - (ci % i)) });
    } else {
      me.tabComplete += 1;
      me.trigger('editor', 'editor.action.triggerSuggest');
    }
  },
};
