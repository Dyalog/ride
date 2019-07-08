#!/usr/bin/env node
D = { modules: {} };
require('../src/hlp');
const http = require('http');

D.InitHelp(process.argv[2]);
let n = 0; // n:total
let m = 0; // m:failed
const h = D.hlp;
const a = Object.keys(h).map(k => h[k]).sort();
const o = { host: 'help.dyalog.com', port: 80, path: '' };
const rec = (i) => {
  if (i >= a.length) {
    console.log(m ? `failed:${m}/${n}` : 'ok');
    return;
  }
  n += 1;
  o.path = escape(a[i].replace(/^https:\/\/[a-z0-9.]+\//i, '/').replace(/#.*/, ''));
  http.get(o, (x) => {
    const c = x.statusCode;
    console.log(`${c === 200 ? '   ' : c} ${a[i]}`);
    m += c !== 200;
    rec(i + 1);
  })
    .on('error', (x) => {
      console.log(`${JSON.stringify(x.message)} ${a[i]}`);
      m += 1;
      rec(i + 1);
    });
};
rec(0);
