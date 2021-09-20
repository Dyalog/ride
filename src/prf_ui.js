(function prfUI() {
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
  let activeTab;
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
  D.prf_ui = function PrfUI(tab) {
    if (D.prf_bw) {
      D.ipc.server.emit(D.prf_bw.socket, 'show', tab);
      const bw = D.el.BrowserWindow.fromId(D.prf_bw.id);
      bw.show();
      return !1;
    }
    if (D.ide && D.ide.floating) {
      D.ipc.of.ride_master.emit('prfShow', tab);
      return !1;
    }
    if (!d) {
      d = I.prf_dlg;
      $(`#${d.id}>div`).attr('tabIndex', 0);
      d.onkeydown = (x) => {
        const k = D.util.fmtKey(x);
        if (k === 'Ctrl-Enter') {
          ok();
          return !1;
        }
        if (k === 'Escape') {
          cancel();
          return !1;
        }
        if (k === 'F12') {
          D.el.getCurrentWebContents().toggleDevTools();
          return !1;
        }
        return !0;
      };
      //    onresize=function(){for(var i in tabs)tabs[i].resize&&tabs[i].resize()}
      I.prf_dlg_ok.onclick = () => { ok(); return !1; };
      I.prf_dlg_apply.onclick = () => { apply(); return !1; };
      I.prf_dlg_cancel.onclick = () => { cancel(); return !1; };
      const hdrs = I.prf_nav.getElementsByTagName('a');
      const payloads = [];
      I.prf_nav.onclick = () => !1;
      I.prf_nav.onmousedown = (x) => {
        const a = x.target;
        if (a.nodeName !== 'A') return !1;
        for (let i = 0; i < hdrs.length; i++) {
          const b = a === hdrs[i];
          payloads[i].hidden = !b;
          payloads[i].tabIndex = b ? 0 : -1;
          hdrs[i].className = b ? 'sel' : '';
        }
        activeTab = tabs[a.href.replace(/.*#/, '')];
        activeTab.resize && activeTab.resize();
        activeTab.activate && activeTab.activate();
        I.prf_print.disabled = !activeTab.print;
        x.preventDefault();
        return !1;
      };
      I.prf_print.onclick = () => {
        activeTab.print && activeTab.print();
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
      }
    }
    !D.el && D.util.dlg(d, { w: 765, h: 600 });
    Object.keys(tabs).forEach((i) => { tabs[i].load(); });
    $(typeof tab === 'string' ? `#prf_nav a[href$=${tab}]` : '#prf_nav .sel').mousedown();
  };
}());
