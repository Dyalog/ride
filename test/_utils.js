const test = require('ava');
const { Application } = require('spectron');
const electronPath = require('electron');
const path = require('path');
const temp = require('temp');
const rimraf = require('rimraf');

exports.inWin = function (id, s) {
  const w = D.ide.wins[id];
  s.replace(/<(.+?)>|(.)/g, (_, x, y) => {
    y ? w.insert(y) : D.commands[x] && D.commands[x](w.me);
  });
}

exports.sessionLastLines = function(n) {
  return D.ide.wins[0].me.getModel().getLinesContent().slice(-n);
}

class TFW {
  constructor() {
    this.counter = 0;
  }

  init(options) {
    const o = options || {};
    test.beforeEach(async (t) => {
      this.counter += 1;
      const x = t.context;
      x.userData = temp.mkdirSync('ride');
      const env = {
        spectron_temp_dir: x.userData,
      };
      o.RIDE_SPAWN && (env.RIDE_SPAWN = o.RIDE_SPAWN);
      x.app = new Application({
        path: electronPath,
        args: ['.'],
        env,
        webdriverOptions: {
          deprecationWarnings: true,
        },
        chromeDriverArgs: ['remote-debugging-port=9222'],
      });

      await x.app.start();
      const c = x.app.client;
      await c.waitUntilWindowLoaded();
      await (await c.$('#splash')).waitForDisplayed({timeout: 10000, reverse: true});
      if (o.src !== 'cn') await (await c.$('#ide .lm_tab.lm_active')).waitForExist();
    });

    test.afterEach.always(async (t) => {
      const x = t.context;
      if (x.app && x.app.isRunning()) {
        await x.app.stop();
      }
      rimraf.sync(x.userData);
    });
  }
}
exports.tfw = new TFW();
