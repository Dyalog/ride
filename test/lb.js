import test from 'ava';
import { Application } from 'spectron';
import electronPath from 'electron';
import path from 'path';
import temp from 'temp';
import inWin from './_utils';

temp.track();

test.beforeEach(async (t) => {
  const userData = temp.mkdirSync('ride41');
  t.context.app = new Application({
    path: electronPath,
    args: [path.join(__dirname, '..')],
    env: {
      RIDE_SPAWN: 'dyalog',
      spectron_temp_dir: userData,
    },
    webdriverOptions: {
      deprecationWarnings: false,
    },
  });

  await t.context.app.start();
});

test.afterEach.always(async (t) => {
  await t.context.app.stop();
  await temp.cleanupSync();
});

test.serial(
  'lb-show-hide',
  async (t) => {
    const { app } = t.context;
    const c = app.client;
    await c.waitUntilWindowLoaded();

    await c.waitForExist('#lb');
    const lbarVisible = await c.isVisible('#lb');
    await c.execute(inWin, 0, '<LBR>');
    t.is(await c.isVisible('#lb'), !lbarVisible);
    await c.execute(inWin, 0, '<LBR>');
    t.is(await c.isVisible('#lb'), lbarVisible);
  },
);

test.serial(
  'lb-hover',
  async (t) => {
    const { app } = t.context;
    const c = app.client;
    await c.waitUntilWindowLoaded();

    await c.waitForExist('#lb');
    // turn on if not already
    let lbarVisible = await c.isVisible('#lb');
    if (!lbarVisible) {
      await c.execute(inWin, 0, '<LBR>');
      lbarVisible = await c.isVisible('#lb');
    }
    // hover over ⍤
    await c.moveToObject('b=⍤');
    t.true(await c.isVisible('#lb_tip_body'));
    t.is(await c.getText('#lb_tip_desc'), 'JOT DIAERESIS (⍤)');
    // move over tip
    await c.moveToObject('#lb_tip');
    await c.pause(1000);
    t.true(await c.isVisible('#lb_tip'));
    // move over separator
    await c.moveToObject('b=\xA0');
    await c.pause(1000);
    t.false(await c.isVisible('#lb_tip'));
  },
);
