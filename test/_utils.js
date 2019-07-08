import test from 'ava';
import { Application } from 'spectron';
import electronPath from 'electron';
import path from 'path';
import temp from 'temp';
import rimraf from 'rimraf';

export function inWin(id, s) {
  const w = D.ide.wins[id];
  s.replace(/<(.+?)>|(.)/g, (_, x, y) => {
    y ? w.insert(y) : D.commands[x] && D.commands[x](w.me);
  });
}

export function sessionLastLines(n) {
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
          deprecationWarnings: false,
        },
        port: (TFW.portMap[o.src] || 9515) + this.counter,
      });

      await x.app.start();
      await x.app.client.waitUntilWindowLoaded();
      await x.app.client.waitForVisible('#splash', 10000, true);
      if (o.src !== 'cn') await x.app.client.waitForExist('#ide .lm_tab.lm_active');
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
TFW.portMap = {
  cn: 10000,
  lb: 10010,
  se: 10020,
  ed: 10030,
};
export const tfw = new TFW();
