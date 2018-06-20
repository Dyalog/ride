// debug pane
D.DBG = function DBG() {
  const dbg = this;
  const encodeHTML = i => $('<div/>').text(i).html();

  dbg.dom = I.debug;
  dbg.dom.hidden = 0;
  dbg.sistack = new D.ListView('sistack', {
    item_class: 'stackitem',
    click_handler(e) { D.send('SetSIStack', { stack: e.description }); },
    no_item_message: '&lt;no stack&gt;',
    renderItem(item) {
      return `<td class=stack_desc> ${encodeHTML(item.description)}</td>`;
    },
  });
  dbg.threads = new D.ListView('threads', {
    item_class: 'threaditem',
    click_handler(e) { D.send('SetThread', { tid: e.tid }); },
    sortFn(p, n) { return p.tid - n.tid; },
    renderItem(item) {
      return `<td class=thread_desc>${encodeHTML(item.description)}</td>`
           + `<td class=thread_state>${encodeHTML(item.state)}</td>`
           + `<td class=thread_tid>${encodeHTML(item.tid)}</td>`
           + `<td class=thread_flags>${encodeHTML(item.flags)}</td>`;
    },
    // headerFunction:function(){return '<th>Desc.</th><th>State</th><th>TID</th><th>Flags</th>'},
    no_item_message: '&lt;no threads&gt;',
  });
  // dbg.tb = dbg.dom.querySelector('.toolbar');
  dbg.tb = $(dbg.dom).find('a');
  dbg.tb.mousedown((x) => {
    if (x.currentTarget.matches('.tb_btn')) {
      x.currentTarget.className += ' armed';
      x.preventDefault();
    }
  });
  dbg.tb.on('mouseout mouseup', (x) => {
    if (x.currentTarget.matches('.tb_btn')) {
      x.currentTarget.classList.remove('armed');
      x.preventDefault();
    }
  });
  dbg.tb.click((x) => {
    const t = x.currentTarget;
    if (t.matches('.tb_btn')) {
      const c = t.className.replace(/^.*\btb_([A-Z]{2,3})\b.*$/, '$1');
      dbg[c] && dbg[c]();
      return !1;
    }
    return !0;
  });
};
D.DBG.prototype = {
  TFR() { D.ide.getStats(); },
  RM() { D.send('Continue', { win: this.threads.selected.tid }); },
  MA() { D.send('RestartThreads', {}); },
};
