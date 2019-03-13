import test from 'ava';
import { tfw, inWin, sessionLastLines } from './_utils';

tfw.init({ src: 'se', RIDE_SPAWN: 'dyalog' });

test(
  'se-simple-expression',
  async (t) => {
    const { app } = t.context;
    const c = app.client;

    await c.keys(['1 2 3+4 5 6']);
    let r = await c.execute(sessionLastLines, 1);
    t.is(r.value[0], '      1 2 3+4 5 6');
    await c.keys(['Enter']);
    await c.pause(100);
    r = await c.execute(sessionLastLines, 3);
    t.deepEqual(r.value, [
      '      1 2 3+4 5 6',
      '5 7 9',
      '      ',
    ]);
  },
);

test(
  'se-prefix-completion',
  async (t) => {
    const { app } = t.context;
    const c = app.client;
    let r;

    await c.execute(() => { D.prf.prefixKey('<'); });
    await c.keys(['<a<s<d<w']);
    r = await c.execute(sessionLastLines, 1);
    t.is(r.value[0], '      ⍺⌈⌊⍵');
    await c.execute(inWin, 0, '<QT>');
    await c.keys(['Shift', '<p<o']);
    await c.pause(100);
    r = await c.execute(sessionLastLines, 1);
    t.is(r.value[0], '      ⍣⍥');
  },
);


test(
  'se-type-ahead',
  async (t) => {
    const { app } = t.context;
    const c = app.client;

    await c.execute(() => { D.prf.prefixKey('<'); });
    await c.pause(100);
    await c.keys(['<lDL 1', 'Enter']);
    await c.pause(100);
    await c.keys(['<i6', 'Enter']);
    await c.pause(1500);
    const r = await c.execute(sessionLastLines, 3);
    t.deepEqual(r.value, [
      '      ⍳6',
      '1 2 3 4 5 6',
      '      ',
    ]);
  },
);

test(
  'se-quad-output-while-tracing',
  async (t) => {
    const { app } = t.context;
    const c = app.client;
    let r;

    await c.keys(["`lFX 'f' '`l`[''hello'''", 'Enter']);
    await c.pause(100);
    await c.keys(['f', 'Enter']);
    await c.pause(100);
    r = await c.execute(sessionLastLines, 3);
    t.deepEqual(r.value, [
      '      f',
      'hello',
      '      ',
    ]);

    await c.keys(['f', 'Control', 'Enter']);
    await c.waitForExist('#ide .ride_win.edit_trace');
    await c.keys(['Control', 'Enter', 'Enter']);
    await c.pause(100);
    r = await c.execute(sessionLastLines, 3);
    t.deepEqual(r.value, [
      '      f',
      'hello',
      '      ',
    ]);
  },
);
