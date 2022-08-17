{
  // Preferences > Code
  // Is this now Preferences > General?

  let q; // DOM elements whose ids start with "code_", keyed by the rest of the id
  D.prf_tabs.code = {
    name: 'Code',
    init() {
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
      q.ac.onchange = () => {
        q.acd.disabled = q.ac.value !== 'classic';
        q.acl.disabled = q.ac.value !== 'classic';
        q.ac.value === 'classic' && q.acd.select();
      };
      q.ilf.onchange = () => {
        const x = q.ilf.checked;
        q.ai.disabled = x;
        q.aim.disabled = x;
        q.icom.disabled = x;
        q.sw.disabled = x;
        q.swm.disabled = x;
      };
      q.mme.onchange = () => {
        q.mmrc.disabled = !q.mme.checked;
        q.mmss.disabled = !q.mme.checked;
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
      q.mme.checked = !!p.minimapEnabled();
      q.mmrc.checked = !!p.minimapRenderCharacters();
      q.mmss.value = p.minimapShowSlider();
      q.acbr.checked = !!p.autoCloseBrackets();
      q.ac.value = p.autocompletion();
      q.acd.value = p.autocompletionDelay();
      q.acl.value = p.autoCompleteCharacterLimit();
      q.bc.checked = !!p.blockCursor();
      q.cb.value = p.cursorBlinking();
      q.coq.checked = !!p.connectOnQuit();
      q.fit.checked = !!p.filenameInTitle();
      q.rlh.value = p.renderLineHighlight();
      q.apw.checked = !!p.autoPW();
      q.ph.checked = !!p.persistentHistory();
      q.phs.value = p.persistentHistorySize();
      q.vt.checked = !!p.valueTips();
      q.sh.checked = !!p.selectionHighlight();
      q.sqt.checked = !!p.squiggleTips();
      q.set.checked = !!p.showEditorToolbar();
      q.sls.value = p.sessionLogSize();
      q.sqp.checked = !!p.sqp();
      q.ss.checked = !!p.snippetSuggestions();
      q.ai.onchange();
      q.ac.onchange();
      q.ilf.onchange();
      q.mme.onchange();
      q.dce.checked = !!p.doubleClickToEdit();
    },
    activate() { q.ai.focus(); },
    save() {
      const p = D.prf;
      p.blockCursor        (q.bc.checked);
      p.cursorBlinking     (q.cb.value);
      p.indent             (q.ai.checked ? (+q.sw.value || 0) : -1);
      p.indentMethods      (q.aim.checked ? (+q.swm.value || 0) : -1);
      p.indentComments     (q.icom.checked);
      p.indentOnOpen       (q.io.checked);
      p.ilf                (q.ilf.checked);
      p.matchBrackets      (q.mb.checked);
      p.minimapEnabled     (q.mme.checked);
      p.minimapRenderCharacters(q.mmrc.checked);
      p.minimapShowSlider  (q.mmss.value);
      p.autoCloseBrackets  (q.acbr.checked);
      p.autocompletion     (q.ac.value);
      p.autoPW             (q.apw.checked);
      p.autocompletionDelay(q.acd.value);
      p.autoCompleteCharacterLimit (q.acl.value);
      p.connectOnQuit      (q.coq.checked);
      p.filenameInTitle    (q.fit.checked);
      p.renderLineHighlight(q.rlh.value);
      p.persistentHistory  (q.ph.checked);
      p.persistentHistorySize(q.phs.value);
      p.valueTips          (q.vt.checked);
      p.selectionHighlight (q.sh.checked);
      p.sessionLogSize     (q.sls.value);
      p.showEditorToolbar  (q.set.checked);
      p.squiggleTips       (q.sqt.checked);
      p.sqp                (q.sqp.checked);
      p.snippetSuggestions (q.ss.checked);
      p.doubleClickToEdit  (q.dce.checked);
    },
    validate() {
      const isInt = (x, minX) => +x === (+x | 0) && +x >= minX;
      if (q.ai.checked && !isInt(q.sw.value, 0)) return { msg: 'Auto-indent must be a non-negative integer.', el: q.sw };
      if (q.aim.checked && !isInt(q.swm.value, 0)) return { msg: 'Auto-indent in methods must be a non-negative integer.', el: q.swm };
      if (q.ac.value === 'classic' && !isInt(q.acd.value, 0)) return { msg: 'Autocompletion delay must be a non-negative integer.', el: q.acd };
      if (q.ac.value === 'classic' && !isInt(q.acl.value, 0)) return { msg: 'Autocompletion after N characters must not be a non-negative integer.', el: q.acl };
      if (q.ph.checked && !isInt(q.phs.value, 1)) return { msg: 'Persistent history size must be a positive integer.', el: q.phs };
      return null;
    },
  };
}
