// a kitchen sink for small generic functions and jQuery plugins
'use strict'
let zCtr = 100; // css z-index counter
D.util = {
  dict(x) {
    const r = {};
    for (let i = 0; i < x.length; i++) r[x[i][0]] = x[i][1];
    return r;
  }, // dictionary from key-value pairs
  ESC: { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' },
  esc(s) { return s.replace(/[<>&'"]/g, x => D.util.ESC[x]); },
  dlg(d, opts) {
    let o = opts || {}; // .dlg(d) shows an element d in a movable dom-only dialog
    d.style.zIndex = zCtr++;
    d.hidden = 0;
    d.style.left = `${(0 | (innerWidth - (o.w || d.clientWidth )) / 2)}px`;
    if (o.w) d.style.width = `${o.w}px`;
    d.style.top = `${(0 | (innerHeight - (o.h || d.clientHeight)) / 2)}px`;
    if (o.h) d.style.height = `${o.h}px`;
    if (d.__dlg) return;
    d.__dlg = 1;
    const closeButton = d.querySelector('.dlg_close');
    if (closeButton) {
      $(d).on('keydown', (e) => {
        if (e.which === 27 && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
          closeButton.click();
          return !1;
        }
        return !0;
      });
    }
    o = null;
    d.onmousedown = () => { d.style.zIndex = zCtr++; };
    d.onclick = (e) => {
      if (e.target.className === 'dlg_close') { d.hidden = 1; return !1; }
      return !0;
    };
    const t = d.querySelector('.dlg_title');
    if (t) {
      let dx;
      let dy; // dx,dy:dialog position corrected for mouse
      const move = (e) => {
        d.style.left = `${dx + e.clientX}px`;
        d.style.top = `${dy + e.clientY}px`;
        e.preventDefault();
        return !1;
      };
      t.onmousedown = (e) => {
        if (e.target.closest('.dlg_no_drag')) return !0;
        dx = d.offsetLeft - e.clientX;
        dy = d.offsetTop - e.clientY;
        t.style.cursor = 'move';
        $(document).on('mousemove', move);
        e.preventDefault();
        return !1;
      };
      t.onmouseup = () => {
        $(document).off('mousemove', move);
        t.style.cursor = '';
      };
    }
  },
  ucLength(s) {
    return nodeRequire('punycode').ucs2.decode(s).length;
  },
  elastic(inp) { // make an <input> stretch when you type long text in it
    let m = inp.dataset.minSize;
    if (!m) {
      const f = () => { D.util.elastic(inp); };
      $(inp).on('keyup keypress change', f);
      m = +inp.size || 1;
      inp.dataset.minSize = m;
    }
    inp.size = Math.max(m, inp.value.length + 1);
  },
  insert(x, y) { // replace selection in an <input> or <textarea> x with the string y
    if (!x || (x.nodeName !== 'INPUT' && x.nodeName !== 'TEXTAREA') || x.readOnly || x.disabled) return;
    const i = x.selectionStart;
    const j = x.selectionEnd;
    const v = x.value;
    if (i != null && j != null) {
      x.value = v.slice(0, i) + y + v.slice(j);
      const d = i + y.length;
      x.selectionStart = d;
      x.selectionEnd = d;
    }
  },
};
$.alert = (m, t, f) => { // m:message,t:title,f:callback
  D.el ? D.el.dialog.showMessageBox(D.elw, { message: m, title: t, buttons: ['OK'] }) : alert(m);
  f && f();
};
$.err = (m, t, f) => {
  if (typeof t === 'function') { f = t; t = ''; }
  t = t || 'Error';
  D.el ? D.el.dialog.showMessageBox(D.elw, { type: 'error', message: m, title: t, buttons: ['OK'] }) : alert(m);
  f && f();
};
$.confirm = (m, t, f) => {
  f(D.el ? 1 - D.el.dialog.showMessageBox(D.elw, { message: m, title: t, type: 'question', buttons: ['Yes', 'No'], cancelId: 1 })
    : +confirm(m));
};
