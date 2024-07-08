// Preferences > Layout
{
  const { geom, layouts } = D.kbds;
  const NK = 58; // NK:number of scancodes we are concerned with
  let model = {}; // dictionary: locale→[arrayOfAPLGlyphs,arrayOfShiftedAPLGlyphs]
  // q: DOM elements whose ids start with "lyt_" (for "LaYouT"), keyed by the rest of the id
  let q = {};
  // g[i][j]:the DOM element for key i and group j
  // (group 0 is bottom-left, 1 top-left, etc, for instance: eE∊⍷)
  const g = [];
  const tip = x =>
    (x === ' ' ? 'Click to\nconfigure' : `U+${`000${x.charCodeAt(0).toString(16).toUpperCase()}`.slice(-4)}`);
  function updPfx() {
    const c = q.pfx.value[0] || D.prf.prefixKey.getDefault();
    q.spc_g1.textContent = c + q.spc_g1.textContent.slice(1);
    q.spc_g3.textContent = c + q.spc_g3.textContent.slice(1);
  }
  // every geometry ("mechanical layout") has a css class specifying the precise key arrangement
  function updGlyphs() { // apply model values to the DOM
    const lc = q.lc.value;
    const l = layouts[lc];
    const m = model[lc];
    if (!l) return;
    q.kbd.className = `lyt_geom_${geom[lc] || geom._}`;
    for (let i = 1; i < NK; i++) {
      const g0 = l[0][i];
      const g1 = m[0][i];
      const g2 = l[1][i];
      const g3 = m[1][i];
      if (g[i][0]) g[i][0].textContent = g0;
      if (g[i][1]) { g[i][1].value = g1; g[i][1].title = tip(g1); }
      if (g[i][2]) g[i][2].textContent = g2;
      if (g[i][3]) { g[i][3].value = g3; g[i][3].title = tip(g3); }
    }
  }
  
  D.prf_tabs.lyt = {
    name: 'Keyboard',
    init() {
      q = J.lyt;
      q.prnt.onclick = () => {
        q.pfx.blur();
        D.el.getCurrentWindow().webContents.print({ printBackground: true });
      };
      q.lc.innerHTML = `<option>${Object.keys(layouts).sort().join('<option>')}`;
      const inputs = q.kbd.querySelectorAll('input');
      const onBlurInput = (x) => {
        const e = x.target;
        const v = e.value.slice(-1) || ' ';
        e.value = v;
        e.title = tip(v);
        model[q.lc.value][+(e.className === 'lyt_g3')][+e.closest('.lyt_k').id.replace(/^lyt_/, '')] = v;
      };
      for (let i = 0; i < inputs.length; i++) {
        inputs[i].onfocus = (x) => { setTimeout(() => { x.target.select(); }, 1); };
        inputs[i].onblur = onBlurInput;
      }
      for (let i = 1; i < NK; i++) {
        g[i] = [];
        const e = J.lyt[i];
        for (let j = 0; j < 4; j++) g[i][j] = e.querySelector(`.lyt_g${j}`);
      }
      q.ime.hidden = !D.win;
      const updateLocale = (e) => {
        const lc = q.lc.value;
        q.pfx.value = D.defaultPrefix(lc);
        updPfx();
        if (e.target === q.rst) {
          model[lc] = [layouts[lc][2].split(''), layouts[lc][3].split('')];
        }
        updGlyphs();
      };
      q.rst.onclick = updateLocale;
      q.lc.onchange = updateLocale;
      q.pfx.onchange = updPfx;
      q.pfx.onkeyup = updPfx;
    },
    load() {
      q.lc.value = D.prf.kbdLocale();
      q.pfx.value = D.prf.prefixKey();
      model = {};
      Object.keys(layouts).forEach((lc) => {
        const l = layouts[lc];
        model[lc] = [l[2].split(''), l[3].split('')];
      });
      const pm = D.prf.prefixMaps();
      Object.keys(pm).forEach((lc) => {
        const v = pm[lc];
        if (layouts[lc]) {
          for (let i = 0; i < v.length; i += 2) {
            for (let j = 0; j < 2; j++) {
              const ix = layouts[lc][j].indexOf(v[i]);
              ix >= 0 && (model[lc][j][ix] = v[i + 1]);
            }
          }
        }
      });
      updGlyphs();
      // "IME" is the key mapper in Windows;
      // there's a checkbox to enable Dyalog's keymap when Ride starts
      // That's done in prf.js which spawns an external process - see also ../windows-ime/readme
      if (D.win) q.ime.checked = !!D.prf.ime();
    },
    activate() { q.pfx.focus(); },
    validate() {
      if (q.pfx.value.length !== 1) return { msg: 'Invalid prefix key', el: q.pfx };
      return null;
    },
    save() {
      D.prf.prefixKey(q.pfx.value);
      D.prf.kbdLocale(q.lc.value);
      const h = {};
      Object.keys(model).forEach((lc) => {
        const m = model[lc];
        const l = layouts[lc];
        let s = '';
        const xs = l[0] + l[1];
        const ys = m[0].concat(m[1]).join('');
        const YS = l[2] + l[3];
        for (let i = 0; i < xs.length; i++) {
          const x = xs[i];
          const y = ys[i];
          const Y = YS[i];
          if (y !== Y) s += x + y;
        }
        s && (h[lc] = s);
      });
      D.prf.prefixMaps(h);
      D.win && D.prf.ime(q.ime.checked);
    },
  };
}
