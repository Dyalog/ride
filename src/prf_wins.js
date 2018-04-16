// Preferences > Windows
(function prfWins() {'use strict'

  let q; // DOM elements whose ids start with "wins_", keyed by the rest of the id
  D.prf_tabs.wins = {
    name: 'Windows',
    init() {
      q = J.wins;
    },
    load() {
      const w = D.prf.editWins();
      q.mm.checked = !!D.prf.editWinsRememberPos();
      q.fw.checked = !!D.prf.floating();
      q.fs.checked = !!D.prf.floatSingle();
      q.sw.value = w.width;
      q.sh.value = w.height;
      q.px.value = w.x;
      q.py.value = w.y;
      q.ox.value = w.ox;
      q.oy.value = w.oy;
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
      function isInt(x, minX) { x = +x; return x === (x | 0) && x >= minX; };
      if (q.sw.value && !isInt(q.sw.value, 400)) return { msg: 'Width must be at least 400.', el: q.sw };
      if (q.sh.value && !isInt(q.sh.value, 400)) return { msg: 'Height must be at least 400.', el: q.sh };
      // if (q.px.value && !isInt(q.px.value, 0)) return { msg: 'Position x must be a positive integer.', el: q.px };
      // if (q.py.value && !isInt(q.py.value, 0)) return { msg: 'Position y must be a positive integer.', el: q.py };
      if (q.ox.value && !isInt(q.ox.value,0)) return { msg: 'Offset x must be a positive integer.', el: q.ox };
      if (q.oy.value && !isInt(q.oy.value,0)) return { msg: 'Offset y must be a positive integer.', el: q.oy };
      return 0;
    }
  };

}())
