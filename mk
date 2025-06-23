#!/usr/bin/env node
// instead of a Makefile

process.chdir(__dirname);
const rq = require;
const fs = rq('fs');
const path = rq('path');
const { execSync } = rq('child_process');
const async = rq('async');
const { generateLicenses } = rq('./generate-licenses');
const sh = x => execSync(x, { encoding: 'utf8' }).replace(/[\r\n]/g, ''); // exec in shell
const rf = x => fs.readFileSync(x, 'utf8'); // read file
const wf = (x, y) => fs.writeFileSync(x, y); // write file
const mv = (x, y) => fs.renameSync(x, y); // move/rename file
const md = (x) => { if (!fs.existsSync(x)) { md(path.dirname(x)); fs.mkdirSync(x); } }; // mkdir -p
const rm = (x) => {
  let s;
  try { s = fs.lstatSync(x); } catch (_) { /**/ }
  if (s) {
    if (s.isDirectory()) {
      fs.readdirSync(x).map(y => rm(`${x}/${y}`));
      fs.rmdirSync(x);
    } else { fs.unlinkSync(x); }
  }
};
const pj = JSON.parse(rf('package.json'));
// v:version string - "x.y.z" where z is the number of commits since the beginning of the project
const v = `${pj.version.replace(/\.0$/, '')}.${sh('git rev-list --count HEAD')}`;
const isDyalogBuild = /^dyalog/.test(pj.name);
const tasks = { };

let buildDone = 0;
const b = (f) => {
  if (buildDone) { f(); return; }
  md('_'); wf('_/version', v); console.info(`v${v}`);
  const vi = {
    versionInfo: {
      version: v,
      date: sh('git show -s HEAD --pretty=format:%ci'),
      rev: sh('git rev-parse HEAD'),
    },
  };
  wf('_/version.js', `D=${JSON.stringify(vi)}`);
  buildDone = 1; f();
};

const incl = new RegExp('^$'
  + '|^/(D\\.png|favicon.*|[^/]*\\.html|main\\.js|package\\.json)$'
  + '|^/(src|lib|node_modules|_)(/|$)'
  + '|^/style($|/(fonts|img)|.*\\.css$)');
const pkg = (x, y, f) => {
  rq('@electron/packager')({
    dir: '.',
    platform: x,
    arch: y,
    tmpdir: '/tmp/ridebuild',
    out: `_/${pj.name}`,
    overwrite: true,
    'download.cache': 'cache',
    icon: 'D',
    ignore: p => (!incl.test(p) && !(x === 'win32' && /^\/windows-ime(\/set-ime.exe|$)/.test(p)))
      || /monaco-editor\/(dev|esm|min-maps)/.test(p)
      || /toastr\/(?!build($|\/toastr.min))/.test(p)
      || /jquery\/(?!dist($|\/jquery\.min\.js))/.test(p)
      || /node_modules\/.*\/node_gyp_bins/.test(p)
      || /node_modules\/\.bin/.test(p)
      || /\/test/.test(p)
      || /\.map$/.test(p),
    appBundleId: `com.dyalog.${pj.name}`,
    appCopyright: `(c) 2014-${new Date().getFullYear()} Dyalog Ltd`,
    appVersion: isDyalogBuild ? process.env.APPVERSION : v,
    buildVersion: isDyalogBuild ? process.env.APPVERSION : v,
    appCategoryType: 'public.app-category.developer-tools',
    extendInfo: isDyalogBuild ? 'CI/packagescripts/osx/Info.plist' : null,
    win32metadata: { // ends up in Windows Explorer's right click > Properties
      CompanyName: 'Dyalog Ltd',
      FileDescription: 'Cross-platform IDE for Dyalog APL',
      OriginalFilename: `${pj.productName}.exe`,
      ProductName: 'Ride',
      InternalName: 'Ride',
    },
  }).then(() => {
    const d = `_/${pj.name}/${pj.productName}-${x}-${y}`;
    rm(`${d}/version`);
    fs.existsSync(`${d}/LICENSE`) && mv(`${d}/LICENSE`, `${d}/LICENSE.electron`);
    generateLicenses(`${d}/ThirdPartyNotices.txt`);
    f();
  }, e => f(e));
};

const l = (f) => { b(e => (e ? f(e) : pkg('linux', 'x64', f))); };
const w = (f) => { b(e => (e ? f(e) : pkg('win32', 'ia32', f))); };
const o = (f) => { b(e => (e ? f(e) : pkg('darwin', 'x64', f))); };
const oa= (f) => { b(e => (e ? f(e) : pkg('darwin', 'arm64', f))); };
const m = (f) => { b(e => (e ? f(e) : pkg('mas', 'x64', f))); };
const ma= (f) => { b(e => (e ? f(e) : pkg('mas', 'arm64', f))); };
const a = (f) => { b(e => (e ? f(e) : pkg('linux', 'armv7l', f))); };
const a64 = (f) => { b(e => (e ? f(e) : pkg('linux', 'arm64', f))); };
const d = (f) => { async.series([l, w, o, a], (e) => { f(e); }); };

const c = (f) => { rm('_'); rm('/tmp/ridebuild'); f(); };

tasks.b = b; tasks.build = b;
tasks.l = l; tasks.linux = l;
tasks.w = w; tasks.win = w;
tasks.o = o; tasks.osx = o;
tasks.oa=oa; tasks.osxarm = oa;
tasks.m = m; tasks.mas = m;
tasks.ma=ma; tasks.masarm = ma;
tasks.a = a; tasks.arm = a;
tasks.a64=a64; tasks.arm64 = a64;
tasks.d = d; tasks.dist = d;
tasks.c = c; tasks.clean = c;

async.each(
  process.argv.length > 2 ? process.argv.slice(2) : ['build'],
  (x, f) => {
    if (tasks[x]) {
      tasks[x](f);
    } else {
      process.stderr.write(`ERROR: no task named ${JSON.stringify(x)}\n`);
      process.exit(1);
    }
  },
  (e) => { if (e) throw e; }
);
