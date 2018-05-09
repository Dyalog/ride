// Preferences > Menu
{
  let ta; // the textarea
  D.prf_tabs.pmenu = {
    name: 'Menu',
    init() {
      ta = I.pmenu_ta;
      I.pmenu_rst.onclick = () => { ta.value = D.prf.menu.getDefault(); };
    },
    load() { ta.value = D.prf.menu(); },
    activate() { ta.scrollTop = 0; ta.selectionStart = 0; ta.selectionEnd = 0; ta.focus(); },
    save() { D.prf.menu(ta.value); },
    validate() {
      try {
        const visit = (x) => {
          if (x.cmd === 'PRF') return 1;
          if (x.items) for (let i = 0; i < x.items.length; i++) if (visit(x.items[i])) return 1;
          return 0;
        };
        let ok = 0;
        const a = D.parseMenuDSL(ta.value);
        for (let i = 0; i < a.length; i++) if (visit(a[i])) { ok = 1; break; }
        if (!ok) return { msg: 'Menu must contain the PRF (Preferences) command', el: ta };
      } catch (e) {
        return { msg: e.message, el: ta };
      }
      return null;
    },
  };
  D.parseMenuDSL = (md) => { // md:menu description
    const extraOpts = {
      LN: { checkBoxPref: D.prf.lineNums },
      TVO: { checkBoxPref: D.prf.fold },
      TVB: { checkBoxPref: D.prf.breakPts },
      LBR: { checkBoxPref: D.prf.lbar },
      SBR: { checkBoxPref: D.prf.sbar },
      FLT: { checkBoxPref: D.prf.floating },
      WRP: { checkBoxPref: D.prf.wrap },
      TOP: { checkBoxPref: D.prf.floatOnTop },
      WSE: { checkBoxPref: D.prf.wse },
      DBG: { checkBoxPref: D.prf.dbg },
    };
    const stk = [{ ind: -1, items: [] }];
    const lines = md.split('\n');
    const cb = cmd => () => {
      const f = D.commands[cmd];
      const w = (D.ide || {}).focusedWin || {};
      if (f) f(w.me);
      else if (D.ide[cmd]) D.ide[cmd]();
      else $.err(`Unknown command: ${cmd}`);
    };
    for (let i = 0; i < lines.length; i++) {
      let s = lines[i];
      if (/^\s*$/.test(s = s.replace(/#.*/, ''))) continue;
      let cond = ''; s = s.replace(/\{(.*)\}/, (_, x) => { cond = x; return ''; });
      let url = ''; s = s.replace(/\=(https?:\/\/\S+)/, (_, x) => { url = x; return ''; });
      let cmd = ''; s = s.replace(/\=([a-z][a-z0-9]+)/i, (_, x) => { cmd = x; return ''; });
      const h = { ind: s.replace(/\S.*/, '').length, '': s.replace(/^\s*|\s*$/g, '') };
      while (h.ind <= stk[stk.length - 1].ind) stk.pop();
      if (!cond || new Function(`var browser=${!D.el},mac=${D.mac},win=${D.win};return(${cond})`)()) {
        const base = stk[stk.length - 1]; (base.items || (base.items = [])).push(h);
      }
      stk.length !== 1 || h.items || (h.items = []); // force top-level items to be menus
      stk.push(h);
      if (cmd) {
        h.cmd = cmd;
        h.action = cb(cmd);
      } else if (url) {
        h.action = D.openExternal.bind(D, url);
      }
      $.extend(h, extraOpts[cmd]);
    }
    return stk[0].items;
  };
}
