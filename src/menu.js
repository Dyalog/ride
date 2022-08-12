// two menu implementations -- one native and one in html
D.installMenu = function Menu(mx) {
  if (D.el) {
    const pk = D.prf.keys();
    const k = {}; // k:a map of all keyboard shortcuts
    for (let i = 0; i < D.cmds.length; i++) {
      const [c,, d] = D.cmds[i];
      [k[c]] = (pk[c] || d);
    } // c:code, d:defaults
    const render = (x) => {
      let mi;
      if (x[''] === '-') return new D.el.MenuItem({ type: 'separator' });
      const h = {
        label: x[''],
        click: x.action,
        accelerator: x.cmd && k[x.cmd] ? k[x.cmd].replace(/-(.)/g, '+$1') : null,
      };
      if (x.group) {
        h.type = 'radio';
        h.checked = !!x.checked;
      } else if (x.checkBoxPref) {
        h.type = 'checkbox';
        h.checked = !!x.checkBoxPref();
        if (x.action) h.click = () => { x.action(mi.checked); };
        x.checkBoxPref((v) => { mi.checked = !!v; });
      }
      const roles = {
        cut: 1,
        copy: 1,
        paste: 1,
        selectall: 1,
        togglefullscreen: 1,
        window: 1,
        help: 1,
      };
      const r = x[''].replace(/[& ]/g, '').toLowerCase();
      if (r in roles) h.role = r;
      if (x.items) {
        h.submenu = new D.el.Menu();
        x.items.forEach((y) => { h.submenu.append(render(y)); });
      }
      mi = new D.el.MenuItem(h);
      return mi;
    };
    const m = new D.el.Menu();
    mx.forEach((y) => { m.append(render(y)); });
    if (D.mac) D.el.Menu.setApplicationMenu(m);
    else D.elw.setMenu(m);
  } else {
    const arg = mx;
    // DOM structure:
    // ┌.menu───────────────────────────────────────────┐
    // │┌div.m-sub────────────────────────────────┐     │
    // ││            ┌div.m-box──────────────────┐│     │
    // ││┌a.m-opener┐│┌a─────┐┌a─────┐┌div.m-sub┐││     │
    // │││┌span┐    │││┌span┐││┌span┐││         │││     │
    // ││││File│    ││││Open││││Save│││   ...   │││ ... │
    // │││└────┘    │││└────┘││└────┘││         │││     │
    // ││└──────────┘│└──────┘└──────┘└─────────┘││     │
    // ││            └───────────────────────────┘│     │
    // │└─────────────────────────────────────────┘     │
    // └────────────────────────────────────────────────┘
    // Top-level ".m-opener"-s also have class ".m-top"
    let $o; // original focused element
    let $m;
    const mFocus = (anchor) => {
      $m.find('.m-open').removeClass('m-open');
      if (!anchor) { $o && $o.focus(); $o = null; return; }
      $o || ($o = $(':focus'));
      const $a = $(anchor);
      $a.parentsUntil('.menu').addClass('m-open');
      $a.is('.m-top') ? $a.closest('.m-sub').find('a').eq(1).focus() : $a.focus();
    };
    const render = (x) => {
      if (!x) return null;
      if (x[''] === '-') return $('<hr>');
      let acc;
      const name = x[''].replace(/&(.)/g, (_, k) => {
        const r = acc || k === '&' ? k : `<u>${acc = k}</u>`;
        return r;
      }); // acc:access key
      const $a = $(`<a href=#><span>${name}</span></a>`);
      x.cmd && $a.append(`<span class=m-shc data-cmd=${x.cmd}>`);
      if (x.group) {
        $a.addClass(`m-group-${x.group}`)
          .toggleClass('m-checked', !!x.checked)
          .on('mousedown mouseup click', (e) => {
            const $e = $(e.currentTarget);
            $e.closest('.menu').find(`.m-group-${x.group}`).removeClass('m-checked');
            $e.addClass('m-checked');
            mFocus(null);
            x.action && x.action();
            return !1;
          });
      } else if (x.checkBoxPref) {
        x.checkBoxPref((v) => { $a.toggleClass('m-checked', !!v); });
        $a.toggleClass('m-checked', !!x.checkBoxPref())
          .on('mousedown mouseup click', (e) => {
            mFocus(null);
            x.action && x.action($(e.currentTarget).hasClass('m-checked'));
            return !1;
          });
      } else {
        x.action && $a.on('mousedown mouseup click', () => { mFocus(null); x.action(); return !1; });
      }
      if (!x.items) return $a;
      const $b = $('<div class=m-box>');
      return $('<div class=m-sub>')
        .append($a.addClass('m-opener'), $b.append(...x.items.map(render)));
    };
    const leftRight = (d, $e) => { // d: +1 or -1, $e: target element
      if (d > 0 && $e.is('.m-opener')) {
        mFocus($e.next('.m-box').find('a').first());
      } else if (d < 0 && !$e.is('.m-opener') && $e.parents('.m-sub').length > 1) {
        mFocus($e.closest('.m-sub').find('.m-opener').first());
      } else {
        const $t = $m.children();
        const n = $t.length;
        const i = $e.parentsUntil('.menu').last().index();
        mFocus($t.eq((i + d + n) % n).find('a').eq(1));
      }
      return !1;
    };
    const upDown = (d, $e) => { // d: +1 or -1, $e: target element
      if ($e.is('.m-top')) {
        mFocus($e.parent().find(':not(hr)').eq(1));
      } else {
        const $s = $e.closest('.m-box').children(':not(hr)');
        const i = $s.index($e);
        const n = $s.length;
        const $f = $s.eq((i + d + n) % n);
        mFocus($f.is('a') ? $f : $f.find('a').first());
      }
      return !1;
    };
    $m = $('div[class=menu]');
    $m.length || ($m = $('<div class=menu>').prependTo('body'));
    $m.empty()
      .addClass('menu')
      .append(arg.map(render));
    $m.find('>.m-sub>.m-opener').addClass('m-top');
    $m.on('mouseover', 'a', (e) => {
      const t = e.currentTarget;
      $(t).closest('.menu').children().is('.m-open') && mFocus(t);
    });
    $m.on('mousedown click', 'a', (e) => {
      const t = e.currentTarget;
      mFocus($(t).parentsUntil('.menu').last().is('.m-open') && e.type === 'mousedown' ? null : t);
      return !1;
    });
    $m.keydown((e) => {
      switch (e.key) {
        case 'ArrowLeft': leftRight(-1, $(e.target)); break;
        case 'ArrowRight': leftRight(1, $(e.target)); break;
        case 'ArrowUp': upDown(-1, $(e.target)); break;
        case 'ArrowDown': upDown(1, $(e.target)); break;
        case 'Escape': case 'F10': mFocus(null); return !1;
        default:
      }
      return !0;
    });
    $(document).mousedown((e) => { $(e.target).closest('.menu').length || mFocus(null); });
    const updShcs = (h) => {
      const k = {};
      for (let i = 0; i < D.cmds.length; i++) {
        const [c,, d] = D.cmds[i];
        [k[c]] = (h[c] || d);
      } // c:code, d:defaults
      $('.m-shc').each((e) => {
        const $e = $(e.currentTarget);
        $e.text(k[$e.data('cmd')] || '');
      });
    };
    updShcs(D.prf.keys()); D.prf.keys(updShcs);
  }
};
