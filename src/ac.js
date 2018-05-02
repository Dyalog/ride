{
  const words = '[⎕\\]\\)\\.A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ\\d]';
  const prefixRE = new RegExp(`^(${words}*)${words}*(?: \\1${words}*)*$`);

  D.ac = (me) => {
    me.tabComplete = 0;
    me.onDidChangeModelContent((e) => {
      const pk = D.prf.prefixKey();
      if (me.listen && !me.dyalogBQ && e.changes.length === 1
        && e.changes[0].text === pk) {
        D.commands.BQC(me);
      } else {
        setTimeout(() => {
          const sw = me.contentWidgets['editor.widget.suggestWidget'];
          const swv = sw.widget.suggestWidgetVisible.get();
          const r = e.changes[0].range;
          const l = me.model.getLineContent(r.startLineNumber).toLowerCase();
          const bq2 = e.changes.length === 1 && RegExp(`${pk}${pk}\\w*`, 'i').test(l);
          if (swv && sw.widget.list.length === 1) {
            const t = sw.widget.focusedItem.suggestion.insertText.toLowerCase();
            if (l.slice(r.startColumn - t.length, r.startColumn) === t) {
              me.trigger('editor', 'hideSuggestWidget');
            } else {
              me.trigger('editor', 'editor.action.triggerSuggest');
            }
          } else if (swv && !sw.widget.list.length) {
            me.trigger('editor', 'hideSuggestWidget');
          } else if (swv && !bq2 && sw.widget.list.length > 1) {
            me.trigger('editor', 'editor.action.triggerSuggest');
          }
        }, 50);
      }
    });
    const fw = me.overlayWidgets['editor.contrib.findWidget'].widget;
    const fi = fw._findInput;
    fi.onKeyDown((e) => {
      const pk = D.prf.prefixKey();
      const s = fi.getValue();
      const be = e.browserEvent;
      const tgt = be.target;
      const p = tgt.selectionStart;
      if (s[p - 1] === pk && D.bq[be.key] &&
        !be.altKey && !be.ctrlKey && !be.metaKey && !be.key !== 'Shift') {
        e.preventDefault();
        const t = s.slice(0, p - 1) + D.bq[be.key] + s.slice(p);
        fi.setValue(t);
        fi._onInput.fire();
        tgt.selectionStart = p;
        tgt.selectionEnd = p;
      }
    });
    const fwr = fw._replaceInputBox.inputElement;
    fwr.onkeydown = (be) => {
      const pk = D.prf.prefixKey();
      const s = fwr.value;
      const tgt = be.target;
      const p = tgt.selectionStart;
      if (s[p - 1] === pk && D.bq[be.key] &&
        !be.altKey && !be.ctrlKey && !be.metaKey && !be.key !== 'Shift') {
        be.preventDefault();
        fwr.value = s.slice(0, p - 1) + D.bq[be.key] + s.slice(p);
        fw._state.change({ replaceString: fwr.value }, false);
        tgt.selectionStart = p;
        tgt.selectionEnd = p;
      }
    };
    return (x) => { // win:editor or session instance to set up autocompletion in
      const { ac } = me.model;
      if (ac && ac.complete) {
        const l = ac.position.lineNumber;
        const c = ac.position.column;
        const manual = me.tabComplete;
        if (D.prf.autocompletion() === 'shell' && manual) {
          const [, prefix] = x.options.join(' ').match(prefixRE);
          if (prefix && prefix.length > x.skip) {
            const endCol = (c - x.skip) + prefix.length;
            me.executeEdits(
              'D',
              [{ range: new monaco.Range(l, c - x.skip, l, c), text: prefix }],
              [new monaco.Selection(l, endCol, l, endCol)],
            );
            me.trigger('editor', 'hideSuggestWidget');
            me.tabComplete = 0;
            return;
          } else if (me.tabComplete < 2) {
            me.trigger('editor', 'hideSuggestWidget');
            return;
          }
          me.tabComplete = 0;
        }
        if (!x.options.length || (D.prf.autocompletion() === 'shell' && !manual)) {
          me.trigger('editor', 'hideSuggestWidget');
          return;
        }
        ac.complete(x.options.map(i => ({
          label: i,
          range: new monaco.Range(l, c - x.skip, l, c),
        })));
      }
    };
  };
}
