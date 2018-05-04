import test from 'ava';
import { Application } from 'spectron';
import electronPath from 'electron';
import path from 'path';

test.beforeEach(async (t) => {
  t.context.app = new Application({
    path: electronPath,
    args: [path.join(__dirname, '..')],
    webdriverOptions: {
      deprecationWarnings: false,
    },
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
  'cn-fav-new',
  async (t) => {
    t.plan(3);
    const { app } = t.context;
    const c = app.client;
    await c.waitUntilWindowLoaded();
    await c.leftClick('#cn_neu');
    t.is(await c.getValue('#cn_fav_name'), '');
    await c.waitForExist('#cn_favs .list_sel .name');
    t.is(await c.getText('#cn_favs .list_sel .name'), 'unnamed');
    await c.setValue('#cn_fav_name', 'myFav');
    t.is(await c.getText('#cn_favs .list_sel .name'), 'myFav');
  },
);

test(
  'cn-start-raw',
  async (t) => {
    t.plan(3);
    const { app } = t.context;
    const c = app.client;
    await c.waitUntilWindowLoaded();

    await c.leftClick('#cn_neu');
    await c.selectByValue('#cn_type', 'start');
    t.is(await c.getValue('#cn_type'), 'start');

    await c.selectByValue('#cn_subtype', 'raw');
    t.is(await c.getValue('#cn_subtype'), 'raw');

    await c.leftClick('#cn_go');
    await c.waitForExist('#ide .lm_tab.lm_active .lm_title');
    t.is(await c.getText('#ide .lm_tab.lm_active .lm_title'), 'Session');

  },
);
