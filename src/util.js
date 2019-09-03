{
// a kitchen sink for small generic functions and jQuery plugins
  const dlgCb = {}; // dialog callbacks
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
      I.dlg_modal_overlay.hidden = !o.modal;
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
        if (e.target.className === 'dlg_close') {
          d.hidden = 1;
          I.dlg_modal_overlay.hidden = 1;
          return !1;
        }
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
    fmtKey(x) {
      return [
        x.ctrlKey ? 'Ctrl-' : '',
        x.altKey ? 'Alt-' : '',
        x.shiftKey ? 'Shift-' : '',
        x.metaKey ? 'Cmd-' : '',
        x.key || '',
      ].join('');
    },
    ucLength(s) {
      return window.punycode.ucs2.decode(s).length;
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
    optionsDialog(x, f) {
      let text = typeof x.text === 'string' ? x.text : x.text.join('\n');
      if (D.el) {
        const { bwId } = D.ide.focusedWin;
        const bw = bwId ? D.el.BrowserWindow.fromId(bwId) : D.elw;
        const r = D.el.dialog.showMessageBoxSync(bw, {
          message: text,
          title: x.title || '',
          buttons: x.options || [''],
          cancelId: -1,
          type: ['warning', 'info', 'question', 'error'][x.type - 1],
        });
        f(r);
      } else {
        text = text.replace(/\r?\n/g, '<br>');
        I.gd_title_text.textContent = x.title || '';
        I.gd_content.innerHTML = text;
        I.gd_icon.style.display = 'none';
        // I.gd_icon.className = `dlg_icon_${['warn', 'info', 'query', 'error'][x.type - 1]}`;
        I.gd_btns.innerHTML = (x.options || []).map(y => `<button>${D.util.esc(y)}</button>`).join('');
        const b = I.gd_btns.querySelector('button');
        const ret = (r) => {
          I.gd_btns.onclick = null;
          I.gd_close.onclick = null;
          I.gd.hidden = 1;
          I.dlg_modal_overlay.hidden = 1;
          f(r);
          D.ide.focusedWin.focus();
        };
        I.gd_close.onclick = () => ret(-1);
        I.gd_btns.onclick = (e) => {
          if (e.target.nodeName === 'BUTTON') {
            let i = -1;
            let t = e.target;
            while (t) { t = t.previousSibling; i += 1; }
            ret(i);
          }
        };
        D.util.dlg(I.gd, { w: 400, modal: true });
        setTimeout(() => { b.focus(); }, 1);
      }
    },
    stringDialog(x, f) {
      if (D.dlg_bw) {
        dlgCb[x.token] = f;
        D.ipc.server.emit(D.dlg_bw.socket, 'show', x);
        const bw = D.el.BrowserWindow.fromId(D.dlg_bw.id);
        bw.show();
        return;
      }
      const value = x.defaultValue || null;
      I.gd_title_text.textContent = x.title || '';
      I.gd_content.innerText = x.text || '';
      I.gd_icon.style.display = 'none';
      I.gd_content.insertAdjacentHTML('beforeend', '<br><input>');
      const inp = I.gd_content.querySelector('input');
      inp.value = x.initialValue || '';
      I.gd_btns.innerHTML = '<button>OK</button><button>Cancel</button>';
      const lb = I.gd_btns.children[1];
      const ret = (r) => {
        I.gd_btns.onclick = null;
        I.gd_close.onclick = null;
        I.gd.hidden = 1;
        I.dlg_modal_overlay.hidden = 1;
        f(r);
        D.ide.focusedWin.focus();
      };
      I.gd_close.onclick = () => { ret(value); };
      I.gd_btns.onclick = (e) => {
        if (e.target.nodeName === 'BUTTON') {
          ret(e.target.previousSibling ? value : inp.value);
        }
      };
      inp.onkeydown = (e) => {
        if (e.which === 13) {
          e.preventDefault();
          ret(inp.value);
        } else if (e.which === 27) {
          e.preventDefault();
          ret(value);
        } else if ((e.which === 9 && e.shiftKey)) {
          e.preventDefault();
          lb.focus();
        }
      };
      lb.onkeydown = (e) => {
        if ((e.which === 9 && !e.shiftKey)) {
          e.preventDefault();
          inp.focus();
        }
      };
      D.util.dlg(I.gd, { w: 400, h: 250, modal: true });
      setTimeout(() => { inp.focus(); }, 1);
    },
    replyDialog(t, r) {
      const f = dlgCb[t];
      if (f) {
        f(r);
        delete dlgCb[t];
      }
    },
    taskDialog(x, f) {
      if (D.el && D.win) {
        const { bwId } = D.ide.focusedWin;
        const bw = bwId ? D.el.BrowserWindow.fromId(bwId) : D.elw;
        const r = D.el.dialog.showMessageBoxSync(bw, {
          message: `${x.text}\n${x.subtext}`,
          title: x.title || '',
          buttons: x.options.concat(x.buttonText) || [''],
          type: 'question',
        });
        const index = r < x.options.length ? r : 100 + (r - x.options.length);
        f(index);
        return;
      } else if (D.dlg_bw) {
        dlgCb[x.token] = f;
        D.ipc.server.emit(D.dlg_bw.socket, 'show', x);
        const bw = D.el.BrowserWindow.fromId(D.dlg_bw.id);
        bw.show();
        return;
      }
      const { esc } = D.util;
      I.gd_title_text.textContent = x.title || 'Task';
      I.gd_icon.style.display = 'none';
      I.gd_content.innerHTML = esc(x.text || '') + (x.subtext ? `<div class=task_subtext>${esc(x.subtext)}</div>` : '');
      let content = (x.buttonText || []).map((y) => {
        const [caption, ...details] = esc(y).split('\n');
        return '<button class=task><div class="btn_icon"><span class="fas fa-chevron-circle-right"></span></div>' +
          `${caption}<br><div class="task_detail">${details.join('<br>')}</div></button>`;
      }).join('');
      content += (x.footer ? `<div class=task_footer>${esc(x.footer)}</div>` : '');
      I.gd_btns.innerHTML = content;
      const ret = (r) => {
        I.gd_btns.onclick = null;
        I.gd_close.onclick = null;
        I.gd.hidden = 1;
        I.dlg_modal_overlay.hidden = 1;
        f(r);
        D.ide.focusedWin.focus();
      };
      const btns = $(I.gd_btns).find('button');
      const fb = btns.first();
      const lb = btns.last();
      lb.on('keydown', (e) => {
        if ((e.which === 9 && !e.shiftKey)) {
          e.preventDefault();
          fb.focus();
        }
      });
      fb.on('keydown', (e) => {
        if ((e.which === 9 && e.shiftKey)) {
          e.preventDefault();
          lb.focus();
        }
      });
      I.gd_close.onclick = () => { ret(-1); };
      btns.on('click', (e) => {
        let t = e.currentTarget;
        let i = 99;
        while (t) { t = t.previousSibling; i += 1; }
        ret(i);
      });
      D.util.dlg(I.gd, { w: 400, h: 300, modal: true });
      setTimeout(() => { fb.focus(); }, 1);
    },
  };
  $.alert = (m, t, f) => { // m:message,t:title,f:callback
    D.el ? D.el.dialog.showMessageBoxSync(D.elw, { message: m, title: t, buttons: ['OK'] }) : alert(m);
    f && f();
  };
  $.err = (m, t, f) => {
    if (typeof t === 'function') { f = t; t = ''; }
    t = t || 'Error';
    D.el ? D.el.dialog.showMessageBoxSync(
      D.el.getCurrentWindow(),
      { type: 'error', message: m, title: t, buttons: ['OK'] },
    ) : alert(m);
    f && f();
  };
  $.confirm = (m, t, f) => {
    f(D.el ? 1 - D.el.dialog.showMessageBoxSync(D.elw, {
      message: m, title: t, type: 'question', buttons: ['Yes', 'No'], cancelId: 1,
    }) : +confirm(m));
  };
}
