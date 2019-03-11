import test from 'ava';
import { sessionLastLines, tfw } from './_utils';

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
      D.prf.indent(-1);
      D.prf.indentOnOpen(0);
    });
    const [mac, win] = (await c.execute(() => [D.mac, D.win])).value;
    const eol = win ? '\r\n' : '\n';
    const cc = mac ? 'Meta' : 'Control';

    await c.keys([')ED <] ls', 'Enter']);
    await c.waitForExist('#ide .ride_win.edit_trace');
    await c.keys(['A', 'Enter', 'A', cc, 'a', 'c', cc, 'Escape']);
    text = await app.electron.clipboard.readText();
    t.is(text, `A${eol}A`);

    await c.waitForExist('#ide .ride_win.edit_trace', 1000, true);
    await c.waitForExist('#ide .ride_win');
    await c.keys([')ED f', 'Enter']);
    await c.waitForExist('#ide .ride_win.edit_trace');
    await c.keys(['Enter', '1', cc, 'a', 'c', cc, 'Escape']);
    text = await app.electron.clipboard.readText();
    t.is(text, `f${eol}1`);

    // the following test will pass if interpreter is configured to autoformat and indent
    await c.waitForExist('#ide .ride_win.edit_trace', 1000, true);
    await c.waitForExist('#ide .ride_win');
    await c.keys([')ED f', 'Enter']);
    await c.waitForExist('#ide .ride_win.edit_trace');
    await c.keys([cc, 'a', 'c', cc, 'Escape']);
    text = await app.electron.clipboard.readText();
    t.is(text, ` f${eol} 1`);
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
    })).value;
    const cc = mac ? 'Meta' : 'Control';
    let text;

    await c.keys([')ED f', 'Enter']);
    await c.waitForExist('#ide .ride_win.edit_trace');
    await c.execute(() => D.wins[1].me_ready);
    await c.keys(['Enter', 'ab', 'F2']);
    await c.keys([cc, 'a', 'c', cc, 'Escape']);
    text = await app.electron.clipboard.readText();
    t.is(text.slice(-5), '⍝  ab');

    await c.execute('D.prf.floating(1)');
    await c.pause(100);
    const whs = (await c.windowHandles()).value;
    await c.keys([')ED g', 'Enter']);
    await c.pause(100);
    await c.waitUntil(() => c.execute('D.wins[1] && D.wins[1].meIsReady'), 10000);
    const [wh] = (await c.windowHandles()).value.filter(x => !whs.includes(x));
    await c.window(wh);
    await c.pause(1000);
    await c.keys(['Enter', 'cd', 'F2']);
    await c.keys([cc, 'a', 'c', cc, 'Escape']);
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
    await c.waitForExist('#ide .ride_win.edit_trace');
    await c.keys(['F2']);
    await c.pause(500);
    await c.keys(['Escape']);
    await c.waitForExist('#ide .ride_win.edit_trace', 1000, true);
    await c.waitForExist('#ide .ride_win');
    await c.keys(["⎕STOP 'Sol.foo'", 'Enter']);
    await c.pause(500);
    const r = await c.execute(sessionLastLines, 2);
    t.is(r.value[0], '1');
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
    await c.waitForExist('#ide .ride_win.edit_trace');
    await c.keys(['F2']);
    await c.pause(500);
    await c.keys(['Escape']);
    await c.waitForExist('#ide .ride_win.edit_trace', 1000, true);
    await c.waitForExist('#ide .ride_win');
    await c.keys(["⎕STOP 'Sol.foo'", 'Enter']);
    await c.pause(500);
    const r = await c.execute(sessionLastLines, 2);
    t.is(r.value[0], '1');
  },
);
