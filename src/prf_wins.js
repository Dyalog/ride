// Preferences > Windows
(function prfWins() {
  let q; // DOM elements whose ids start with "wins_", keyed by the rest of the id
  const updEnabled = () => {
    const b = !q.fw.checked;
    q.fs.disabled = b;
    q.mm.disabled = b;
    q.sw.disabled = b;
    q.sh.disabled = b;
    q.px.disabled = b;
    q.py.disabled = b;
    q.ox.disabled = b || q.fs.checked;
    q.oy.disabled = b || q.fs.checked;
  };
  D.prf_tabs.wins = {
    name: 'Windows',
    init() {
      q = J.wins;
      q.fw.onchange = updEnabled;
      q.fs.onchange = updEnabled;
      if (!D.el) {
        D.prf.floating() && D.prf.floating(0);
        q.fw.disabled = true;
      }
    },
    load() {
      const w = D.prf.editWins();
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
    },
    activate() { q.sw.focus(); },
    save() {
      D.prf.editWinsRememberPos(q.mm.checked);
      D.prf.floating(q.fw.checked);
      D.prf.floatSingle(q.fs.checked);
      D.prf.editWins({
        width: +q.sw.value,
        height: +q.sh.value,
        x: +q.px.value,
        y: +q.py.value,
        ox: +q.ox.value,
        oy: +q.oy.value,
      });
    },
    validate() {
      function isInt(x, minX) { x = +x; return x === (x | 0) && x >= minX; }
      if (q.sw.value && !isInt(q.sw.value, 400)) return { msg: 'Width must be at least 400.', el: q.sw };
      if (q.sh.value && !isInt(q.sh.value, 400)) return { msg: 'Height must be at least 400.', el: q.sh };
      // if (q.px.value && !isInt(q.px.value, 0)) return { msg: 'Position x must be a positive integer.', el: q.px };
      // if (q.py.value && !isInt(q.py.value, 0)) return { msg: 'Position y must be a positive integer.', el: q.py };
      if (q.ox.value && !isInt(q.ox.value, 0)) return { msg: 'Offset x must be a positive integer.', el: q.ox };
      if (q.oy.value && !isInt(q.oy.value, 0)) return { msg: 'Offset y must be a positive integer.', el: q.oy };
      return 0;
    },
  };
}());
