{
  const words = '[⎕\\\\\\/\\]\\)\\.A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ\\d]';
  const prefixRE = new RegExp(`^(${words}*)${words}*(?: \\1${words}*)*$`);
  let cce; // composition change event
  function bqCleanUpMe(me) {
    const model = me.getModel();
    if (model.bqc) {
      model.bqc = 0;
      me.trigger('editor', 'hideSuggestWidget');
    }
  }
  function bqChangeHandlerMe(me, o) { // o:changeObj
    const model = me.getModel();
    const chg = o.changes[0];
    const r = chg.range;
    const l = r.startLineNumber;
    const c = r.startColumn;
    const x = chg.text[0];
    const pk = D.prf.prefixKey();
    const s = model.getLineContent(l);
    const sc = model.bqc - 1;
    if (s.slice(sc, c) === `${pk}${pk}${pk}`) { // ``` for ⋄
      const nr = [];
      const ns = [];
      const text = D.bq[pk] || '';
      o.changes.forEach((oc) => {
        const l1 = oc.range.startLineNumber;
        const c1 = oc.range.startColumn;
        nr.push({ range: new monaco.Range(l1, c1 - 2, l1, c1 + 1), text });
        ns.push(new monaco.Selection(l1, c1 - 1, l1, c1 - 1));
      });
      bqCleanUpMe(me);
      setTimeout(() => {
        me.listen = false;
        me.executeEdits('D', nr, ns);
        me.listen = true;
      }, 1);
    } else if (s.slice(sc, c - 1) === `${pk}${pk}`) { // bqbqc
      model.bqc = 0;
    } else if (s[c - 2] !== pk) {
      bqCleanUpMe(me);
    } else if (x !== pk) {
      let y = x === ' ' ? pk : D.bq[x] || '';
      if (!(chg.text.length === 2 && D.prf.autoCloseBrackets()
        && [')', ']', '}'].includes(chg.text[1]))) y += chg.text.slice(1);
      if (y) {
        const nr = [];
        const ns = [];
        o.changes.forEach((oc) => {
          const l1 = oc.range.startLineNumber;
          const c1 = oc.range.startColumn;
          const ec = c1 + chg.text.length;
          nr.push({ range: new monaco.Range(l1, c1 - 1, l1, ec), text: y });
          ns.push(new monaco.Selection(l1, c1, l1, c1));
        });
        bqCleanUpMe(me);
        setTimeout(() => {
          me.listen = false;
          me.executeEdits('D', nr, ns);
          me.listen = true;
        }, 1);
      } else {
        bqCleanUpMe(me);
      }
    }
  }

  D.ac = (me) => {
    me.tabComplete = 0;
    const ta = me.getDomNode().getElementsByTagName('textarea')[0];
    ta.addEventListener('compositionstart', () => { me.isComposing = 1; });
    ta.addEventListener('compositionend', () => {
      me.isComposing = 0;
      cce && bqChangeHandlerMe(me, cce);
      cce = null;
    });
    me.onDidChangeModelContent((e) => {
      const pk = D.prf.prefixKey();
      const model = me.getModel();
      me.tabComplete = 0;
      if (model.bqc) {
        if (me.isComposing) cce = e;
        else bqChangeHandlerMe(me, e);
      } else if (me.listen && !model.bqc && e.changes.length // === 1
        && e.changes[0].text === pk) {
        model.bqc = e.changes[0].range.startColumn;
      } else if (!e.isRedoing && !e.isUndoing && !e.isFlush) {
        setTimeout(() => {
          const sw = me._contentWidgets['editor.widget.suggestWidget'];
          if (!sw) return;
          const swv = sw.widget.ctxSuggestWidgetVisible.get();
          const r = e.changes[0].range;
          if (r.startLineNumber > model.getLineCount()) return;
          const l = model.getLineContent(r.startLineNumber).toLowerCase();
          const bq2 = e.changes.length && RegExp(`${pk}${pk}\\w*`, 'i').test(l);
          if (swv && !bq2 && sw.widget.list.length === 1) {
            const t = sw.widget.focusedItem.completion.insertText.toLowerCase();
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
    const blurTextDisposable = me.onDidBlurEditorText(() => {
      const fw = (me._overlayWidgets['editor.contrib.findWidget'] || {}).widget;
      if (!fw) return;
      blurTextDisposable.dispose();
      const fi = fw._findInput;
      fi.onKeyDown((e) => {
        const pk = D.prf.prefixKey();
        const s = fi.getValue();
        const be = e.browserEvent;
        const tgt = be.target;
        const p = tgt.selectionStart;
        if (s[p - 1] === pk && D.bq[be.key]
          && !be.altKey && !be.ctrlKey && !be.metaKey && !be.key !== 'Shift') {
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
        if (s[p - 1] === pk && D.bq[be.key]
          && !be.altKey && !be.ctrlKey && !be.metaKey && !be.key !== 'Shift') {
          be.preventDefault();
          fwr.value = s.slice(0, p - 1) + D.bq[be.key] + s.slice(p);
          fw._state.change({ replaceString: fwr.value }, false);
          tgt.selectionStart = p;
          tgt.selectionEnd = p;
        }
      };
    });
    return (x) => { // win:editor or session instance to set up autocompletion in
      const { ac } = me.getModel();
      if (ac && ac.complete) {
        const l = ac.position.lineNumber;
        const c = ac.position.column;
        const manual = me.tabComplete;
        if (D.prf.autocompletion() === 'shell' && manual) {
          const [, prefix] = x.options.join(' ').match(prefixRE) || [];
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
          }
          if (me.tabComplete < 2) {
            me.trigger('editor', 'hideSuggestWidget');
            return;
          }
          me.tabComplete = 0;
        }
        if (!x.options.length || (D.prf.autocompletion() === 'shell' && !manual)) {
          me.trigger('editor', 'hideSuggestWidget');
          return;
        }
        const suggestions = x.options.map(i => ({
          label: i,
          insertText: i,
          range: new monaco.Range(l, c - x.skip, l, c),
        }));
        ac.complete({
          suggestions,
        });
      }
    };
  };
}
