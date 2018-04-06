{
  // Preferences > Code

  let q; // DOM elements whose ids start with "code_", keyed by the rest of the id
  D.prf_tabs.code = {
    name: 'Code',
    init(t) {
      q = J.code;
      const updEnabling = () => {
        q.aim.disabled = !q.ai.checked;
        q.sw.disabled = !q.ai.checked;
        q.swm.disabled = !q.ai.checked || !q.aim.checked;
      };
      q.ai.onchange = () => {
        updEnabling();
        q.ai.checked && q.sw.select();
      };
      q.aim.onchange = () => {
        updEnabling(); q.aim.checked && q.swm.select();
      };
      q.acbl.onchange = () => {
        q.acbe.disabled = !q.acbl.checked;
        q.acbl.checked && q.acbe.focus();
      };
      q.ac.onchange = () => {
        q.acd.disabled = !q.ac.checked;
        q.ac.checked && q.acd.select();
      };
      q.ilf.onchange = () => {
        const x = q.ilf.checked;
        q.ai.disabled = x;
        q.aim.disabled = x;
        q.icom.disabled = x;
        q.io.disabled = x;
      };
      q.ph.onchange = () => {
        q.phs.disabled = !q.ph.checked;
        q.ph.checked && q.phs.select();
      };
    },
    load() {
      const p = D.prf;
      const sw = p.indent();
      const swm = p.indentMethods();
      q.ai.checked = sw >= 0;
      q.sw.value = (sw < 0 && 4) || sw;
      q.aim.checked = swm >= 0;
      q.swm.value = (swm < 0 && 2) || swm;
      q.icom.checked = !!p.indentComments();
      q.io.checked = !!p.indentOnOpen();
      q.ilf.checked = !!p.ilf();
      q.mb.checked = !!p.matchBrackets();
      q.acbr.checked = !!p.autoCloseBrackets();
      q.acbl.checked = !!p.autoCloseBlocks();
      q.acbe.value = p.autoCloseBlocksEnd();
      q.ac.checked = !!p.autocompletion();
      q.acd.value = p.autocompletionDelay();
      q.bc.checked = !!p.blockCursor();
      q.blc.checked = !!p.blinkCursor();
      q.coq.checked = !!p.connectOnQuit();
      q.fold.checked = !!p.fold();
      q.rlh.value = p.renderLineHighlight();
      q.ph.checked = !!p.persistentHistory();
      q.phs.value = p.persistentHistorySize();
      q.vt.checked = !!p.valueTips();
      q.sqt.checked = !!p.squiggleTips();
      q.sqp.checked = !!p.sqp();
      q.ai.onchange();
      q.acbl.onchange();
      q.ac.onchange();
      q.ilf.onchange();
    },
    activate() { q.ai.focus(); },
    save() {
      const p = D.prf;
      p.indent             (q.ai.checked ? (+q.sw.value || 0) : -1);
      p.indentMethods      (q.aim.checked ? (+q.swm.value || 0) : -1);
      p.indentComments     (q.icom.checked);
      p.indentOnOpen       (q.io.checked);
      p.ilf                (q.ilf.checked);
      p.matchBrackets      (q.mb.checked);
      p.autoCloseBrackets  (q.acbr.checked);
      p.autoCloseBlocks    (q.acbl.checked);
      p.autoCloseBlocksEnd (q.acbe.value);
      p.autocompletion     (q.ac.checked);
      p.autocompletionDelay(q.acd.value);
      p.connectOnQuit      (q.coq.checked);
      p.blockCursor        (q.bc.checked);
      p.blinkCursor        (q.blc.checked);
      p.fold               (q.fold.checked);
      p.renderLineHighlight(q.rlh.value);
      p.persistentHistory  (q.ph.checked);
      p.persistentHistorySize(q.phs.value);
      p.valueTips          (q.vt.checked);
      p.squiggleTips       (q.sqt.checked);
      p.sqp                (q.sqp.checked);
    },
    validate() {
      const isInt = (x, minX) => +x === (+x | 0) && +x >= minX;
      if (q.ai.checked && !isInt(q.sw.value, 0)) return { msg: 'Auto-indent must be a non-negative integer.', el: q.sw };
      if (q.aim.checked && !isInt(q.swm.value, 0)) return { msg: 'Auto-indent in methods must be a non-negative integer.', el: q.swm };
      if (q.ac.checked && !isInt(q.acd.value, 1)) return { msg: 'Autocompletion delay must be a positive integer.', el: q.acd };
      if (q.ph.checked && !isInt(q.phs.value, 1)) return { msg: 'Persistent history size must be a positive integer.', el: q.phs };
      return null;
    },
  };
}
