{
// Preferences > Shortcuts

  let q; // DOM elements whose ids start with "shc_", keyed by the rest of the id
  const updDups = () => { // check for duplicates and make them show in red
    const a = q.tbl_wr.querySelectorAll('.shc_text');
    const h = {}; // h:maps keystrokes to jQuery objects
    [...a].forEach((k) => {
      const t = k.title;
      k.classList.toggle('shc_dup', !!h[t]) && h[t].classList.add('shc_dup');
      h[t] = k;
    });
  };
  const keyLabels = {
    Ctrl: '⌃',
    Shift: '⇧',
    Option: '⌥',
    Cmd: '⌘',
  };
  const getKeystroke = (b, f) => { // b:"+" button,f:callback
    const e = document.createElement('div');
    e.className = 'shc_editor';
    let r; // r:result
    let me;
    const meta = new Set(['Shift', 'Alt', 'Ctrl', 'Cmd', 'Meta', 'Win']);
    const close = () => { me.dispose(); e.parentNode.removeChild(e); f(r); };
    const upd = (x) => { // update displayed text for new keystroke as you hold down/release keys
      const kn = monaco.KeyCode[x.keyCode];
      const be = x.browserEvent;
      const isMeta = meta.has(kn);
      const s = [
        be.ctrlKey ? 'Ctrl' : '',
        be.shiftKey && (be.type === 'keydown' || be.which) ? 'Shift' : '',
        // eslint-disable-next-line no-nested-ternary
        be.altKey ? (D.mac ? 'Option' : 'Alt') : '',
        // eslint-disable-next-line no-nested-ternary
        be.metaKey ? (D.mac ? 'Cmd' : (D.win ? 'Win' : 'Meta')) : '',
        isMeta ? '' : D.keyMap.labels[kn],
      ].filter((k) => k).join('+');
      me.setValue(s || 'Press keystroke...');
      if (!isMeta) {
        r = (x.keyCode === monaco.KeyCode.KEY_IN_COMPOSITION || !D.keyMap.labels[kn]) ? '' : s;
        close();
      }
      x.preventDefault(); x.stopPropagation(); return !1;
    };
    me = monaco.editor.create(e, {
      acceptSuggestionOnCommitCharacter: false,
      acceptSuggestionOnEnter: 'off',
      autoClosingBrackets: false,
      automaticLayout: true,
      autoIndent: false,
      contextmenu: false,
      cursorStyle: D.prf.blockCursor() ? 'block' : 'line',
      cursorBlinking: D.prf.cursorBlinking(),
      folding: false,
      fontFamily: 'apl',
      fontSize: 16,
      glyphMargin: false,
      lineNumbers: 'off',
      matchBrackets: false,
      minimap: { enabled: false },
      mouseWheelZoom: false,
      renderIndentGuides: false,
      renderLineHighlight: 'none',
      scrollbar: { horizontal: 'hidden', vertical: 'hidden' },
      suggestOnTriggerCharacters: false,
      wordBasedSuggestions: false,
      value: 'Press keystroke...',
    });
    me.onKeyDown(upd); me.onKeyUp(upd);
    me.onDidBlurEditorText(close);
    b.parentNode.insertBefore(e, b);
    me.focus();
  };
  const keyHTML = (x) => {
    const keys = x.replace(/[+-](.)/g, '\n$1').split('\n');
    const btns = keys.map((k) => {
      let lbl = k;
      if (D.mac) lbl = keyLabels[k] || k;
      else if (k === 'Cmd') lbl = D.win ? 'Win' : 'Meta';
      return `<div class=shc_key_btn>${lbl}</div>`;
    }).join('+');
    const lbls = keys.map((k) => {
      let lbl = k;
      if (k === 'Cmd' && !D.mac) lbl = D.win ? 'Win' : 'Meta';
      else if (k === 'Alt' && D.mac) lbl = 'Option';
      return lbl;
    }).join('+');
    return `<span class=shc_key><span class=shc_text title="${lbls}">${btns}</span>`
      + '<a href=# class=shc_del title="Remove shortcut">×</a></span> ';
  };
  const updSC = () => {
    const a = q.tbl_wr.querySelectorAll('tr');
    const s = q.sc.value.toLowerCase();
    let empty = 1;
    q.sc_clr.hidden = !s;
    for (let i = 0; i < a.length; i++) {
      let h = [...a[i].childNodes].map((n) => n.textContent).join(' ').toLowerCase().indexOf(s) < 0
        && !a[i].querySelectorAll('.shc_dup').length;
      if (q.defined.checked) {
        const v = a[i].querySelector('.shc_val');
        h = h || !a[i].querySelectorAll('.shc_key').length || (v && !v.value);
      }
      a[i].hidden = h;
      empty = empty && h;
    }
    q.no_res.hidden = !empty;
  };
  const loadFrom = (h) => {
    let html = '<table>';
    const { cmds } = D;
    const pfKey = (c) => `<input class=shc_val id=shc_val_${c}`
      + ' placeholder="(<CMD>|text)*"'
      + ' title="Sequence of commands (command code in angle brackets) to execute and/or text to type">';
    for (let i = 0; i < cmds.length; i++) {
      const x = cmds[i];
      const [c, s, d] = x; // c:code,s:description,d:default
      html += `<tr data-code=${c}>`
        + `<td class=shc_code>${c}`
        // pfkeys show an <input> for the commands mapped to them
        + `<td>${s || pfKey(c)}`
        + `<td id=shc_itm_${c}>${(h[c] || d).map(keyHTML).join('')}`
        + '<button class=shc_add title="Add shortcut"><span class="fas fa-plus"></span></button>'
        + `<td><button class=shc_rst title="Reset &quot;${c}&quot; to its defaults"><span class="fas fa-undo-alt"></span></button>`;
    }
    q.tbl_wr.innerHTML = `${html}</table>`;
    const a = D.prf.pfkeys();
    for (let i = 1; i <= 48; i++) document.getElementById(`shc_val_PF${i}`).value = a[i] || '';
    updDups();
    if (q.sc.value || q.defined.checked) { q.sc.value = ''; updSC(); }
  };
  const updKeys = (x) => {
    const h = {};
    D.keyMap.dyalog = h;
    for (let i = 0; i < D.cmds.length; i++) {
      const [c,, d] = D.cmds[i];
      const ks = x[c] || d;
      if ((ks.length === 0) && (h[d] === c)) {
        delete h[d];
      } else {
        for (let j = 0; j < ks.length; j++) {
          h[ks[j]] = c;
        }
      }
    }
  };
  D.prf.keys(updKeys);
  D.keyMap.dyalog = {}; // temporarily set keyMap.dyalog to something
  // wait until D.db is initialised in init.js, then set the real keymap
  setTimeout(() => { updKeys(D.prf.keys()); }, 1);

  D.prf_tabs.shc = {
    name: 'Shortcuts',
    init(t) {
      q = J.shc;
      t.onmouseover = (e) => {
        const u = e.target.closest('.shc_del');
        if (u) u.parentNode.className += ' shc_del_hvr';
      };
      t.onmouseout = (e) => {
        const u = e.target.closest('.shc_del');
        const p = u && u.parentNode;
        if (p) p.className = p.className.replace(/(^|\s+)shc_del_hvr($|\s+)/, ' ');
      };
      t.onclick = (e) => {
        let u = e.target.closest('.shc_del');
        let p = u && u.parentNode; // the [x] button next to a keystroke
        if (p) { p.parentNode.removeChild(p); updDups(); return !1; }
        u = e.target.closest('.shc_add');
        p = u && u.parentNode; // the [+] button
        if (p) { getKeystroke(u, (k) => { k && u.insertAdjacentHTML('beforebegin', keyHTML(k)); updDups(); }); return !1; }
        u = e.target.closest('.shc_rst');
        p = u && u.parentNode; // the [↶] button ("reset")
        if (p) {
          const tr = u.closest('tr');
          const c = tr.dataset.code;
          for (let i = 0; i < D.cmds.length; i++) {
            if (D.cmds[i][0] === c) {
              const a = tr.getElementsByClassName('shc_key');
              for (let j = a.length - 1; j >= 0; j--) a[j].parentNode.removeChild(a[j]);
              tr.querySelector('.shc_add').insertAdjacentHTML('beforebegin', D.cmds[i][2].map(keyHTML).join(''));
              updDups();
            }
          }
          return !1;
        }
        return true;
      };
      q.rst_all.onclick = () => { loadFrom({}); return !1; };
      q.sc.onkeyup = updSC; q.sc.onchange = updSC;
      q.sc_clr.onclick = () => { // [x] button to clear search
        q.sc_clr.hidden = 1;
        q.sc.value = '';
        updSC();
        q.sc.focus();
        return !1;
      };
      q.defined.onchange = updSC;
    },
    load() { loadFrom(D.prf.keys()); },
    validate() {
      const dup = q.tbl_wr.getElementsByClassName('shc_dup');
      if (dup.length) {
        dup[0].scrollIntoViewIfNeeded();
        return { msg: 'Duplicate shortcuts', el: dup[0] };
      }
      return null;
    },
    print() {
      D.el.getCurrentWindow().webContents.print({ printBackground: true });
    },
    save() {
      const h = {};
      const { cmds } = D;
      let a = $('[id^=shc_itm_]'); // a=q.tbl_wr.querySelectorAll('.shc_text')
      for (let i = 0; i < a.length; i++) {
        const cmdName = a[i].id.replace(/^shc_itm_/, '');
        let shortcuts = a[i].querySelectorAll('[class^=shc_text]');
        const keys = [];
        if (shortcuts.length) {
          shortcuts = shortcuts.forEach((e) => { keys.push(e.title); });
        }
        h[cmdName] = keys;
      }
      for (let i = 0; i < cmds.length; i++) {
        const c = cmds[i][0];
        const d = cmds[i][2].slice(0).sort(); // d:defaults
        if (h[c] && JSON.stringify(h[c].sort()) === JSON.stringify(d)) delete h[c];
      }
      a = [''];
      for (let i = 1; i <= 48; i++) { a.push(document.getElementById(`shc_val_PF${i}`).value); }
      D.prf.keys(h); D.prf.pfkeys(a);
    },
    activate() { q.sc.focus(); },
  };
}
