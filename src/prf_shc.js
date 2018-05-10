{
// Preferences > Shortcuts

  let q; // DOM elements whose ids start with "shc_", keyed by the rest of the id
  function updDups() { // check for duplicates and make them show in red
    const a = q.tbl_wr.querySelectorAll('.shc_text');
    const h = {}; // h:maps keystrokes to jQuery objects
    for (let i = 0; i < a.length; i++) {
      const k = a[i].textContent;
      a[i].className = h[k] ? (h[k].className = 'shc_text shc_dup') : 'shc_text';
      h[k] = a[i];
    }
  }
  function getKeystroke(b, f) { // b:"+" button,f:callback
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
      const s = (be.shiftKey && (be.type === 'keydown' || be.which) ? 'Shift-' : '') +
              (be.ctrlKey ? 'Ctrl-' : '') + (be.altKey ? 'Alt-' : '') + (be.metaKey ? 'Cmd-' : '') +
              (isMeta ? '' : D.keyMap.labels[kn]);
      me.setValue(s || 'Press keystroke...');
      if (!isMeta) { r = s; close(); }
      x.preventDefault(); x.stopPropagation(); return !1;
    };
    me = monaco.editor.create(e, {
      acceptSuggestionOnCommitCharacter: false,
      acceptSuggestionOnEnter: 'off',
      autoClosingBrackets: false,
      automaticLayout: true,
      autoIndent: false,
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
    me.onDidBlurEditor(close);
    b.parentNode.insertBefore(e, b);
    me.focus();
  }
  function keyHTML(x) {
    return `<span class=shc_key><span class=shc_text>${x}</span>` +
            '<a href=# class=shc_del title="Remove shortcut">×</a></span> ';
  }
  function updSC() {
    const a = q.tbl_wr.querySelectorAll('tr');
    const s = q.sc.value.toLowerCase();
    let empty = 1;
    q.sc_clr.hidden = !s;
    for (let i = 0; i < a.length; i++) {
      const h = [...a[i].childNodes].map(n => n.textContent).join(' ').toLowerCase().indexOf(s) < 0
        && !a[i].querySelectorAll('.shc_dup').length;
      a[i].hidden = h;
      empty = empty && h;
    }
    q.no_res.hidden = !empty;
  }
  function loadFrom(h) {
    let html = '<table>';
    const { cmds } = D;
    for (let i = 0; i < cmds.length; i++) {
      const x = cmds[i];
      const [c, s, d] = x; // c:code,s:description,d:default
      html += `<tr data-code=${c}>` +
        `<td class=shc_code>${c}` +
        `<td>${s || `<input class=shc_val id=shc_val_${c}>`}` + // pfkeys show an <input> for the commands mapped to them
        `<td id=shc_itm_${c}>${(h[c] || d).map(keyHTML).join('')}` +
        // '<button class=shc_add title="Add shortcut">+</button>' +
        '<button class=shc_add title="Add shortcut"><span class="fas fa-plus"></span></button>' +
        // `<td><button class=shc_rst title="Reset &quot;${c}&quot; to its defaults">↶</button>`;
        `<td><button class=shc_rst title="Reset &quot;${c}&quot; to its defaults"><span class="fas fa-undo-alt"></span></button>`;
    }
    q.tbl_wr.innerHTML = `${html}</table>`;
    updDups();
    if (q.sc.value) { q.sc.value = ''; updSC(); }
    const a = D.prf.pfkeys();
    for (let i = 1; i <= 12; i++) document.getElementById(`shc_val_PF${i}`).value = a[i];
  }
  function updKeys(x) {
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
  }
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
    },
    load() { loadFrom(D.prf.keys()); },
    validate() {
      const a = q.tbl_wr.getElementsByClassName('shc_dup');
      if (a.length) return { msg: 'Duplicate shortcuts', el: a[0] };
      return null;
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
          shortcuts = shortcuts.forEach((e) => { keys.push(e.innerHTML); });
        }
        h[cmdName] = keys;
      }
      for (let i = 0; i < cmds.length; i++) {
        const c = cmds[i][0];
        const d = cmds[i][2].slice(0).sort(); // d:defaults
        if (h[c] && JSON.stringify(h[c].sort()) === JSON.stringify(d)) delete h[c];
      }
      a = [''];
      for (let i = 1; i <= 12; i++) { a.push(document.getElementById(`shc_val_PF${i}`).value); }
      D.prf.keys(h); D.prf.pfkeys(a);
    },
    activate() { q.sc.focus(); },
  };
}
