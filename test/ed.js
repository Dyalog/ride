import test from 'ava';
import { tfw } from './_utils';

tfw.init({ src: 'ed', RIDE_SPAWN: 'dyalog' });

test(
  'ed-uses-os-eol',
  async (t) => {
    const { app } = t.context;
    const c = app.client;
    let text;

    await c.execute(() => { D.prf.prefixKey('<'); D.prf.ilf(0); D.prf.indent(-1); });
    const eol = (await c.execute('D.win')) ? '\r\n' : '\n';
    await c.keys([')ED <] ls', 'Enter']);
    await c.waitForExist('#ide .ride_win.edit_trace');
    await c.keys(['A', 'Enter', 'A', 'Control', 'a', 'c', 'Control', 'Escape']);
    text = await app.electron.clipboard.readText();
    t.is(text, `A${eol}A`);

    await c.waitForExist('#ide .ride_win.edit_trace', true);
    await c.waitForExist('#ide .ride_win');
    await c.keys([')ED f', 'Enter']);
    await c.waitForExist('#ide .ride_win.edit_trace');
    await c.keys(['Enter', '1', 'Control', 'a', 'c', 'Control', 'Escape']);
    text = await app.electron.clipboard.readText();
    t.is(text, `f${eol}1`);

  },
);
