// About dialog
{
  let d;
  let ta; // DOM elements for the dialog and the textarea
  D.abt = function About() {
    const v = D.versionInfo || {};
    const ri = D.remoteIdentification || {};
    const u = 'unknown';
    const db = D.db || localStorage;
    const repr = JSON.stringify;
    let s = '';
    for (let i = 0; i < db.length; i++) {
      const x = db.key(i);
      s += `${i ? ',\n' : ''}    ${repr(x)}:${repr(db.getItem(x))}`;
    }
    const details = 'IDE:'
      + `\n  Version: ${v.version || u}`
      + `\n  Platform: ${navigator.platform || u}`
      + `\n  Date: ${v.date || u}`
      + `\n  Git commit: ${v.rev || u}`
      + `\n  Preferences:{\n${s}\n  }\n`
      + '\nInterpreter:'
      + `\n  Version: ${ri.version || u}`
      + `\n  Platform: ${ri.platform || u}`
      + `\n  Edition: ${ri.arch || u}`
      + `\n  Date: ${(ri.date || u).replace(/^Created: /, '')}\n`;

    if (D.el) {
      const w = new D.el.BrowserWindow({
        width: 600,
        height: 500,
        minWidth: 600,
        minHeight: 500,
        parent: D.elw,
        modal: true,
        webPreferences: {
          nodeIntegration: false,
        },
      });
      D.abtw = w;
      w.loadURL(`file://${__dirname}/about.html`);
      w.webContents.executeJavaScript(`document.getElementById('abt_ta').value=${JSON.stringify(details)};`);
      w.on('closed', () => { delete D.abtw; });
    } else {
      if (!d) {
        d = I.abt;
        I.abt_close.onclick = () => { d.hidden = 1; };
        I.abt_copy.onclick = () => {
          if (D.el) {
            D.el.clipboard.writeText(ta.value);
          } else {
            ta.select();
            document.execCommand('copy');
            ta.selectionEnd = 0;
          }
        };
        I.abt_copy.hidden = !D.el && !document.queryCommandSupported('copy');
        I.abt_contact.onclick = (x) => {
          if (x.target.nodeName === 'A' && /^http/.test(x.target.href)) {
            D.openExternal(x.target.href);
            return !1;
          }
          return !0;
        };
        ta = I.abt_ta;
      }
      D.util.dlg(d, { w: 600, h: 450 });
      ta.value = details;
      ta.scrollTop = 0;
      ta.selectionStart = 0;
      ta.selectionEnd = 0;
      (!I.abt_copy.hidden ? I.abt_copy : I.abt_close).focus();
    }
  };
}
