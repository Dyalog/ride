// support for presentations
(function Demo() {
  let lines = [];
  let index = -1;
  let inp; // inp:an <input type=file> used to open the file chooser dialog
  function move(d) {
    if (index + d >= 0 && index + d < lines.length) {
      index += d;
      D.ide.wins[0].loadLine(lines[index]);
    }
  }
  // key display mode:
  let $p; // dom element for the pending key or null if key display mode is off
  const meta = new Set(['Shift', 'Alt', 'Ctrl', 'Cmd', 'Meta', 'Win']);
  function keyInfo(e) { // returns a pair of the key name and an "is complete?" flag
    const be = e.browserEvent;
    const kbs = D.wins[0].me._standaloneKeybindingService;
    const mk = kbs.resolveKeyboardEvent(e);
    const isMeta = meta.has(monaco.KeyCode[e.keyCode]);
    const s = !isMeta || be.altKey || be.shiftKey || be.ctrlKey || be.metaKey ? mk.getLabel() : '';
    return [s, !isMeta]; // s:key name, c:is the key combination complete?
  }
  function loadDemoScript(f) { // f:path to file, ignored if empty
    f && nodeRequire('fs').readFile(f, 'utf8', (err, s) => {
      if (err) { $.err('Cannot load demo file'); return; }
      index = -1;
      let indent = 6;
      lines = s.replace(/^[\ufeff\ufffe]/, '').split(/\r?\n/)
        .map((l) => {
          const [, m] = l.match(/^\s*&&(.*)/) || [];
          if (m) {
            m.replace(/(\w*)=([^\s]*)/g, (x, k, v) => {
              k === 'indent' && (indent = +v);
            });
          }
          return ' '.repeat(indent) + l;
        })
        .filter(x => !/^\s*&(⍝|&)/.test(x));
    });
  }
  D.el && loadDemoScript(process.env.RIDE_DEMO_SCRIPT);
  const handlers = [];
  $.extend(D.commands, {
    DMN() { move(1); }, // next line
    DMP() { move(-1); }, // prev line
    DMR() { // load demo script
      if (!D.el || D.ide.floating) return;
      if (!inp) {
        inp = document.createElement('input');
        inp.type = 'file';
        inp.hidden = 1;
        document.body.appendChild(inp);
        inp.onchange = () => { loadDemoScript(inp.files[0].path); };
      }
      inp.value = '';
      inp.click();
    },
    DMK() { // toggle key display mode
      if ($p) {
        // $(document).off('.demo');
        handlers.forEach(h => h.dispose()); handlers.length = 0;
        $('#demo-keys').remove();
        $p = null;
        return;
      }
      $('body').append($('<div id=demo-keys>').append($p = $('<span>').hide()));
      const { me } = D.wins[0];
      handlers.push(me.onKeyDown((e) => {
        const s = keyInfo(e)[0]; $p.text(s).toggle(!!s);
      }));

      // $(document)
      // .on('keydown.demo', (e) => { const s = keyInfo(e)[0]; $p.text(s).toggle(!!s); })
      // .on('keyup.demo', (e) => {
      handlers.push(me.onKeyUp((e) => {
        const h = keyInfo(e);
        const [s, c] = h;
        if (c) {
          $p.hide();
          const $k = $('<span>').text(s).insertBefore($p);
          setTimeout(() => { $k.fadeOut(1000); }, 2000);
        } else {
          $p.text(s).toggle(!!s);
        }
      }));
    },
  });
}());
