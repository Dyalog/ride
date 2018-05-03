import test from 'ava';
import { Application } from 'spectron';
import electronPath from 'electron';
import path from 'path';

test.beforeEach((t) => {
  t.context.app = new Application({
    path: electronPath,
    args: [path.join(__dirname, '..')],
  });

  return t.context.app.start();
});

test.afterEach.always(t => t.context.app.stop());

test('check app starts ok', t =>
  t.context.app.client.waitUntilWindowLoaded()
    .getWindowCount().then((count) => {
      t.is(count, 3);
    }).browserWindow.isMinimized().then((min) => {
      t.false(min);
    }).browserWindow.isDevToolsOpened().then((opened) => {
      t.false(opened);
    }).browserWindow.isVisible().then((visible) => {
      t.true(visible);
    }).browserWindow.isFocused().then((focused) => {
      t.true.skip(focused);
    }).browserWindow.getBounds().then((bounds) => {
      t.true(bounds.width > 0);
      t.true(bounds.height > 0);
    }));
