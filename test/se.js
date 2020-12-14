const test = require('ava');
const { sessionLastLines, inWin, tfw } = require('./_utils');

tfw.init({ src: 'se', RIDE_SPAWN: 'dyalog' });

test(
  'se-simple-expression',
  async (t) => {
    const { app } = t.context;
    const c = app.client;

    await c.keys(['1 2 3+4 5 6']);
    let r = await c.execute(sessionLastLines, 1);
    t.is(r[0], '      1 2 3+4 5 6');
    await c.keys(['Enter']);
    await c.pause(100);
    r = await c.execute(sessionLastLines, 3);
    t.deepEqual(r, [
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
    await c.keys(['<a']);
    await c.keys(['<s']);
    await c.keys(['<d']);
    await c.keys(['<w']);
    r = await c.execute(sessionLastLines, 1);
    t.is(r[0], '      ⍺⌈⌊⍵');
    await c.execute(inWin, 0, '<QT>');
    await c.keys(['<', 'Shift', 'p']);
    await c.keys(['<', 'Shift', 'o']);
    await c.pause(100);
    r = await c.execute(sessionLastLines, 1);
    t.is(r[0], '      ⍣⍥');
  },
);


test(
  'se-type-ahead',
  async (t) => {
    const { app } = t.context;
    const c = app.client;

    await c.execute(() => { D.prf.prefixKey('<'); });
    await c.pause(100);
    await c.keys(['<l']);
    await c.keys(['DL 1', 'Enter']);
    await c.pause(100);
    await c.keys(['<i']);
    await c.keys(['6', 'Enter']);
    await c.pause(1500);
    const r = await c.execute(sessionLastLines, 3);
    t.deepEqual(r, [
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

    await c.execute(() => { D.prf.prefixKey('<'); });
    await c.keys(['<l']);
    await c.keys(["FX 'f' '<l"]);
    await c.keys(['<[']);
    await c.keys(["''hello'''", 'Enter']);
    await c.pause(100);
    await c.keys(['f', 'Enter']);
    await c.pause(100);
    r = await c.execute(sessionLastLines, 3);
    t.deepEqual(r, [
      '      f',
      'hello',
      '      ',
    ]);

    await c.keys(['f', 'Control', 'Enter']);
    const edit_trace = await c.$('#ide .ride_win.edit_trace');
    await edit_trace.waitForExist();
    await c.keys(['Control', 'Enter', 'Enter']);
    await c.pause(100);
    r = await c.execute(sessionLastLines, 3);
    t.deepEqual(r, [
      '      f',
      'hello',
      '      ',
    ]);
  },
);
