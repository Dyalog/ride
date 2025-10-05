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
  se.multiLineBlocks = {};
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
    const p = t.position;
    if (e.event.middleButton) {
      e.event.preventDefault();
      e.event.stopPropagation();
    } else if (t.type === mt.GUTTER_GLYPH_MARGIN) {
      if (p.lineNumber === se.lines.length + 1) {
        this.EMI();
      }
    } else if (t.type === mt.CONTENT_TEXT) {
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
      const isInputL0 = se.isInputLine(l0);
      const isInputL1 = se.isInputLine(l1);
      let dl0 = l0;
      let dl1 = l1;
      const m = (l1 - l0) + 1;
      const text = c.text.split(/\r?\n/);
      const blocks = Object.values(se.multiLineBlocks);
      // ignore the last block if we are still in multiline prompt mode
      ((se.promptType === 3) ? blocks.slice(0, -1) : blocks).forEach((element) => {
        if (l0 <= (element.end || 0) && l0 <= se.lines.length
         && isInputL0) {
          dl0 = Math.min(dl0, element.start);
        }
        if (l1 >= element.start && l1 <= se.lines.length
          && isInputL1) {
          dl1 = Math.max(dl1, element.end);
        }
      });
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
        se.edit([{ range: new monaco.Range(dl0, 1, dl0, 1), text: ' ' }]);
        se.edit([{ range: new monaco.Range(dl0, 1, dl0, 2), text: '' }]);
      }
      let l = dl0;
      while (l <= dl1) {
        if (se.dirty[l] == null) {
          const oldt = se.lines.length < l ? '      ' : se.lines[l - 1].text.slice(0, -1);
          se.dirty[l] = oldt;
        }
        l += 1;
      }
      while (l <= dl1 + n - m) {
        se.dirty[l] = 0;
        l += 1;
      }
    });
    se.setDecorations();
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
  se.setDecorations = $.debounce(100, () => {
    se.setGroupDecorations();
    se.hl();
    se.decorations = se.me.deltaDecorations(
      se.decorations,
      [
        ...se.groupDecorations,
        ...se.hlDecorations,
      ],
    );
  });
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
        inlineClassName: 'modified',
        glyphMarginClassName: 'modified',
      },
    }));
  },
  isInputLine(line) { // line in []IO 1 (to match monaco)
    return this.lines[line - 1] && [11, 14].includes(this.lines[line - 1].type);
  },
  add(s, type) { // append text to session
    const se = this;
    const { me } = se;
    se.isReadOnly && me.updateOptions({ readOnly: false });
    se.undoChanges();
    const model = me.getModel();
    const l = model.getLineCount();
    const cp = se.cursorPosition || me.getPosition();
    const ssp = '      ';
    const isLog = type === 2;
    const isEcho = type === 1 || (!isLog && s[0].type === 14);
    let text;
    const scp = cp.column;
    let startLine = se.lines.length;
    if (startLine > 0 && se.lines.at(-1).text.at(-1) !== '\n') startLine -= 1;
    s.forEach((v) => {
      const ll = se.lines.at(-1);
      if (!ll || ll.text.at(-1) === '\n') {
        v.text = se.preProcessOutput('', v.text);
        se.lines.push(v);
      } else {
        if ([3, 4].includes(se.promptType) && ll.text === ssp) ll.text = '';
        ll.text = se.preProcessOutput(ll.text, v.text);
        ll.type = v.type;
        ll.group = v.group;
      }
    });
    se.lines.slice(startLine).forEach((ll, i) => {
      if (ll.group > 0) {
        const group = se.multiLineBlocks[ll.group] || {};
        if (!group.start) group.start = startLine + i + 1;
        group.end = startLine + i + 1;
        se.multiLineBlocks[ll.group] = group;
      }
    });
    if (se.promptType === 3 && isEcho) {
      se.lastEchoLine = l;
      se.lineEditor[l] = true;
    }
    text = se.lines.slice(startLine).map((ll) => ll.text).join('');
    if (text.at(-1) === '\n' && se.promptType === 1) text += ssp;
    let truncate = 0;
    const sls = D.prf.sessionLogSize();
    if (sls > 0) {
      const lines = text.split('\n');
      const n = l - 1;
      truncate = Math.max(0, (n + lines.length) - sls);
      if (truncate > n) {
        text = lines.slice(truncate - n).join('\n');
        truncate = n;
      }
    }
    if (truncate) {
      const top = me.getScrollTop();
      const lh = me.getOption(monaco.editor.EditorOption.lineHeight);
      me.setScrollTop(top - truncate * lh);
    }
    se.edit([
      { range: new monaco.Range(l, 1, l + 1, 1), text },
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
    se.isReadOnly && me.updateOptions({ readOnly: true });
    model._commandManager.clear();
    se.setDecorations();
  },
  edit(edits, sel) {
    const se = this;
    const { me } = se;
    me.listen = false;
    me.executeEdits('D', edits, sel);
    me.listen = true;
    se.setDecorations();
  },
  preProcessOutput(line, input) {
    if (!/\b/.test(input)) return line + input;
    const x = line.split('');
    let p = line.length;
    for (let i = 0; i < input.length; i++) {
      const c = input[i];
      if (c === '\b') {
        (p > 0) && (x[p - 1] !== '\n') && (p -= 1);
      } else if (c === '\n') {
        x[x.length] = c;
        p = x.length;
      } else {
        x[p] = c;
        p += 1;
      }
    }
    return x.join('');
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
      se.edit([{ range: new monaco.Range(pl, 1, pl, 1), text: ' ' }]);
      se.edit([{ range: new monaco.Range(pl, 1, pl, 2), text: '' }]);
    } else if (wasMultiLine && x !== 3 && D.apiVersion < 1) {
      const block = Object.values(se.multiLineBlocks).pop();
      block.end = se.lastEchoLine;
      se.groupid += 1;
      se.lines.slice(block.start - 1, block.end).forEach((ll) => { ll.group = se.groupid; });
      se.setDecorations();
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
    } else if (x !== 3 && t === ssp) {
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
    const rows = se.me.getModel().getLineCount();
    let j = 0;
    let prev = {};
    let curr = {};
    let next = se.lines[0];
    for (let i = 0; i < rows; i++) {
      if (se.dirty[i + 1] !== 0) {
        prev = curr;
        curr = next;
        next = se.lines[j + 1] || {};
        j += 1;
      }
      let type;
      if (logLineStyles[curr.type]) {
        se.groupDecorations.push({
          range: new monaco.Range(i + 1, 1, i + 1, 1),
          options: {
            isWholeLine: true,
            inlineClassName: logLineStyles[curr.type],
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
      }
      if (curr.group) {
        if (curr.group === prev.group
          && (curr.group === next.group
            || (se.promptType === 3 && next.group === undefined))) type = 'middle';
        else if (curr.group === prev.group) type = 'end';
        else if (curr.group === next.group || next.group === undefined) type = 'start';
      }
      if (type) {
        se.groupDecorations.push({
          range: new monaco.Range(i + 1, 1, i + 1, 1),
          options: {
            isWholeLine: false,
            glyphMarginClassName: `group_${type}`,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
      }
    }
    if (se.promptType === 3 && curr.group > 0) {
      se.groupDecorations.push({
        range: new monaco.Range(rows, 1, rows, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: 'group_end cancelable',
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });
    }
  },
  setLineGroup(offset, group) {
    const se = this;
    if (offset > 0) {
      const li = se.lines.length - offset;
      const oldGroup = se.lines[li].group;
      const block = se.multiLineBlocks[group] || {};
      const oldBlock = se.multiLineBlocks[oldGroup] || {};
      if (oldBlock.start === li + 1 && oldBlock.end === li + 1) {
        delete se.multiLineBlocks[oldGroup]; // single line in old block, remove block
      } else if (oldBlock.start === li + 1) {
        oldBlock.start = li + 2; // shift group to start on next line
      } else if (oldBlock.end === li + 1) {
        oldBlock.end = li; // shift group to end on previous line
      }
      if (group > 0) { // create new block or update exisiting
        se.lines[li].group = group;
        if (!block.start || block.start > li) block.start = li + 1;
        if (!block.end || block.end <= li) block.end = li + 1;
        se.multiLineBlocks[group] = block;
      }
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
  undoChanges() {
    const se = this;
    const model = se.me.getModel();
    const allLines = Object.keys(se.dirty).map((l) => +l);
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
    se.dirty = {};
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
        const block = Object.values(se.multiLineBlocks).find(
          (element) => sel.startLineNumber <= (element.end || 0)
            && sel.startLineNumber >= element.start,
        );
        if (se.isInputLine(sel.startLineNumber) && block) {
          es = se.lines.slice(block.start - 1, block.end).map((l) => l.text.slice(0, -1));
        } else {
          es = [model.getLineContent(sel.startLineNumber)];
        }
        trace && /^\s*$/.test(es[0]) && (w = se.ide.tracer()) && w.focus();
      } else {
        es = [model.getValueInRange(sel)];
      }
    }
    se.undoChanges();
    se.ide.exec(es, trace);
    se.setDecorations();
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
    const ln = c.lineNumber;
    const lc = model.getLineCount();
    let dl0 = ln;
    let dl1 = ln;
    Object.values(se.multiLineBlocks).forEach((element) => {
      if (ln <= (element.end || 0) && ln >= element.start) {
        dl0 = Math.min(dl0, element.start);
        dl1 = Math.max(dl1, element.end);
      }
    });
    for (let l = dl1; l >= dl0; l--) {
      if (se.dirty[l] === 0) {
        if (l === model.getLineCount()) {
          se.edit([{ range: new monaco.Range(l, 1, l + 1, 1), text: '' }]);
        } else {
          se.edit([{
            range: new monaco.Range(
              l - 1,
              model.getLineMaxColumn(l - 1),
              l,
              model.getLineMaxColumn(l),
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
    }
    se.setDecorations();
  },
  CLS() {},
  EMI() { if (this.promptType === 3) D.send('ExitMultilineInput', {}); },
  EP() { this.ide.focusMRUWin(); },
  ER() { this.exec(0); },
  TC() { this.exec(1); },
  IT() { this.exec(2); },
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
