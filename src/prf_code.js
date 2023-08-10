{
  // Preferences > Code
  // Is this now Preferences > General?

  let q; // DOM elements whose ids start with "code_", keyed by the rest of the id
  D.prf_tabs.code = {
    name: 'Code',
    init() {
      q = J.code;
      q.ac.onchange = () => {
        q.acd.disabled = q.ac.value !== 'classic';
        q.acl.disabled = q.ac.value !== 'classic';
        q.ac.value === 'classic' && q.acd.select();
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
      q.rlh.value = p.renderLineHighlight();
      q.apw.checked = !!p.autoPW();
      q.ph.checked = !!p.persistentHistory();
      q.phs.value = p.persistentHistorySize();
      q.vt.checked = !!p.valueTips();
      q.sh.checked = !!p.selectionHighlight();
      q.sqt.checked = !!p.squiggleTips();
      q.sls.value = p.sessionLogSize();
      q.ssm.checked = !!p.showSessionMargin();
      q.sqp.checked = !!p.sqp();
      q.ss.checked = !!p.snippetSuggestions();
      q.ac.onchange();
      q.mme.onchange();
    },
    activate() { q.mb.focus(); },
    save() {
      const p = D.prf;
      p.blockCursor        (q.bc.checked);
      p.cursorBlinking     (q.cb.value);
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
      p.renderLineHighlight(q.rlh.value);
      p.persistentHistory  (q.ph.checked);
      p.persistentHistorySize(q.phs.value);
      p.valueTips          (q.vt.checked);
      p.selectionHighlight (q.sh.checked);
      p.sessionLogSize     (q.sls.value);
      p.showSessionMargin  (q.ssm.checked);
      p.squiggleTips       (q.sqt.checked);
      p.sqp                (q.sqp.checked);
      p.snippetSuggestions (q.ss.checked);
    },
    validate() {
      const isInt = (x, minX) => +x === (+x | 0) && +x >= minX;
      if (q.ac.value === 'classic' && !isInt(q.acd.value, 0)) return { msg: 'Autocompletion delay must be a non-negative integer.', el: q.acd };
      if (q.ac.value === 'classic' && !isInt(q.acl.value, 0)) return { msg: 'Autocompletion after N characters must be a non-negative integer.', el: q.acl };
      if (q.ph.checked && !isInt(q.phs.value, 1)) return { msg: 'Persistent history size must be a positive integer.', el: q.phs };
      return null;
    },
  };
}
