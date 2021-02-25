{
// Preferences > Shortcuts
  function delQns() {
    [...q.qns.selectedOptions].forEach(x => x.remove())
    return !1;
  }

  let q; // DOM elements whose ids start with "resp_", keyed by the rest of the id
  D.prf_tabs.resp = {
    name: 'Saved Responses',
    init(t) {
      q = J.resp;
      q.del.onclick = delQns;
      q.sel_all.onclick = () => {
        [...q.qns.options].forEach(x => x.selected = true)
        return !1;
      };
      q.qns.onkeydown = (x) => {
        if (x.which == 46) return delQns(); // on del
        return !0;
      };
    },
    load() { 
      const conf = D.prf.confirmations(); 
      q.qns.innerHTML = Object.keys(conf).map(k => `<option value=${conf[k]}>${k}`).join('');
    },
    validate() {
      return null;
    },
    print() {
      D.el.getCurrentWindow().webContents.print({ printBackground: true });
    },
    save() {
      const conf = {};
      [...q.qns.options].forEach(x => conf[x.label] = +x.value)
      D.prf.confirmations(conf);
    },
    activate() { q.qns.focus(); },
  };
}
