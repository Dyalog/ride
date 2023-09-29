// represents an editor (.tc==0) or a tracer (.tc==1)
// holds a ref to a Monaco editor instance (.me),
// handles most commands in editors (e.g. .LN(), .QT(), .TL(), ...)
D.Ed = function Ed(ide, opts) { // constructor
  const ed = this;
  ed.ide = ide;
  ed.id = opts.id;
  ed.name = opts.name;
  ed.title = ed.name;
  ed.tc = opts.tc;
  ed.decorations = [];
  ed.hlDecorations = [];
  ed.stopDecorations = [];
  ed.dom = I.ed_tmpl.cloneNode(1);
  ed.dom.id = null;
  ed.dom.style.display = '';
  ed.$e = $(ed.dom);
  ed.jumps = [];
  ed.focusTS = 0;
  D.createContextMenu(ed.dom, ed);
  ed.oText = '';
  ed.oStop = []; // remember original text and "stops" to avoid pointless saving on EP
  ed.monitor = new Set();
  ed.stop = new Set();
  ed.trace = new Set();
  ed.isCode = 1;
  ed.isModified = false;
  ed.isReadOnly = !1;
  ed.isReadOnlyEntity = !1;
  ed.breakpoints = D.prf.breakPts();
  ed.$e.toggleClass('no-toolbar', !D.prf.showEditorToolbar());
  const fs = D.zoom2fs[D.prf.zoom() + 10];
  const me = monaco.editor.create(ed.dom.querySelector('.ride_win_me'), {
    acceptSuggestionOnCommitCharacter: true,
    acceptSuggestionOnEnter: 'off',
    autoClosingBrackets: !!D.prf.autoCloseBrackets(),
    automaticLayout: true,
    autoIndent: D.prf.indent() >= 0,
    'bracketPairColorization.enabled': false,
    contextmenu: false,
    cursorStyle: D.prf.blockCursor() ? 'block' : 'line',
    cursorBlinking: D.prf.cursorBlinking(),
    emptySelectionClipboard: false,
    fixedOverflowWidgets: true,
    folding: ed.isCode && !!D.prf.fold(),
    fontFamily: 'apl',
    fontSize: fs,
    formatOnPaste: true,
    formatOnType: true,
    glyphMargin: ed.breakpoints,
    iconsInSuggestions: false,
    language: 'apl',
    lineHeight: fs + 2,
    lineNumbers: D.prf.lineNums() ? ((x) => `[${x - 1}]`) : 'off',
    matchBrackets: !!D.prf.matchBrackets(),
    minimap: {
      enabled: D.prf.minimapEnabled(),
      renderCharacters: D.prf.minimapRenderCharacters(),
      showSlider: D.prf.minimapShowSlider(),
    },
    mouseWheelZoom: false,
    quickSuggestions: D.prf.autocompletion() === 'classic',
    quickSuggestionsDelay: D.prf.autocompletionDelay(),
    renderLineHighlight: D.prf.renderLineHighlight(),
    renderIndentGuides: false,
    scrollBeyondLastLine: false,
    selectionHighlight: D.prf.selectionHighlight(),
    snippetSuggestions: D.prf.snippetSuggestions() ? 'bottom' : 'none',
    stopRenderingLineAfter: -1,
    suggestOnTriggerCharacters: D.prf.autocompletion() === 'classic',
    showFoldingControls: 'always',
    unicodeHighlight: { ambiguousCharacters: false },
    useTabStops: false,
    wordBasedSuggestions: false,
    wordSeparators: D.wordSeparators,
    unusualLineTerminators: 'off', // iss646: Prevent message prompt about unusual line endings
  });
  ed.me = me;
  ed.me_ready = new Promise((resolve) => {
    // ugly hack as monaco doesn't have a built in event for when the editor is ready?!
    // https://github.com/Microsoft/monaco-editor/issues/115
    const onceReady = me.onDidLayoutChange(() => {
      onceReady.dispose();
      resolve(true);
    });
  });
  me.dyalogCmds = ed;
  ed.session = me.createContextKey('session', false);
  ed.tracer = me.createContextKey('tracer', !!ed.tc);
  me.listen = true;
  D.remDefaultMap(me);
  D.mapScanCodes(me);
  D.mapKeys(ed); D.prf.keys(D.mapKeys.bind(this, ed));

  me.onDidChangeCursorPosition(ed.cursorActivity.bind(ed));

  me.getModel().onDidChangeContent((evt) => {
    const { range } = evt.changes[0];
    const wasModified = ed.isModified;
    ed.isModified = !ed.firstOpen;
    if (ed.isCode && range.startLineNumber === 1) {
      const content = me.getModel().getLineContent(1);
      const [s] = content.match(/[^⍝\n\r;]*/);
      if (!s) {
        ed.title = ed.name;
      } else if (D.syntax.dfnHeader.test(s)) {
        ed.title = s.split('←')[0].trim(' ');
      } else {
        const cds = s.match(RegExp(`^:((?:Class[ :]*|Namespace|Interface) +(${D.syntax.name}))?`, 'i'));
        if (cds) {
          ed.title = cds[2] || ed.name;
        } else {
          const [, fn, op] = s.match(D.syntax.tradFnRE) || [];
          ed.title = op || fn || ed.name;
        }
      }
      ed.updateTitle();
    }
    if (wasModified !== ed.isModified) {
      ed.updateTitle();
      ed.container.tab.closeElement.toggleClass('modified', ed.isModified);
    }
  });

  let mouseL = 0; let mouseC = 0; let mouseTS = 0;
  me.onMouseDown((e) => {
    const t = e.target;
    const mt = monaco.editor.MouseTargetType;
    const p = t.position;
    const inEmptySpace = t.type === mt.CONTENT_EMPTY;
    if (e.event.middleButton) {
      e.event.preventDefault();
      e.event.stopPropagation();
    } else if (t.type === mt.GUTTER_GLYPH_MARGIN) {
      if (e.event.buttons === 2) {
        ed.lineClicked = p.lineNumber;
      } else {
        ed.toggleStop(p.lineNumber - 1);
      }
    } else if (t.type === mt.CONTENT_TEXT
      || (ed.tc && inEmptySpace)) {
      if (e.event.timestamp - mouseTS < 400 && mouseL === p.lineNumber && mouseC === p.column) {
        if ((ed.tc && inEmptySpace) || (D.prf.doubleClickToEdit() && D.ide.cword(me, p))) {
          ed.ED(me, inEmptySpace);
          me.setPosition(p);
        }
      }
      mouseL = p.lineNumber; mouseC = p.column; mouseTS = e.event.timestamp;
    }
  });
  const messageContribution = me.getContribution('editor.contrib.messageController');
  me.onDidAttemptReadOnlyEdit(() => {
    if (ed.hasEmbeddedBreaks) {
      messageContribution.showMessage('Cannot edit variable with embedded line breaks.', me.getPosition());
    } else if (!ed.ide.connected) {
      messageContribution.showMessage('Cannot edit while disconnected from interpreter.', me.getPosition());
    } else if (ed.tc) {
      messageContribution.showMessage('Cannot edit in read-only editor.', me.getPosition());
    } else {
      messageContribution.showMessage('Cannot edit while interpreter busy.', me.getPosition());
    }
  });

  me.onDidFocusEditorText(() => { ed.focusTS = +new Date(); ed.ide.focusedWin = ed; });
  ed.processAutocompleteReply = D.ac(me);
  ed.tb = $(ed.dom).find('a');
  ed.tb.mousedown((x) => {
    if (x.currentTarget.matches('.tb_btn')) {
      x.currentTarget.classList.add('armed');
      x.preventDefault();
    }
  });
  ed.tb.on('mouseout mouseup', (x) => {
    if (x.currentTarget.matches('.tb_btn')) {
      x.currentTarget.classList.remove('armed');
      x.preventDefault();
    }
  });
  // ed.tb.onmouseup = ed.tb.onmouseout;
  ed.tb.click((x) => {
    const t = x.currentTarget;
    if (t.matches('.tb_btn')) {
      const c = t.className.replace(/^.*\btb_([A-Z]{2,3})\b.*$/, '$1');
      if (ed[c]) ed[c](ed.me);
      else if (D.commands[c]) D.commands[c](ed.me);
      return !1;
    }
    return !0;
  });
  ed.setPendent = $.debounce(100, (x) => ed.dom.classList.toggle('pendent', x));
  ed.setTC(!!ed.tc);
  ed.setLN(D.prf.lineNums());
  ed.firstOpen = true;
};
D.Ed.prototype = {
  getStops() { // returns an array of line numbers
    return [...this.stop].sort((x, y) => x - y);
  },
  updStops() { // update stops from line decorations
    const ed = this;
    const model = ed.me.getModel();
    ed.stop = new Set(model.getAllDecorations()
      .filter((d) => d.options.glyphMarginClassName === 'breakpoint')
      .map((d) => d.range.startLineNumber - 1));
  },
  cursorActivity(e) { // handle "cursor activity" event
    // xline:the line number of the empty line inserted when you press <down> at eof
    const ed = this;
    const { me } = ed;
    const model = me.getModel();
    ed.ide.setCursorPosition(e.position, model.getLineCount());
    if (ed.xline == null) return;
    const n = model.getLineCount();
    const l = e.position.lineNumber;
    const s = model.getLineContent(n);
    if (l === ed.xline && l === n && /^\s*$/.test(s)) return;
    if (l < ed.xline && ed.xline === n && /^\s*$/.test(s)) {
      const t = model.getLineContent(n - 1);
      me.executeEdits('D', [{
        range: new monaco.Range(n - 1, t.length + 1, n, s.length + 1),
        text: '',
      }]);
    }
    delete ed.xline;
  },
  hl() { // highlight - set current line in tracer
    const ed = this;
    const { me } = ed;
    const { line, tbtStart, tbtLen } = ed.HIGHLIGHT || {};
    ed.dom.classList.toggle('tbt', tbtStart > 0);
    if (!line) {
      ed.hlDecorations = [];
    } else {
      if (tbtStart > 0) {
        ed.hlDecorations = [{
          range: new monaco.Range(line, tbtStart, line, tbtStart + tbtLen),
          options: {
            inlineClassName: 'highlighted',
          },
        }];
      } else {
        ed.hlDecorations = [{
          range: new monaco.Range(line, 1, line, 1),
          options: {
            isWholeLine: true,
            className: 'highlighted',
          },
        }];
      }
      me.setPosition({ lineNumber: line, column: 1 });
      me.revealLineInCenter(line);
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
    ed.me.updateOptions({ lineNumbers: D.prf.lineNums() ? ((l) => `[${l - 1}]`) : 'off' });
    ed.dom.querySelector('.tb_LN').classList.toggle('pressed', !!x);
  },
  setTC(x) {
    const ed = this;
    ed.isClosing = 0;
    ed.tc = x;
    ed.tracer.set(x);
    ed.dom.classList.toggle('tracer', !!x);
    ed.HIGHLIGHT = null;
    ed.hl();
    ed.setRO(x);
  },
  setRO(x) {
    const ed = this;
    const ro = ed.isReadOnlyEntity || !!x;
    ed.isReadOnly = ro;
    ed.me.updateOptions({ readOnly: ro });
  },
  setStop() {
    const ed = this;
    const decorateLines = (lines, classname) => (
      [...lines].map((x) => ({
        range: new monaco.Range(x + 1, 1, x + 1, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: classname,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      }))
    );
    ed.stopDecorations = [
      ...decorateLines(ed.monitor, 'monitorpoint'),
      ...decorateLines(ed.stop, 'breakpoint'),
      ...decorateLines(ed.trace, 'tracepoint'),
    ];
    ed.setDecorations();
  },
  setLineAttributes() {
    const ed = this;
    if (ed.tc) {
      D.send('SetLineAttributes', {
        win: ed.id,
        monitor: [...ed.monitor],
        stop: ed.getStops(),
        trace: [...ed.trace],
      });
    }
  },
  setDecorations() {
    const ed = this;
    ed.decorations = ed.me.deltaDecorations(
      ed.decorations,
      [
        {
          range: new monaco.Range(1, 1, 1 + ed.me.getModel().getLineCount(), 1),
          options: {
            isWholeLine: false,
            glyphMarginClassName: 'breakpointarea',
            stickiness: monaco.editor.TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges,
          },
        },
        ...ed.stopDecorations,
        ...ed.hlDecorations,
      ],
    );
  },
  toggleMonitor(l) {
    const ed = this;
    ed.updStops();
    ed.monitor.has(l) ? ed.monitor.delete(l) : ed.monitor.add(l);
    ed.setStop();
    ed.setLineAttributes();
  },
  toggleStop(l) {
    const ed = this;
    ed.updStops();
    ed.stop.has(l) ? ed.stop.delete(l) : ed.stop.add(l);
    ed.setStop();
    ed.setLineAttributes();
  },
  toggleTrace(l) {
    const ed = this;
    ed.updStops();
    ed.trace.has(l) ? ed.trace.delete(l) : ed.trace.add(l);
    ed.setStop();
    ed.setLineAttributes();
  },
  updSize() {
    const ed = this;
    const tb = ed.dom.getElementsByClassName('toolbar')[0];
    ed.me.getDomNode().parentElement.style.top = `${tb.offsetHeight}px`;
  },
  saveScrollPos() { },
  restoreScrollPos() { },
  updateSIStack(x) {
    this.dom.querySelector('.si_stack').innerHTML = x.stack.map((o) => `<option>${o}`).join('');
  },
  stateChanged() {
    const w = this;
    w.updSize();
    w.restoreScrollPos();
  },
  open(ee) { // ee:editable entity
    const ed = this;
    const { me } = ed;
    const model = me.getModel();
    ed.name = ee.name;
    // Check if a filename for a source file is provided.
    // Make sure it isn't duplicated in the existing name.
    if (ee.filename && (ed.name.indexOf(ee.filename) === -1) && D.prf.filenameInTitle()) {
      ed.filename = ee.filename;
    }
    ed.updateTitle();
    model.winid = ed.id;
    ed.hasEmbeddedBreaks = ee.text.some((t) => /[\n\r]/.test(t));
    if (ed.hasEmbeddedBreaks) {
      ed.oText = ee.text.map((t) => t.replace('\n', '␤').replace('\r', '␍')).join(model.getEOL());
    } else {
      ed.oText = ee.text.join(model.getEOL());
    }
    ed.isReadOnlyEntity = !!ee.readOnly || ed.hasEmbeddedBreaks;
    // model.setEOL(monaco.editor.EndOfLineSequence.LF);
    // entityType:            16 NestedArray        512 AplClass
    // 1 DefinedFunction      32 QuadORObject      1024 AplInterface
    // 2 SimpleCharArray      64 NativeFile        2048 AplSession
    // 4 SimpleNumericArray  128 SimpleCharVector  4096 ExternalFunction
    // 8 MixedSimpleArray    256 AplNamespace
    const etype = {
      2: ed.isReadOnlyEntity ? 'chararr' : 'charmat',
      4: 'numarr',
      8: 'mixarr',
      16: ed.isReadOnlyEntity ? 'mixarr' : 'charvecvec',
      32: 'quador',
      64: 'mixarr',
      128: 'charvec',
    }[ee.entityType];
    ed.isCode = [1, 256, 512, 1024, 2048, 4096].indexOf(ee.entityType) >= 0;
    model.setValue(ed.oText);
    if (/(\.|\\|\/)/.test(ee.name)) {
      me.setModel(monaco.editor.createModel(ed.oText, null, monaco.Uri.file(ee.name)));
    } else {
      monaco.editor.setModelLanguage(model, ed.isCode && !ed.isReadOnlyEntity ? 'apl' : 'plaintext');
      ed.dom.classList.remove('charmat', 'chararr', 'numarr', 'mixarr', 'charvecvec', 'quador', 'charvec');
      etype && ed.dom.classList.add(etype);
    }
    me.updateOptions({ folding: ed.isCode && !!D.prf.fold() });
    if (ed.isCode && D.prf.indentOnOpen()) ed.RD(me);
    else ed.firstOpen = false;
    ed.setRO(ee.debugger);
    ed.setBP(ed.breakpoints);
    const line = ee.currentRow;
    let col = ee.currentColumn || 0;
    if (line === 0 && col === 0 && ee.text.length === 1
      && /\s?[a-z|@]+$/.test(ee.text[0])) col = ee.text[0].length;
    me.setPosition({ lineNumber: line + 1, column: col + 1 });
    me.revealLineInCenter(line + 1);
    ed.oStop = (ee.stop || []).slice(0).sort((x, y) => x - y);
    ed.stop = new Set(ed.oStop);
    ed.monitor = new Set(ee.monitor || []);
    ed.trace = new Set(ee.trace || []);
    ed.setStop();
  },
  update(x) {
    const ed = this;
    ed.container && ed.container.setTitle(x.name);
    ed.me_ready.then(() => ed.open(x));
  },
  updateTitle() {
    const ed = this;
    const filename = ed.filename ? ` in ${ed.filename}` : '';
    if (ed.container) {
      ed.container.setTitle(ed.title);
      ed.container.tab.header.parent.trigger('resize');
      if (ed.filename) ed.container.tab.titleElement[0].title = ed.filename;
    }
    const docTitle = `${ed.isModified ? '⬤ ' : ''}${ed.title}${filename} - ${ed.ide.caption}`;
    D.ide.floating && $('title', ed.dom.ownerDocument).text(docTitle);
    ed.container.tab.closeElement.toggleClass('modified', ed.isModified);
  },
  blockCursor(x) { this.me.updateOptions({ cursorStyle: x ? 'block' : 'line' }); },
  cursorBlinking(x) { this.me.updateOptions({ cursorBlinking: x }); },
  hasFocus() { return this.me.hasTextFocus(); },
  focus() {
    const ed = this;
    let q = ed.container;
    let p = q && q.parent;
    const l = q && q.layoutManager;
    const m = l && l._maximisedItem;
    if (m && m !== (p && p.parent)) m.toggleMaximise();
    while (p) {
      p.setActiveContentItem && p.setActiveContentItem(q);
      q = p; p = p.parent;
    } // reveal in golden layout
    if (D.ide.floating) {
      ed.updateTitle();
      D.el.getCurrentWindow().focus();
    }
    window.focused || window.focus();
    ed.me.focus();
    ed.ide.setCursorPosition(ed.me.getPosition(), ed.me.getModel().getLineCount());
  },
  insert(ch) {
    this.isReadOnly || this.me.trigger('editor', 'type', { text: ch });
  },
  saved(err) {
    const ed = this;
    if (err) {
      ed.isClosing = 0;
      $.err('Cannot save changes');
    } else {
      ed.oText = ed.me.getValue();
      ed.isClosing && D.send('CloseWindow', { win: ed.id });
    }
  },
  close() {
    if (D.ide.floating) {
      this.me.getModel().dispose();
      delete D.ide.wins[this.id];
      this.container && this.container.close();
      !D.ide.gl.root.contentItems.length && D.el.getCurrentWindow().hide();
    }
  },
  prompt(x) {
    this.setRO(this.tc || !x);
    this.setPendent(!x);
  },
  die() {
    this.setRO(1);
    this.ide.connected = 0;
    this.ide.dom.classList.add('disconnected');
  },
  getDocument() { return this.dom.ownerDocument; },
  refresh() { },
  autoCloseBrackets(x) { this.me.updateOptions({ autoClosingBrackets: x }); },
  indent(x) { this.me.updateOptions({ autoIndent: x >= 0 }); },
  fold(x) { this.me.updateOptions({ folding: this.isCode && !!x }); },
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
  execCommand(cmd) {
    if (this[cmd]) this[cmd](this.me);
    else if (D.commands[cmd]) D.commands[cmd](this.me);
  },
  zoom(z) {
    const ed = this;
    const { me } = ed;
    const [r] = me.getVisibleRanges();
    const fs = D.zoom2fs[z + 10];
    me.updateOptions({ fontSize: fs, lineHeight: fs + 2 });
    me.revealRangeAtTop(r);
  },
  onClose() {
    const ed = this;
    const { me } = ed;
    const v = me.getValue();
    if (ed.tc || (v === ed.oText && `${ed.getStops()}` === `${ed.oStop}`)) {
      ed.EP(me);
    } else {
      setTimeout(() => {
        window.focus();
        D.util.optionsDialog({
          title: 'Save?',
          options: ['Yes', 'No', 'Cancel'],
          text: `The object "${ed.name}" has changed.\nDo you want to save the changes?`,
        }, (r) => {
          if (r === 0) ed.EP(me);
          else if (r === 1) ed.QT(me);
          else ed.focus();
        });
      }, 10);
    }
  },
  ReplyFormatCode(lines) {
    const ed = this;
    const { me } = ed;
    const model = me.getModel();
    const u = me.getPosition();
    const txt = lines.join(model.getEOL());
    ed.saveScrollPos();
    me.setValue(txt);
    // model.setEOL(monaco.editor.EndOfLineSequence.LF);
    ed.setStop();
    if (ed.tc) {
      ed.hl();
      u.lineNumber = ed.HIGHLIGHT.line;
    }
    if (ed.firstOpen) {
      if (lines.length === 1 && /\s?[a-z|@]+$/.test(lines[0])) u.column = model.getLineContent(u.lineNumber).length + 1;
      else if (lines[0][0] === ':') u.column = 1;
      else u.column = 2;
      ed.firstOpen = false;
      ed.oText = txt;
    }
    ed.restoreScrollPos();
    me.setPosition(u);
  },
  SetHighlightLine(line, hadErr, tbtStart, tbtLen) {
    const ed = this;
    ed.HIGHLIGHT = { line, tbtStart, tbtLen };
    ed.me_ready.then(() => ed.hl(line + 1, tbtStart + 1, tbtLen));
    hadErr < 0 && ed.focus();
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
  ED(me, inEmptySpace) {
    this.addJump();
    const c = me.getPosition();
    const model = me.getModel();
    const text = model.getLineContent(c.lineNumber);
    const pos = inEmptySpace ? text.length + 1 : D.util.ucLength(text.slice(0, c.column - 1));
    D.ide.Edit({ win: this.id, pos, text });
  },
  QT() { D.send('CloseWindow', { win: this.id }); },
  BK(me) { this.tc ? D.send('TraceBackward', { win: this.id }) : me.trigger('D', 'undo'); },
  FD(me) { this.tc ? D.send('TraceForward', { win: this.id }) : me.trigger('D', 'redo'); },
  STL(me) {
    if (!this.tc) return;
    let steps = me.getPosition().lineNumber - this.HIGHLIGHT.line;
    const cmd = steps > 0 ? 'TraceForward' : 'TraceBackward';
    steps = Math.abs(steps);
    for (let i = 0; i < steps; i++) { D.send(cmd, { win: this.id }); }
  },
  CLS() { this.onClose(); },
  EP(me) { this.isClosing = 1; this.FX(me); },
  FX(me) {
    const ed = this;
    const v = me.getValue();
    ed.updStops();
    const stop = ed.getStops();
    ed.isModified = false;
    ed.updateTitle();
    if (ed.tc || (v === ed.oText && `${stop}` === `${ed.oStop}`)) { // if tracer or unchanged
      ed.isClosing && D.send('CloseWindow', { win: ed.id });
      return;
    }
    D.send('SaveChanges', {
      win: ed.id,
      text: v.split(me.getModel().getEOL()),
      monitor: [...ed.monitor],
      stop,
      trace: [...ed.trace],
    });
  },
  TL(me) { // toggle localisation
    const name = D.ide.cword(me);
    const model = me.getModel();
    const getState = (l) => model._tokenization._tokenizationStateStore._beginState[l];
    if (!name) return;
    const l0 = me.getPosition().lineNumber;
    const ta = getState(l0 - 1).a.map((x) => x.t);
    const ti = ta.lastIndexOf('∇');
    const ts = ta.filter((t) => /^(∇|\{|namespace|class|interface)$/.test(t));
    if (ts.includes('{') || (ts.length && !ts.includes('∇'))) return;
    let l;
    for (l = l0 - 1; l >= 0; l--) {
      if (getState(l).a.length === ti) break;
    }
    if (l < 0) l = 0;
    const lt = model.getLineContent(l + 1);
    const [, s, com] = lt.match(/^(.*?)(\s*⍝.*)?$/);
    const a = s.split(';');
    const head = a[0].replace(/\s+$/, '');
    let tail = a.length > 1 ? a.slice(1) : [];
    tail = tail.map((x) => x.replace(/\s+/g, ''));
    const i = tail.indexOf(name); i < 0 ? tail.push(name) : tail.splice(i, 1);
    const text = [head].concat(tail.sort()).join(';') + (com || '');
    me.executeEdits('D', [{ range: new monaco.Range(l + 1, 1, l + 1, lt.length + 1), text }]);
  },
  LN() { D.prf.lineNums.toggle(); },
  TVO() { D.prf.fold.toggle(); },
  TVB() { D.prf.breakPts.toggle(); },
  TC() { D.send('StepInto', { win: this.id }); D.ide.getStats(); },
  TP() { D.send('TraceToken', { win: this.id }); D.ide.getStats(); },
  AC(me) { // align comments
    const ed = this;
    const model = me.getModel();
    if (ed.isReadOnly) return;
    const ll = model.getLineCount();
    const o = me.getSelections(); // o:original selections
    const sels = o.length === 1 && o[0].isEmpty()
      ? [new monaco.Selection(1, 1, ll, model.getLineContent(ll).length + 1)] : o;

    const a = sels.map((sel) => { // a:info about individual selections
      const p = sel.getStartPosition();
      const q = sel.getEndPosition();
      const l = model.getValueInRange({
        startLineNumber: p.lineNumber,
        startColumn: 0,
        endLineNumber: q.lineNumber,
        endColumn: q.column,
      }, monaco.editor.EndOfLinePreference.LF).split('\n'); //  l:lines
      const u = l.map((x) => x.replace(/'[^']*'?/g, (y) => ' '.repeat(y.length))); // u:scrubbed strings
      const c = u.map((x) => x.indexOf('⍝')); // c:column index of ⍝
      return {
        p, q, l, u, c,
      };
    });
    const m = Math.max(...a.map((sel) => Math.max(...sel.c)));
    const edits = a.map((sel) => {
      const r = sel.l.map((x, i) => {
        const ci = sel.c[i];
        return ci < 0 ? x : x.slice(0, ci) + ' '.repeat(m - ci) + x.slice(ci);
      });
      r[0] = r[0].slice(sel.p.column - 1);
      return {
        range: new monaco.Range(sel.p.lineNumber, sel.p.column, sel.q.lineNumber, sel.q.column),
        text: r.join(model.getEOL()),
      };
    });
    me.executeEdits('D', edits, o);
  },
  ER(me) {
    if (this.tc) {
      D.send('RunCurrentLine', { win: this.id });
      D.ide.getStats();
    } else {
      me.trigger('editor', 'type', { text: '\n' });
    }
  },
  BH() { D.send('ContinueTrace', { win: this.id }); },
  RM() { D.send('Continue', { win: this.id }); },
  MA() { D.send('RestartThreads', {}); },
  CBP() { // Clear stops for this object
    const ed = this;
    ed.stop.clear();
    ed.setStop();
    ed.setLineAttributes();
  },
  BP(me) { // toggle breakpoint
    const ed = this;
    ed.updStops();
    const t = ed.stop.has(me.getSelection().positionLineNumber - 1);
    me.getSelections().forEach((s) => {
      let p = { l: s.selectionStartLineNumber - 1, c: s.selectionStartColumn - 1 };
      let q = { l: s.positionLineNumber - 1, c: s.positionColumn - 1 };
      if (p.l > q.l) { const h = p; p = q; q = h; }
      const l1 = q.l - (p.l < q.l && q.c === 1);
      for (let { l } = p; l <= l1; l++) {
        t ? ed.stop.delete(l) : ed.stop.add(l);
      }
    });
    ed.setStop();
    ed.setLineAttributes();
  },
  RD(me) {
    const ed = this;
    if (D.prf.ilf()) {
      const text = me.getModel().getLinesContent();
      D.send('FormatCode', { win: this.id, text });
    } else if (me.getSelection().isEmpty()) {
      me.trigger('editor', 'editor.action.formatDocument');
      ed.firstOpen && setTimeout(() => {
        ed.oText = me.getValue();
        ed.firstOpen = false;
      }, 10);
    } else {
      me.trigger('editor', 'editor.action.formatSelection');
    }
  },
  VAL(me) {
    const a = me.getSelections();
    if (a.length !== 1 || monaco.Selection.spansMultipleLines(a[0])) return;
    const s = a[0].isEmpty() ? D.ide.cword(me) : me.getModel().getValueInRange(a[0]);
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

    const c = me.getPosition();
    const ci = c.column - 1;
    if (sels.length === 1 && sels[0].startLineNumber !== sels[0].endLineNumber) {
      me.trigger('editor', 'editor.action.indentLines');
    } else if (D.prf.autocompletion() === 'off') {
      let i = D.prf.indent();
      i = i > 0 ? i : 4;
      me.trigger('editor', 'type', { text: ' '.repeat(i - (ci % i)) });
    } else {
      me.tabComplete += 1;
      me.trigger('editor', 'editor.action.triggerSuggest');
    }
  },
  DC() {
    const { me } = this;
    const model = me.getModel();
    const l = me.getPosition().lineNumber;
    if (l < model.getLineCount() || /^\s*$/.test(model.getLineContent(l))) {
      me.trigger('editor', 'cursorDown');
    } else {
      me.trigger('editor', 'editor.action.insertLineAfter');
      this.xline = l + 1;
    }
  },
  UC() { this.me.trigger('editor', 'cursorUp'); },
  LC() { this.me.trigger('editor', 'cursorLeft'); },
  RC() { this.me.trigger('editor', 'cursorRight'); },
  TO() { this.me.trigger('editor', 'editor.fold'); }, // (editor.unfold) is there a toggle?
};
