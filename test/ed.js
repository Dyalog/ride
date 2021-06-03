const test = require('ava');
const { sessionLastLines, tfw } = require('./_utils');

tfw.init({ src: 'ed', RIDE_SPAWN: 'dyalog' });

test(
  'ed-uses-os-eol',
  async (t) => {
    const { app } = t.context;
    const c = app.client;
    let text;

    await c.execute(() => {
      D.prf.prefixKey('<');
      D.prf.ilf(0);
      D.prf.ime(0);
      D.prf.indent(-1);
      D.prf.indentOnOpen(0);
    });
    const [mac, win] = (await c.execute(() => [D.mac, D.win]));
    const eol = win ? '\r\n' : '\n';
    const cc = mac ? 'Meta' : 'Control';

    await c.keys([')ED <]']);
    await c.keys([' ls', 'Enter']);

    const edit_trace = await c.$('#ide .ride_win.edit_trace');
    await edit_trace.waitForExist();

    await c.keys(['A', 'Enter', 'A']);
    await c.keys([cc, 'a', 'c']);
    await c.keys(['Escape']);
    text = await app.electron.clipboard.readText();
    t.is(text, `A${eol}A`);

    await c.pause(1000);

    const ride_win = await c.$('#ide .ride_win');
    await ride_win.waitForExist();

    await c.keys([')ED f', 'Enter']);
    await edit_trace.waitForExist();

    await c.keys(['Enter', '2']);
    await c.keys([cc, 'a', 'c']);
    await c.keys(['Escape']);
    text = await app.electron.clipboard.readText();
    t.is(text, `f${eol}2`);

    await c.pause(1000);

    await c.keys([')ED f', 'Enter']);

    await edit_trace.waitForExist();

    await c.keys([cc, 'a', 'c']);
    await c.keys(['Escape']);
    text = await app.electron.clipboard.readText();
    t.is(text, ` f${eol} 2`);
  },
);

test(
  'ed-commands-via-pfkeys',
  async (t) => {
    const { app } = t.context;
    const c = app.client;
    const mac = (await c.execute(() => {
      const pf = D.prf.pfkeys();
      pf[2] = '<AO>';
      D.prf.pfkeys(pf);
      return D.mac;
    }));
    const cc = mac ? 'Meta' : 'Control';
    let text;

    await c.keys([')ED f', 'Enter']);

    const edit_trace = await c.$('#ide .ride_win.edit_trace');
    await edit_trace.waitForExist();

    await c.execute(() => D.wins[1].me_ready);
    await c.keys(['Enter', 'ab']);
    await c.keys(['F2']);
    await c.keys([cc, 'a', 'c']);
    await c.keys(['Escape']);
    text = await app.electron.clipboard.readText();
    t.is(text.slice(-5), '⍝  ab');

    await c.execute(() => { D.prf.floating(1) });
    await c.pause(100);
    const whs = await c.getWindowHandles();
    await c.keys([')ED g', 'Enter']);
    await c.pause(100);
    await c.pause(2000);
    const [wh] = (await c.getWindowHandles()).filter(x => !whs.includes(x));
    await c.switchToWindow(wh);
    await c.waitUntil(async () => {
      return await c.execute(() => D.ide.wins[1] && D.ide.wins[1].meIsReady)
    }, { timeout: 10000 });
    await c.keys(['Enter', 'cd', 'F2']);
    await c.keys([cc, 'a', 'c']);
    await c.keys(['Escape']);
    text = await app.electron.clipboard.readText();
    t.is(text.slice(-5), '⍝  cd');
  },
);

test(
  'ed-set-stops-in-traced-script',
  async (t) => {
    const { app } = t.context;
    const c = app.client;

    await c.execute(() => {
      D.prf.ilf(0);
      D.prf.indentOnOpen(0);
      const pf = D.prf.pfkeys();
      pf[2] = '<BP>';
      D.prf.pfkeys(pf);
      return D.mac;
    });

    await c.keys(["⎕FIX ':Namespace Sol' '∇ foo' '⍝' '⍝' '⍝' '⍝' '∇' ':EndNamespace'", 'Enter']);
    await c.keys(['Sol.foo', 'Control', 'Enter', 'Control']);

    const edit_trace = await c.$('#ide .ride_win.edit_trace');
    await edit_trace.waitForExist();

    await c.keys(['F2']);
    await c.pause(500);
    await c.keys(['Escape']);

    const ride_win = await c.$('#ide .ride_win');
    await ride_win.waitForExist();

    await c.keys(["⎕STOP 'Sol.foo'", 'Enter']);
    await c.pause(500);
    const r = await c.execute(sessionLastLines, 2);
    t.is(r[0], '1');
  },
);

test.failing(
  'ed-set-stops-in-traced-script-with-ilf',
  async (t) => {
    const { app } = t.context;
    const c = app.client;

    await c.execute(() => {
      D.prf.ilf(1);
      D.prf.indentOnOpen(1);
      const pf = D.prf.pfkeys();
      pf[2] = '<BP>';
      D.prf.pfkeys(pf);
      return D.mac;
    });

    await c.keys(["⎕FIX ':Namespace Sol' '∇ foo' '⍝' '⍝' '⍝' '⍝' '∇' ':EndNamespace'", 'Enter']);
    await c.keys(['Sol.foo', 'Control', 'Enter', 'Control']);

    const edit_trace = await c.$('#ide .ride_win.edit_trace');
    await edit_trace.waitForExist();

    await c.keys(['F2']);
    await c.pause(500);
    await c.keys(['Escape']);

    const ride_win = await c.$('#ide .ride_win');
    await ride_win.waitForExist();

    await c.keys(["⎕STOP 'Sol.foo'", 'Enter']);
    await c.pause(500);
    const r = await c.execute(sessionLastLines, 2);
    t.is(r[0], '1');
  },
);
