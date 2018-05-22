import test from 'ava';
import { tfw } from './_utils';

tfw.init({ port: 10000 });

test(
  'cn-app-starts-ok',
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
    await c.leftClick('#cn_neu');
    t.is(await c.getValue('#cn_fav_name'), '');
    await c.waitForExist('#cn_favs .list_sel .name');
    t.is(await c.getText('#cn_favs .list_sel .name'), 'unnamed');
    await c.setValue('#cn_fav_name', 'myFav');
    t.is(await c.getText('#cn_favs .list_sel .name'), 'myFav');
  },
);

test(
  'cn-fav-clone',
  async (t) => {
    t.plan(5);
    const { app } = t.context;
    const c = app.client;
    await c.leftClick('#cn_cln');
    t.is(await c.getValue('#cn_fav_name'), '(copy)');
    await c.waitForExist('#cn_favs .list_sel .name');
    t.is(await c.getText('#cn_favs .list_sel .name'), '(copy)');
    await c.setValue('#cn_fav_name', 'myCopy');
    t.is(await c.getText('#cn_favs .list_sel .name'), 'myCopy');

    await c.leftClick('#cn_cln');
    t.is(await c.getValue('#cn_fav_name'), 'myCopy(copy)');
    await c.waitForExist('#cn_favs .list_sel .name');
    t.is(await c.getText('#cn_favs .list_sel .name'), 'myCopy(copy)');
  },
);

test(
  'cn-start-raw',
  async (t) => {
    t.plan(3);
    const { app } = t.context;
    const c = app.client;
  
    await c.leftClick('#cn_neu');
    await c.selectByValue('#cn_type', 'start');
    t.is(await c.getValue('#cn_type'), 'start');

    await c.selectByValue('#cn_subtype', 'raw');
    t.is(await c.getValue('#cn_subtype'), 'raw');

    await c.leftClick('#cn_go');
    await c.waitForExist('#ide .lm_tab.lm_active');
    t.is(await c.getAttribute('#ide .lm_tab.lm_active', 'title'), 'Session');
  },
);
