{
  const words = '[⎕\\]\\)A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ\\d]';
  const prefixRE = new RegExp(`^(${words}*)${words}*(?: \\1${words}*)*$`);

  D.ac = (me) => {
    me.onDidChangeModelContent((e) => {
      const pk = D.prf.prefixKey();
      if (!me.dyalogBQ && e.changes.length === 1
        && e.changes[0].text === pk) {
        D.commands.BQC(me);
      } else {
        setTimeout(() => {
          const sw = me.contentWidgets['editor.widget.suggestWidget'];
          const swv = sw.widget.suggestWidgetVisible.get();
          const r = e.changes[0].range;
          const l = me.model.getLineContent(r.endLineNumber).toLowerCase();
          const bq2 = e.changes.length === 1 && RegExp(`${pk}${pk}\\w*`, 'i').test(l);
          if (swv && sw.widget.list.length === 1) {
            const t = sw.widget.focusedItem.suggestion.insertText.toLowerCase();
            if (l.slice(r.endColumn - t.length, r.endColumn) === t) {
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
    return (x) => { // win:editor or session instance to set up autocompletion in
      const { ac } = me.model;
      if (ac && ac.complete) {
        const l = ac.position.lineNumber;
        const c = ac.position.column;
        const manual = me.tabComplete;
        if (D.prf.autocompletion() === 'shell' && manual) {
          me.tabComplete = 0;
          const prefix = x.options.join(' ').match(prefixRE)[1];
          if (prefix.length > x.skip) {
            const endCol = (c - x.skip) + prefix.length;
            me.executeEdits(
              'D',
              [{ range: new monaco.Range(l, c - x.skip, l, c), text: prefix }],
              [new monaco.Selection(l, endCol, l, endCol)],
            );
            me.trigger('editor', 'hideSuggestWidget');
            return;
          }
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
