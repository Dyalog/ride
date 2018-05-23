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

class TFW {
  constructor() {
    this.counter = 0;
  }
  init(options) {
    const o = options || {};
    test.beforeEach(async (t) => {
      this.counter += 1;
      const x = t.context;
      x.userData = temp.mkdirSync('ride41');
      const env = {
        spectron_temp_dir: x.userData,
      };
      o.RIDE_SPAWN && (env.RIDE_SPAWN = o.RIDE_SPAWN);
      x.app = new Application({
        path: electronPath,
        args: [path.join(__dirname, '..')],
        env,
        webdriverOptions: {
          deprecationWarnings: false,
        },
        port: (o.port || 9515) + this.counter,
      });

      await x.app.start();
      await x.app.client.waitUntilWindowLoaded();
    });

    test.afterEach.always(async (t) => {
      const x = t.context;
      if (x.app.isRunning()) {
        await x.app.stop();
      }
      rimraf.sync(x.userData);
    });
  }
}
export const tfw = new TFW();
