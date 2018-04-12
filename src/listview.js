D.ListView = function ListView(e, o) {
  // e=containing element for ListView
  // o=options for ListView
  const lv = this;
  lv.dom = I[e]; lv.dom.hidden = 0;
  lv.item_class = o.item_class || '';
  lv.no_item_message = o.no_item_message || 'No Items!';
  lv.dom.className = 'ctl_listview';
  lv.click_handler = o.click_handler || (() => { });
  lv.items = [];
  lv.selected = { tid: 0 };
  lv.dom.onclick = (event) => {
    let cn = event.target;
    while ((cn !== lv.dom) && cn.className.indexOf('ctl_listview_item') === -1) cn = cn.parentNode;

    if (cn !== lv.dom) {
      $(lv.dom.querySelectorAll('.ctl_listview_item')).removeClass('selected');
      $(cn).addClass('selected');
      lv.selected = lv.items[+cn.dataset.itemid];
      lv.click_handler(lv.selected);
    }
  };

  lv.render = (array) => {
    lv.items = o.sortFn ? array.sort(o.sortFn) : array;
    const rf = o.renderItem || (x => x);
    const hf = o.headerFunction || (() => '');
    let html = [`<tr><td>${lv.no_item_message}</td></tr>`];
    if (array.length > 0) {
      html = array.map((l, i) => `<tr class="${lv.item_class} ctl_listview_item" data-itemid=${i}>${rf(l)}</tr>\n`);
    }
    lv.dom.innerHTML = `<table>\n<thead>\n${hf()}\n</thead>\n<tbody>\n${html.join('')}</tbody>\n</table>`;
  };

  lv.render([]);
};
