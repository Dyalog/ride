(function prfUI() {'use strict'

// This file implements the Preferences dialog as a whole.
// Individual tabs are in separate files: prf_*.js
// Tab implementations can export the following properties:
//  name       tab title
//  id         a string used to construct DOM ids, CSS classes, etc
//  init()     called only once, before Preferences is opened for the first time
//  load()     called every time Preferences is opened
//  validate() should return a falsey value on success or a {msg,el} object on failure
//  save()     called when OK or Apply is pressed
//  resize()   called when the Preferences dialog is resized or the tab is selected
//  activate() called when the tab is selected ("activated")
//
// Before any attempt to call save(), all tabs' validate() methods are tested.
// If any of them returns a falsey value, save() is aborted.
  const tabs = {}; // tab implementations self-register here
  D.prf_tabs = tabs;

  let d; // DOM element for the dialog, lazily initialized
  function apply() { // returns 0 on failure and 1 on success
    let v;
    const k = Object.keys(tabs);
    const focusEl = w => () => {
      $.err(w.msg, w.el ? () => { w.el.focus(); } : null);
    };
    for (let i = 0; i < k.length; i++) {
      const t = tabs[k[i]];
      if ((v = t.validate && t.validate())) {
        setTimeout(focusEl(v), 1);
        return 0;
      }
    }
    k.forEach((i) => { tabs[i].save(); });
    return 1;
  }
  function cancel() {
    if (D.el) {
      D.ipc.of.ride_master.emit('prfClose');
    } else {
      d.hidden = 1; D.ide.wins[0].focus();
    }
  }
  function ok() { apply() && cancel(); }
  D.prf_ui = function PrfUI() {
    if (D.prf_bw) {
      D.ipc.server.emit(D.prf_bw.socket, 'show');
      const bw = D.el.BrowserWindow.fromId(D.prf_bw.id);
      bw.show();
      bw.setAlwaysOnTop(true);
      return !1;
    } else if (D.ide && D.ide.floating) {
      D.ipc.of.ride_master.emit('prfShow'); return !1;
    }
    if (!d) {
      d = I.prf_dlg;
      d.onkeydown = (x) => {
        const k = D.util.fmtKey(x);
        if (k === 'Ctrl-Enter') {
          ok(); return !1;
        } else if (k === 'Escape') {
          cancel(); return !1;
        } else if (k === 'F12') {
          D.el.getCurrentWebContents().toggleDevTools(); return !1;
        }
        return !0;
      };
      //    onresize=function(){for(var i in tabs)tabs[i].resize&&tabs[i].resize()}
      I.prf_dlg_ok.onclick = () => { ok(); return !1; };
      I.prf_dlg_apply.onclick = () => { apply(); return !1; };
      I.prf_dlg_cancel.onclick = () => { cancel(); return !1; };
      const hdrs = I.prf_nav.children;
      const payloads = [];
      I.prf_nav.onclick = () => !1;
      I.prf_nav.onmousedown = (x) => {
        const a = x.target;
        if (a.nodeName !== 'A') return !1;
        for (let i = 0; i < hdrs.length; i++) {
          const b = a === hdrs[i];
          payloads[i].hidden = !b;
          hdrs[i].className = b ? 'sel' : '';
        }
        const t = tabs[a.href.replace(/.*#/, '')];
        t.resize && t.resize();
        t.activate && t.activate();
        x.preventDefault();
        return !1;
      };
      for (let i = 0; i < hdrs.length; i++) {
        const id = hdrs[i].href.replace(/.*#/, '');
        const e = document.getElementById(id);
        tabs[id].init(e);
        payloads.push(e);
      }
      if (D.el) {
        const t = d.querySelector('.dlg_title');
        t && (t.hidden = 1);
        document.title = t.innerText;
        d.style = 'width:100%;height:100%';
        d.hidden = 0;
      } else {
        d.className += ' web';
        D.util.dlg(d, { w: 600, h: 490 });
      }
    }
    Object.keys(tabs).forEach((i) => { tabs[i].load(); });
    const t = tabs[(((document.getElementById('prf_nav').querySelector('.sel') || {}).href) || '').replace(/.*#/, '')];
    t && t.activate && t.activate();
  };
}());
