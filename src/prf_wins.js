// Preferences > Windows
{
  let q; // DOM elements whose ids start with "wins_", keyed by the rest of the id
  const delQns = () => {
    [...q.qns.selectedOptions].forEach((x) => x.remove());
    return !1;
  };
  const updEnabled = () => {
    const b = !q.fw.checked;
    q.fs.disabled = b;
    q.mm.disabled = b;
    q.sw.disabled = b;
    q.sh.disabled = b;
    q.px.disabled = b;
    q.py.disabled = b;
    q.fit.disabled = b;
    q.ox.disabled = b || q.fs.checked;
    q.oy.disabled = b || q.fs.checked;
  };
  D.prf_tabs.wins = {
    name: 'Trace/Edit',
    init() {
      q = J.wins;
      q.fw.onchange = updEnabled;
      q.fs.onchange = updEnabled;
      if (!D.el) {
        D.prf.floating() && D.prf.floating(0);
        q.fw.disabled = true;
      }
      const updEnabling = () => {
        q.aim.disabled = !q.ai.checked;
        q.isw.disabled = !q.ai.checked;
        q.swm.disabled = !q.ai.checked || !q.aim.checked;
      };
      q.ai.onchange = () => {
        updEnabling();
        q.ai.checked && q.isw.select();
      };
      q.aim.onchange = () => {
        updEnabling(); q.aim.checked && q.swm.select();
      };
      q.ilf.onchange = () => {
        const x = !!+q.ilf.value;
        q.ai.disabled = x;
        q.icom.disabled = x;
        updEnabled();
      };
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
      const p = D.prf;
      const w = D.prf.editWins();
      const sw = p.indent();
      const swm = p.indentMethods();
      q.ai.checked = sw >= 0;
      q.isw.value = (sw < 0 && 4) || sw;
      q.aim.checked = swm >= 0;
      q.swm.value = (swm < 0 && 2) || swm;
      q.icom.checked = !!p.indentComments();
      q.io.checked = !!p.indentOnOpen();
      q.ilf.value = p.ilf();
      q.ai.onchange();
      q.ilf.onchange();
      q.dce.checked = !!p.doubleClickToEdit();
      q.set.checked = !!p.showEditorToolbar();
      q.fit.checked = !!p.filenameInTitle();
      q.fw.checked = !!D.prf.floating();
      q.fs.checked = !!D.prf.floatSingle();
      q.mm.checked = !!D.prf.editWinsRememberPos();
      q.sw.value = w.width;
      q.sh.value = w.height;
      q.px.value = w.x;
      q.py.value = w.y;
      q.ox.value = w.ox;
      q.oy.value = w.oy;
      updEnabled();
      const conf = D.prf.confirmations();
      q.qns.innerHTML = Object.keys(conf).map(k => `<option value=${conf[k]}>${k}`).join('');
    },
    activate() { q.sw.focus(); },
    save() {
      const p = D.prf;
      D.prf.editWinsRememberPos(q.mm.checked);
      D.prf.floating(q.fw.checked);
      D.prf.floatSingle(q.fs.checked);
      p.indent             (q.ai.checked ? (+q.isw.value || 0) : -1);
      p.indentMethods      (q.aim.checked ? (+q.swm.value || 0) : -1);
      p.indentComments     (q.icom.checked);
      p.indentOnOpen       (q.io.checked);
      p.ilf                (!!+q.ilf.value);
      p.doubleClickToEdit  (q.dce.checked);
      p.showEditorToolbar  (q.set.checked);
      p.filenameInTitle    (q.fit.checked);
      D.prf.editWins({
        width: +q.sw.value,
        height: +q.sh.value,
        x: +q.px.value,
        y: +q.py.value,
        ox: +q.ox.value,
        oy: +q.oy.value,
      });
      const conf = {};
      [...q.qns.options].forEach(x => conf[x.label] = +x.value)
      D.prf.confirmations(conf);
    },
    validate() {
      if (q.ai.checked && !isInt(q.isw.value, 0)) return { msg: 'Auto-indent must be a non-negative integer.', el: q.isw };
      if (q.aim.checked && !isInt(q.swm.value, 0)) return { msg: 'Auto-indent in methods must be a non-negative integer.', el: q.swm };
      function isInt(x, minX) { x = +x; return x === (x | 0) && x >= minX; }
      if (q.sw.value && !isInt(q.sw.value, 400)) return { msg: 'Width must be at least 400.', el: q.sw };
      if (q.sh.value && !isInt(q.sh.value, 400)) return { msg: 'Height must be at least 400.', el: q.sh };
      // if (q.px.value && !isInt(q.px.value, 0)) return { msg: 'Position x must be a positive integer.', el: q.px };
      // if (q.py.value && !isInt(q.py.value, 0)) return { msg: 'Position y must be a positive integer.', el: q.py };
      if (q.ox.value && !isInt(q.ox.value, 0)) return { msg: 'Offset x must be a positive integer.', el: q.ox };
      if (q.oy.value && !isInt(q.oy.value, 0)) return { msg: 'Offset y must be a positive integer.', el: q.oy };
      return 0;
    },
    print() {
      D.el.getCurrentWindow().webContents.print({ printBackground: true });
    },
  };
}
