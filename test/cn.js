import test from 'ava';
import { Application } from 'spectron';
import electronPath from 'electron';
import path from 'path';

test.beforeEach(async (t) => {
  t.context.app = new Application({
    path: electronPath,
    args: [path.join(__dirname, '..')],
  });

  await t.context.app.start();
});
// cmd /V /C "set RIDE_SPAWN=dyalog&& npm start"

test.afterEach.always(async (t) => {
  await t.context.app.stop();
});

test(
  'check app starts ok',
  async (t) => {
    const { app } = t.context;
    await app.client.waitUntilWindowLoaded();
    const win = app.browserWindow;

    t.is(await app.client.getWindowCount(), 3);
    t.false(await win.isMinimized());
    t.false(await win.isDevToolsOpened());
    t.true(await win.isVisible());
    t.true.skip(await win.isFocused());
    const { width, height } = await win.getBounds();
    t.true(width > 0);
    t.true(height > 0);
  },
);

test(
  'cn - start raw',
  async (t) => {
    t.plan(2);
    const { app } = t.context;
    const c = app.client;
    await c.waitUntilWindowLoaded();

    await  c.selectByValue('#cn_type', 'start');
    t.is(await c.getValue('#cn_type'), 'start');
    await c.selectByValue('#cn_subtype', 'raw');
    t.is(await c.getValue('#cn_subtype'), 'raw');
  },
);
