const test = require('ava');
const  { tfw } = require('./_utils');

tfw.init({ src: 'cn' });

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
    await (await c.$('#cn_neu')).click();

    const fav_name = await c.$('#cn_fav_name');
    const favs = await c.$('#cn_favs .list_sel .name');

    t.is(await fav_name.getValue(), '');
    await favs.waitForExist();
    t.is(await favs.getText(), 'unnamed');
    await fav_name.setValue('myFav');
    t.is(await favs.getText(), 'myFav');
  },
);

test(
  'cn-fav-clone',
  async (t) => {
    t.plan(5);
    const { app } = t.context;
    const c = app.client;

    const cln = await c.$('#cn_cln');
    await cln.click();

    const fav_name = await c.$('#cn_fav_name');
    const favs = await c.$('#cn_favs .list_sel .name');

    t.is(await fav_name.getValue(), '(copy)');
    await favs.waitForExist();
    t.is(await favs.getText(), '(copy)');
    await fav_name.setValue('myCopy');
    t.is(await favs.getText(), 'myCopy');

    await cln.click();
    t.is(await fav_name.getValue(), 'myCopy(copy)');
    await favs.waitForExist();
    t.is(await favs.getText(), 'myCopy(copy)');
  },
);

test(
  'cn-start-raw',
  async (t) => {
    t.plan(3);
    const { app } = t.context;
    const c = app.client;

    const cn_neu = await c.$('#cn_neu');
    await cn_neu.click();

    const cn_type = await c.$('#cn_type');
    await cn_type.selectByVisibleText('Start');
    t.is(await cn_type.getValue(), 'start');

    const cn_subtype = await c.$('#cn_subtype');
    await cn_subtype.selectByVisibleText('Local');
    t.is(await cn_subtype.getValue(), 'raw');

    const cn_go = await c.$('#cn_go');
    await cn_go.click();

    const ide = await c.$('#ide .lm_tab.lm_active');
    await ide.waitForExist();
    t.is(await ide.getAttribute('title'), 'Session');
  },
);
