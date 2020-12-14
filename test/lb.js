const test = require('ava');
const { sessionLastLines, inWin, tfw } = require('./_utils');

tfw.init({ src: 'lb', RIDE_SPAWN: 'dyalog' });

test(
  'lb-show-hide',
  async (t) => {
    const { app } = t.context;
    const c = app.client;
    
    const lb = await c.$('#lb');
    await lb.waitForExist();
    
    const lbarVisible = await lb.isDisplayedInViewport();
    await c.execute(inWin, 0, '<LBR>');
    t.is(await lb.isDisplayedInViewport(), !lbarVisible);
    await c.execute(inWin, 0, '<LBR>');
    t.is(await lb.isDisplayedInViewport(), lbarVisible);
  },
);

test(
  'lb-hover',
  async (t) => {
    const { app } = t.context;
    const c = app.client;

    const lb = await c.$('#lb');
    await lb.waitForExist();
    
    // turn on if not already
    let lbarVisible = await lb.isDisplayedInViewport();
    if (!lbarVisible) {
      await c.execute(inWin, 0, '<LBR>');
      lbarVisible = await lb.isDisplayedInViewport();
    }
    // hover over ⍤
    const lb_paw = await c.$('b=⍤');
    await lb_paw.moveTo();
    await c.pause(1000);
    
    const lb_tip_body = await c.$('#lb_tip_body');
    const lb_tip_desc = await c.$('#lb_tip_desc');
    t.true(await lb_tip_body.isDisplayedInViewport());
    t.is(await lb_tip_desc.getText(), 'JOT DIAERESIS (⍤)');
    
    // move over tip
    const lb_tip = await c.$('#lb_tip');
    await lb_tip.moveTo();
    await c.pause(1000);
    t.true(await lb_tip.isDisplayedInViewport());
    // move over separator
    const lb_nbs = await c.$('b=\xA0');
    await lb_nbs.moveTo();
    await c.pause(1000);
    t.false(await lb_tip.isDisplayedInViewport());
  },
);

test(
  'lb-click',
  async (t) => {
    const { app } = t.context;
    const c = app.client;

    const lb = await c.$('#lb');
    await lb.waitForExist();
    const lb_power = await c.$('b=⍣');
    await lb_power.click();
    const r = await c.execute(sessionLastLines, 1);
    t.is(r[0].slice(-1), '⍣');
  },
);
