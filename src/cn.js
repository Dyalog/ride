// Connect page, loaded only when running in Electron
{
  let log;
  let $sel = $(); // $sel:selected item(s)
  let sel; // sel:data associated with the selected item (only if it's unique)
  let q; // a dictionary of DOM elements whose ids start with "cn_", keyed by the rest of the id
  const interpreters = [];
  let interpretersSSH = []; // local interpreters and those listed through ssh
  let clt; // client, TCP connection to interpreter
  let child; // a ChildProcess instance, the result from spawn()
  let srv; // server, used to listen for connections from interpreters
  const rq = nodeRequire;
  const fs = rq('fs');
  const cp = rq('child_process');
  const home = rq('os').homedir();
  const net = rq('net');
  const path = rq('path');
  const untildify = x => (x && home ? x.replace(/^~(?=$|\/|\\)/, home) : x);
  const { esc } = D.util;
  const user = D.el ? (process.env.USER || process.env.USERNAME || '') : '';
  const MIN_V = [15, 0];
  const KV = /^([a-z_]\w*)=(.*)$/i;
  const WS = /^\s*$/; // KV:regexes for parsing env vars
  const maxl = 1000;
  const cnFile = `${D.el.app.getPath('userData')}/connections.json`;
  const trunc = x => (x.length > maxl ? `${x.slice(0, maxl - 3)}...` : x);
  const shEsc = x => `'${x.replace(/'/g, "'\\''")}'`; // shell escape
  const toBuf = (x) => {
    const b = Buffer.from(`xxxxRIDE${x}`);
    b.writeInt32BE(b.length, 0);
    return b;
  };
  const sendEach = (x) => {
    if (clt) {
      x.forEach(y => log(`send ${trunc(y)}`));
      clt.write(Buffer.concat(x.map(toBuf)));
    }
  };
  const dyalogArgs = (args) => {
    const i = D.el.process.argv.indexOf('--');
    if (!D.el || i < 0) return args;
    return D.el.process.argv.slice(1 + i).concat(args);
  };
  // compare two versions of the form [major,minor]
  const cmpVer = (x, y) => x[0] - y[0] || x[1] - y[1] || 0;
  const ls = x => fs.readdirSync(x);
  const parseVer = x => x.split('.').map(y => +y);
  const hideDlgs = () => {
    if (q) {
      I.dlg_modal_overlay.hidden = 1;
      q.connecting_dlg.hidden = 1;
      q.listen_dlg.hidden = 1;
      q.fetch.disabled = 0;
    }
  };
  const err = (...x) => {
    D.tmr && clearTimeout(D.tmr);
    delete D.tmr;
    hideDlgs();
    const [e] = x;
    if (!(e instanceof Error)) {
      $.err(...x);
    } else if (e.code === 'ENOTFOUND') {
      $.err(`The host "${e.host}" could not be found.`, 'Host not found');
    } else if (e.code !== 'ETIMEDOUT') $.err(e.message, e.name);
  };
  const passwdPrompt = (text, title) => {
    setTimeout(() => D.util.stringDialog(
      {
        title,
        text,
        token: 1,
        pass: 1,
      },
      (p) => {
        setTimeout(() => {
          if (p) {
            q.ssh_pass.value = p;
            q.go.click();
          } else {
            $.err('Password and/or key file is required', () => { q.ssh_pass.focus(); });
          }
        }, 10);
      },
    ), 10);
  };
  const save = () => {
    const names = $('.name', q.favs).toArray().map(x => x.innerText);
    const dups = names.filter((a, i) => names.indexOf(a) !== i);
    if (dups.length) {
      $.alert(
        `The following name${dups.length ? 's are' : ' is'} duplicated:\n${dups.join('\n')}`,
        'Duplicate connection names',
        () => {
          $(q.favs).list('select', names.lastIndexOf(dups[0]));
          $(q.fav_name).focus();
        },
      );
      return;
    }
    if (((+fs.statSync(cnFile).mtime) !== D.conns_modified)) {
      const r = $.confirm('Connections file has been modified, do you want to overwrite with your changes?');
      if (!r) return;
    }
    const a = q.favs.children;
    const b = [];
    for (let i = 0; i < a.length; i++) b[i] = a[i].cnData;
    D.conns = b;
    try {
      fs.writeFileSync(cnFile, JSON.stringify(D.conns));
      D.conns_modified = +fs.statSync(cnFile).mtime;
      toastr.success(cnFile, 'Configuration saved.');
    } catch (e) {
      toastr.error(`${e.name}: ${e.message}`, 'Save failed');
    }
  };
  const favText = x => x.name || 'unnamed';
  const favDOM = (x) => {
    const e = document.createElement('div');
    e.cnData = x;
    e.innerHTML = `<span class=name>${esc(favText(x))}</span><button class="go tb_btn"><span class="fas fa-play"></span></button>`;
    return e;
  };
  const updExes = () => {
    const ssh = q.subtype.value === 'ssh';
    const h = (ssh ? interpretersSSH : interpreters)
      .sort((x, y) => cmpVer(y.ver, x.ver) || +y.bits - +x.bits
        || (y.edition === 'unicode') - (x.edition === 'unicode')
        || (y.opt > x.opt) - (y.opt < x.opt))
      .map((x) => {
        let s = `v${x.ver.join('.')}, ${x.bits}-bit, ${x.edition.replace(/^./, w => w.toUpperCase())}${x.opt ? `, ${x.opt}` : ''}`;
        const supported = cmpVer(x.ver, MIN_V) >= 0;
        supported || (s += ' (unsupported)');
        return `<option value="${esc(x.exe)}"${supported ? '' : ' disabled'}>${esc(s)}`;
      }).join('');
    q.exes.innerHTML = `${h}<option value="">Other...`;
    q.exes.value = q.exe.value;
    if (!q.exes.value) {
      q.exes.selectedIndex = 0;
      q.exe.value = q.exes.value;
    }
    q.exe.disabled = !!q.exes.value;
  };
  const updSubtype = () => {
    const t = q.type.value;
    const s = q.subtype.value;
    sel && (sel.subtype = s);
    q.cwd_fld.hidden = !(q.ssh.hidden = s !== 'ssh');
    q.tcp_dtl.hidden = t === 'start' && s === 'raw';
    q.tcp_port.placeholder = q.tcp_dtl.hidden ? 0 : 4502;
    q.ssl.hidden = s !== 'ssl';
    q.fetch.disabled = q.ssh.hidden;
    updExes();
  };
  const updFormDtl = () => {
    q.subtype.hidden = q.type.value === 'listen';
    if (q.type.value === 'listen'
      || (q.type.value === 'start' && q.subtype.value === 'ssl')) q.subtype.value = 'raw';
    updSubtype();
    q.ssl_opt.hidden = q.type.value !== 'connect';
    q.raw_opt.text = q.type.value === 'start' ? 'Local' : 'TCP';
    q.fetch.hidden = q.type.value !== 'start';
    q.start.hidden = q.fetch.hidden;
    q.go.innerHTML = `<u>${q.type.value[0]}</u>${q.type.value.substr(1)}`;
  };
  const validate = (x) => {
    const t = x.type;
    const p = x.port;
    const ssh = x.subtype === 'ssh';
    if ((t === 'connect' || (t === 'start' && ssh) || t === 'listen')
      && p && (!/^\d*$/.test(p) || +p < (t !== 'listen') || +p > 0xffff)) {
      $.err('Invalid port', () => {
        (ssh ? q.ssh_port : q.tcp_port).select();
      });
      return 0;
    }
    if ((t === 'connect' && ssh) && x.tcp_port
      && (!/^\d*$/.test(x.tcp_port) || +x.tcp_port < 1 || +x.tcp_port > 0xffff)) {
      $.err('Invalid RIDE port', () => { q.tcp_port.select(); });
      return 0;
    }
    if (t === 'start') {
      const a = (x.env || '').split('\n');
      const focusEnv = () => { q.env.focus(); };
      for (let i = 0; i < a.length; i++) {
        if (!KV.test(a[i]) && !WS.test(a[i])) {
          $.err('Invalid environment variables', focusEnv);
          return 0;
        }
      }
      if (!x.exe) {
        $.err('"Interpreter" is required', () => { q.exe.focus(); });
        return 0;
      }
      if (x === sel && ssh) {
        if (!q.ssh_pass.value && !q.ssh_key.value) {
          passwdPrompt(`Password for user ${x.user || user}:`, 'Password');
          return 0;
        }
      }
    }
    return 1;
  };
  const initInterpreterConn = () => {
    hideDlgs();
    let b = Buffer.alloc(0x100000);
    let ib = 0; // ib:offset in b
    let nb = 0; // nb:length in b
    let old; // old:have we warned about an old interpreter?
    let handshakeDone = false;
    clt.on('data', (x) => {
      if (nb + x.length > b.length) {
        const r = Buffer.alloc(2 ** Math.ceil(Math.log(nb + x.length) / Math.log(2)));
        b.copy(r, 0, ib, ib + nb);
        ib = 0;
        b = r;
        log(`resized recv buffer to ${b.length}`);
      } else if (ib + nb + x.length > b.length) {
        b.copy(b, 0, ib, ib + nb);
        ib = 0;
      }
      x.copy(b, ib + nb, 0, x.length);
      nb += x.length;
      let n; // message length
      while (nb >= 4 && (n = b.readInt32BE(ib)) <= nb) {
        if (n <= 8) { err('Bad protocol message'); break; }
        const m = `${b.slice(ib + 8, ib + n)}`;
        ib += n;
        nb -= n;
        log(`recv ${trunc(m)}`);
        if (m[0] === '[') {
          const u = JSON.parse(m);
          D.recv && D.recv(u[0], u[1]);
        } else if (m[0] === '<' && !old) {
          old = 1;
          err('This version of RIDE cannot talk to interpreters older than v15.0');
        } else if (/^UsingProtocol=/.test(m)) {
          if (m.slice(m.indexOf('=') + 1) === '2') {
            handshakeDone = true;
          } else {
            err('Unsupported RIDE protocol version');
            break;
          }
        }
      }
    });
    clt.on('error', (x) => { clt && err(x); clt = 0; });
    clt.on('end', () => {
      if (handshakeDone) {
        log('interpreter disconnected');
        D.ide && D.ide.die();
      } else {
        err('Either no interpreter is listening on the specified port'
         + ' or the interpreter is already serving another RIDE client.', 'Connection rejected');
        D.ide && D.ide.die();
        D.commands.CNC();
      }
      clt = 0;
    });
    sendEach([
      'SupportedProtocols=2', 'UsingProtocol=2',
      '["Identify",{"identity":1}]', '["Connect",{"remoteId":2}]', '["GetWindowLayout",{}]',
    ]);
  };
  const sshExec = (x, cmd, f) => { // f:callback
    try { // see https://github.com/mscdex/ssh2/issues/238#issuecomment-87495628 for why we use tryKeyboard:true
      const c = new (rq('ssh2').Client)();
      const o = {
        host: x.host,
        port: x.port,
        username: x.user,
        tryKeyboard: true,
      };
      if (x.key) {
        o.privateKey = fs.readFileSync(x.key);
        x.pass && (o.passphrase = x.pass);
      } else {
        o.password = x.pass;
      }
      c.on('ready', () => { c.exec(cmd, { pty: { term: 'xterm' } }, f); })
        .on('tcp connection', (_, acc) => {
          clt = acc();
          initInterpreterConn();
          new D.IDE().setConnInfo(o.host, 'SSH', sel ? sel.name : '');
        })
        .on('keyboard-interactive', (_, _1, _2, _3, fin) => { fin([x.pass]); })
        .on('error', err)
        .connect(o);
      return c;
    } catch (e) {
      if (e.message === 'Encrypted private key detected, but no passphrase given') {
        passwdPrompt(`Passphrase for encrypted key ${x.key}:`, 'Passphrase');
      } else err(e);
    }
    return null;
  };
  const ct = process.env.RIDE_CONNECT_TIMEOUT || 60000;
  const cancelOp = (c) => {
    const cancel = (e) => {
      if (e) {
        clearTimeout(D.tmr);
        delete D.tmr;
      } else {
        err('Timed out');
      }
      c && c.end();
      hideDlgs();
      return !1;
    };
    D.tmr = setTimeout(cancel, ct);
    q.connecting_dlg_close.onclick = cancel;
  };
  const connect = (x) => {
    let m = net; // m:module used to create connection
    const o = { host: x.host, port: x.port }; // o:options for .connect()
    if (x.ssl) {
      try {
        m = rq('tls');
        if (x.cert) {
          o.cert = fs.readFileSync(x.cert);
          o.key = fs.readFileSync(x.key);
        }
        if (x.rootcertsdir) {
          o.ca = fs.readdirSync(x.rootcertsdir).map(y => fs.readFileSync(path.join(x.rootcertsdir, y)));
        }
        o.checkServerIdentity = (servername, cert) => {
          if (!x.subj || x.host === cert.subject.CN) return;
          err(`Wrong server certificate name. Expected:${JSON.stringify(x.host)}, actual:${JSON.stringify(cert.subject.CN)}`);
          try { clt.end(); } catch (e) { console.error(e); }
          throw new Error();
        };
      } catch (e) { err(e.message); return; }
    }
    clt = m.connect(o, () => {
      initInterpreterConn();
      new D.IDE().setConnInfo(x.host, x.port, sel ? sel.name : '');
    });
    clt.on('error', (e) => {
      log(`connect failed: ${e}`);
      if (D.tmr && D.ide && e.code === 'ECONNRESET') {
        err('The interpreter is already serving another RIDE client.', 'Connection closed by interpreter');
        D.ide.die();
        D.commands.CNC();
      } else err(e);
      clt = 0;
    });
    cancelOp(clt);
    // net module needs a nudge to connect properly
    // see https://github.com/Dyalog/ride/issues/387
    D.ipc.server.broadcast('nudge');
  };

  const go = (conf) => { // "Go" buttons in the favs or the "Go" button at the bottom
    const x = conf || sel;
    if (!validate(x)) return 0;
    D.spawned = 0;
    try {
      switch (x.type || 'connect') {
        case 'connect':
          D.util.dlg(q.connecting_dlg, { modal: true });
          if (x.subtype === 'ssh') {
            const o = {
              host: x.host || 'localhost',
              port: +x.ssh_port || 22,
              user: x.user || user,
            };
            // if (x.ssh_auth_type === 'key') {
            //   o.key = x.ssh_key;
            // } else {
            //   o.pass = x === sel ? q.ssh_pass.value : '';
            // }
            x.ssh_key && (o.key = x.ssh_key);
            x === sel && q.ssh_pass.value && (o.pass = q.ssh_pass.value);
            const c = sshExec(o, '/bin/sh', (e, sm) => {
              if (e) throw e;
              sm.on('close', (code, sig) => { D.ide && D.ide._sshExited({ code, sig }); c.end(); });
              c.forwardOut('', 0, '127.0.0.1', +x.port || 4502, (fe, client) => {
                if (fe) {
                  log('cannot forward out through ssh');
                  clt = 0;
                  err(fe);
                  clearTimeout(D.tmr);
                  delete D.tmr;
                  return;
                }
                clt = client;
                initInterpreterConn();
                new D.IDE().setConnInfo(x.host, x.port, sel ? sel.name : '');
                clt.on('error', (ce) => {
                  log(`connect failed: ${ce}`);
                  clt = 0;
                  err(ce);
                  clearTimeout(D.tmr);
                  delete D.tmr;
                });
              });
            });
            c && c.on('error', () => {
              clearTimeout(D.tmr);
              delete D.tmr;
            });
            cancelOp(c);
          } else {
            connect({
              host: x.host || 'localhost',
              port: +x.port || 4502,
              ssl: x.ssl,
              cert: x.cert,
              key: x.key,
              subj: x.subj,
              rootcertsdir: x.rootcertsdir,
            });
          }
          break;
        case 'listen': {
          D.util.dlg(q.listen_dlg, { modal: true });
          const port = +(x.port || 4502);
          const host = x.host || '';
          q.listen_dlg_host.textContent = host;
          q.listen_dlg_port.textContent = `${port}`;
          q.listen_dlg_cancel.onclick = () => {
            srv && srv.close();
            hideDlgs();
            return !1;
          };
          srv = net.createServer((c) => {
            let t;
            const cHost = c && (t = c.request) && (t = t.connection) && t.remoteAddress;
            log(`interpreter connected from ${cHost}`);
            srv && srv.close();
            srv = 0;
            clt = c;
            initInterpreterConn();
            new D.IDE().setConnInfo(cHost, port, sel ? sel.name : '');
          });
          srv.on('error', (e) => {
            srv = 0;
            err(e);
          });
          srv.listen(port, host, () => {
            const o = srv.address();
            log(`listening on ${o.address}:${o.port}`);
            q.listen_dlg_host.textContent = o.address !== '::' ? o.address : 'host';
            q.listen_dlg_port.textContent = `${o.port}`;
          });
          D.ipc.server.broadcast('nudge');
          break;
        }
        case 'start': {
          D.spawned = 1;
          const env = {};
          const a = (x.env || '').split('\n');
          for (let i = 0; i < a.length; i++) {
            const [, k, v] = KV.exec(a[i]) || [];
            k && (env[k] = v);
          }
          if (x.subtype === 'ssh') {
            D.util.dlg(q.connecting_dlg, { modal: true });
            const o = {
              host: x.host || 'localhost',
              port: +x.ssh_port || 22,
              user: x.user || user,
            };
            x.ssh_key && (o.key = x.ssh_key);
            x === sel && q.ssh_pass.value && (o.pass = q.ssh_pass.value);
            const c = sshExec(o, '/bin/sh', (e, sm) => {
              if (e) throw e;
              sm.on('close', (code, sig) => {
                D.ide && D.ide._sshExited({ code, sig });
                c.end();
              });
              c.forwardIn('', +x.port || 0, (fe, rport) => {
                if (fe) throw fe;
                let s0 = '';
                Object.keys(env).forEach((k) => { s0 += `${k}=${shEsc(env[k])} `; });
                const args = x.args ? x.args.replace(/\n$/gm, '').split('\n') : [];
                const s1 = dyalogArgs(args).map(shEsc).join(' ');
                sm.write(`${s0}CLASSICMODE=1 SINGLETRACE=1 RIDE_INIT=CONNECT:127.0.0.1:${rport} RIDE_SPAWNED=1 ${shEsc(x.exe)} ${s1} +s -q >/dev/null\n`);
                hideDlgs();
              });
            });
            c && c.on('error', () => {
              clearTimeout(D.tmr);
              delete D.tmr;
            });
            cancelOp(c);
          } else {
            srv = net.createServer((y) => {
              log('spawned interpreter connected');
              const adr = srv.address();
              srv && srv.close();
              srv = 0;
              clt = y;
              initInterpreterConn();
              new D.IDE().setConnInfo(adr.address, adr.port, sel ? sel.name : '');
              D.lastSpawnedExe = x.exe;
            });
            srv.on('error', (e) => {
              log(`listen failed: ${e}`);
              srv = 0;
              clt = 0;
              err(e);
              clearTimeout(D.tmr);
              delete D.tmr;
            });
            srv.listen(0, '127.0.0.1', () => {
              const adr = srv.address();
              const hp = `${adr.address}:${adr.port}`;
              log(`listening for connections from spawned interpreter on ${hp}`);
              log(`spawning interpreter ${JSON.stringify(x.exe)}`);
              let args = ['+s', '-q'];
              const stdio = ['pipe', 'ignore', 'ignore'];
              if (/^win/i.test(process.platform)) { args = []; stdio[0] = 'ignore'; }
              args = dyalogArgs(args);
              if (x.args) args.push(...x.args.replace(/\n$/gm, '').split('\n'));
              try {
                child = cp.spawn(x.exe, args, {
                  cwd: untildify(x.cwd) || home,
                  stdio,
                  detached: true,
                  env: $.extend(
                    {}, process.env, env,
                    {
                      CLASSICMODE: 1,
                      SINGLETRACE: 1,
                      RIDE_INIT: `CONNECT:${hp}`,
                      RIDE_SPAWNED: '1',
                      APLK0: 'default',
                    },
                  ),
                });
              } catch (e) { err(e); return; }
              D.lastSpawnedExe = x.exe;
              child.on('exit', (code, sig) => {
                srv && srv.close();
                srv = 0;
                clt = 0;
                child = 0;
                clearTimeout(D.tmr);
                delete D.tmr;
                if (code !== 0) {
                  err(`Interpreter ${code != null ? `exited with code ${code}` : `received ${sig}`}`);
                }
              });
              child.on('error', (y) => {
                srv && srv.close();
                srv = 0;
                clt = 0;
                child = 0;
                clearTimeout(D.tmr);
                delete D.tmr;
                err(y.code === 'ENOENT' ? 'Cannot find the interpreter\'s executable' : `${y}`);
                console.error(y);
              });
            });
            const cancel = (e) => {
              if (e) {
                clearTimeout(D.tmr);
                delete D.tmr;
              } else {
                err('Timed out');
              }
              srv && srv.close();
              srv = 0;
              child && child.kill();
              child = 0;
              hideDlgs();
              return !1;
            };
            D.tmr = setTimeout(cancel, ct);
            q && (q.connecting_dlg_close.onclick = cancel);
          }
          break;
        }
        default:
      }
    } catch (e) { $.err(`${e}`); }
    return !1;
  };
  global.go = go;
  D.cn = () => { // set up Connect page
    q = J.cn;
    I.cn.hidden = 0;
    $(I.cn).splitter();
    const m = 'Dyalog\n  About Dyalog=ABT\n  -\n  Preferences=PRF\n  -\n  &Quit=QIT'
      + '\n&Edit\n  Undo=UND\n  Redo=RDO\n  -\n  Cut=CT\n  Copy=CP\n  Paste=PT\n  Select All=SA';
    setTimeout(() => D.installMenu(D.parseMenuDSL(m)), 100);
    if (fs.existsSync(cnFile)) {
      D.conns = JSON.parse(fs.readFileSync(cnFile).toString());
      D.conns_modified = +fs.statSync(cnFile).mtime;
    } else {
      fs.writeFileSync(cnFile, JSON.stringify([{ type: 'connect' }]));
      D.conns_modified = +fs.statSync(cnFile).mtime;
    }
    D.conns = D.conns || [{ type: 'connect' }];
    I.cn.onkeyup = (x) => {
      const k = D.util.fmtKey(x);
      if (D.el && k === 'F12') {
        D.elw.webContents.toggleDevTools();
        return !1;
      }
      return !0;
    };
    q.fav_name.onkeyup = () => {
      const u = sel.name;
      const v = q.fav_name.value || '';
      if (u !== v) {
        v ? (sel.name = v) : delete sel.name;
        $sel.find('.name').text(favText(sel));
      }
    };
    q.fav_name.onchange = q.fav_name.onkeyup;
    const noSpace = (e) => { e.target.value = e.target.value.replace(/\s*/g, ''); };
    q.tcp_host.onchange = noSpace;
    q.tcp_port.onchange = noSpace;
    updFormDtl();
    q.type.onchange = () => {
      sel.type = q.type.value;
      updFormDtl();
      sel.exe = sel.exe || q.exe.value;
    };
    q.subtype.onchange = updSubtype;
    q.ssh_user.placeholder = user;
    const enterConnect = (event) => { if (event.keyCode === 13) { $('#cn_go').click(); } };
    $('#cn_tcp_host').keyup(enterConnect);
    $('#cn_tcp_port').keyup(enterConnect);
    $('#cn_ssh_host').keyup(enterConnect);
    $('#cn_ssh_port').keyup(enterConnect);
    $('#cn_exe').keyup(enterConnect);
    q.fetch.onclick = () => {
      if (!validate($.extend({}, sel, { exe: 'x' }))) return; // validate all except "exe"
      q.fetch.disabled = 1;
      const c = sshExec(
        {
          host: sel.host || 'localhost',
          port: +sel.ssh_port || 22,
          user: sel.user || user,
          pass: q.ssh_pass.value,
          key: q.ssh_key.value,
        },
        '/bin/ls -1 /opt/mdyalog/*/*/*/mapl /opt/mdyalog/*/*/*/*/mapl /Applications/Dyalog-*/Contents/Resources/Dyalog/mapl 2>/dev/null',
        (e, sm) => {
          if (e) throw e;
          let s = '';
          interpretersSSH = [];
          sm.on('data', (x) => { s += x; })
            .on('close', () => {
              interpretersSSH = s.split(/\r?\n/).filter(x => x).map((x) => {
                const a = x.split('/');
                return a[1] === 'opt' ? {
                  exe: x,
                  ver: parseVer(a[3]),
                  bits: +a[4],
                  edition: a[5],
                  opt: a[6] === 'mapl' ? '' : a[6],
                } : {
                  exe: x,
                  ver: parseVer(a[2].replace(/^Dyalog-|\.app$/g, '')),
                  bits: 64,
                  edition: 'unicode',
                  opt: '',
                };
              });
              updExes();
              if (sel) {
                sel.exe = q.exe.value;
                sel.exes = interpretersSSH;
              }
              q.fetch.disabled = 0;
              c.end();
              toastr.success(`${interpretersSSH.length} versions found`, 'Available interpreters fetched');
            })
            .on('error', (x) => {
              toastr.error(x.message, x.name);
              updExes();
              q.fetch.disabled = 0;
            });
        },
      );
    };
    q.exe.onkeyup = () => {
      q.exes.value || D.prf.otherExe(q.exe.value);
      sel && (sel.exe = q.exe.value);
    };
    q.exe.onchange = q.exe.onkeyup;
    q.exes.onchange = () => {
      const v = q.exes.value;
      q.exe.value = v || D.prf.otherExe();
      q.exe.disabled = !!v;
      $(q.exe).change();
      v || q.exe.focus();
      D.prf.selectedExe(v); // todo: do we still need this pref?
    };
    q.env_add.onclick = (x) => {
      if (x.target.nodeName !== 'A') return !0;
      const t = x.target.textContent;
      const k = t.split('=')[0];
      let s = q.env.value;
      const n = RegExp(`^${k}=(.*)$`, 'm').exec(s);
      if (n) {
        q.env.setSelectionRange(n.index + k.length + 1, n.index + n[0].length);
      } else {
        s = `${s.replace(/([^\n])$/, '$1\n')}${t}\n`;
        q.env.value = s;
        $(q.env).change();
        q.env.setSelectionRange((s.length - t.length) + k.length, s.length - 1);
      }
      return !1;
    };
    q.cert_cb.onchange = () => {
      const noCert = !q.cert_cb.checked;
      q.cert.disabled = noCert;
      q.key.disabled = noCert;
      q.cert_dots.disabled = noCert;
      q.key_dots.disabled = noCert;
      q.cert.value = '';
      q.key.value = '';
      sel.cert = '';
      sel.key = '';
      D.util.elastic(q.cert);
      D.util.elastic(q.key);
    };
    q.subj_cb.onclick = () => { sel.subj = q.subj_cb.checked ? '1' : ''; };
    q.rootcertsdir_cb.onchange = () => {
      const noCert = !q.rootcertsdir_cb.checked;
      q.rootcertsdir.disabled = noCert;
      q.rootcertsdir_dots.disabled = noCert;
      q.rootcertsdir.value = '';
      sel.rootcertsdir = '';
      D.util.elastic(q.rootcertsdir);
    };
    q.rootcertsdir_cb.onclick = () => {
      q.rootcertsdir_cb.checked && q.rootcertsdir.focus();
    };
    const browse = (x, title, props) => {
      const v = D.el.dialog.showOpenDialogSync({
        title,
        defaultPath: x.value,
        properties: props || [],
      });
      if (v) {
        [x.value] = v;
        D.util.elastic(x);
        $(x).change();
      }
      return !1;
    };
    q.cert_dots.onclick = () => { browse(q.cert, 'Certificate'); };
    q.key_dots.onclick = () => { browse(q.key, 'Key'); };
    q.ssh_key_dots.onclick = () => { browse(q.ssh_key, 'SSH Key'); };
    q.rootcertsdir_dots.onclick = () => {
      browse(q.rootcertsdir, 'Directory with Root Certificates', ['openDirectory']);
    };
    // q.ssh_auth_type.onchange = () => {
    //   const k = q.ssh_auth_type.value === 'key';
    //   q.ssh_pass.hidden = k;
    //   q.ssh_key.hidden = !k;
    //   q.ssh_key_dots.hidden = !k;
    //   sel.ssh_auth_type = q.ssh_auth_type.value;
    // };
    D.conns.forEach((x) => { q.favs.appendChild(favDOM(x)); });
    $(q.favs).list().sortable({
      cursor: 'move',
      revert: true,
      axis: 'y',
      // stop: save,
    })
      .on('click', '.go', (e) => {
        const t = $(e.target);
        const i = t.parentsUntil(q.favs).last().index();
        D.prf.connectFav(i);
        $(q.favs).list('select', i);
        q.go.click();
      })
      .keydown((x) => {
        switch (D.util.fmtKey(x)) {
          case 'Enter': q.go.hidden || q.go.click(); return !1;
          case 'Ctrl-N': q.neu.click(); return !1;
          case 'Delete': q.del.click(); return !1;
          case 'Ctrl-D': q.cln.click(); return !1;
          default: return !0;
        }
      })
      // .on('list-order-changed', save)
      .on('list-selection-changed', () => {
        $sel = $('.list_sel', q.favs);
        const u = $sel.length === 1; // is selection unique?
        q.cln.disabled = !u;
        q.del.disabled = !$sel.length;
        q.rhs.hidden = !u;
        sel = u ? $sel[0].cnData : null;
        if (u) {
          $(':checkbox[name]', q.rhs).each((_, x) => { x.checked = !!+sel[x.name]; });
          q.type.value = sel.type || 'connect';
          q.subtype.value = sel.subtype || 'raw';
          interpretersSSH = sel.exes || [];
          updFormDtl();
          updExes();
          q.fav_name.value = sel.name || '';
          $(':text[name],textarea[name]', q.rhs).each((_, x) => { x.value = sel[x.name] || ''; });
          q.exes.value = sel.exe;
          q.exes.value || (q.exes.value = ''); // use sel.exe if available, otherwise use "Other..."
          const a = q.rhs.querySelectorAll('input,textarea');
          for (let i = 0; i < a.length; i++) if (/^text(area)?$/.test(a[i].type)) D.util.elastic(a[i]);
          // q.ssh_auth_type.value = sel.ssh_auth_type || 'pass';
          // q.ssh_auth_type.onchange();
          q.cert_cb.checked = !!sel.cert;
          const noc = !sel.cert;
          q.cert.disabled = noc;
          q.key.disabled = noc;
          q.cert_dots.disabled = noc;
          q.key_dots.disabled = noc;
          q.subj_cb.checked = !!sel.subj;
          q.rootcertsdir_cb.checked = !!sel.rootcertsdir;
          q.rootcertsdir.disabled = !sel.rootcertsdir;
          q.rootcertsdir_dots.disabled = !sel.rootcertsdir;
          q.exe.disabled = !!q.exes.value;
          q.exe.onchange();
        }
      });
    { const [a] = q.favs.querySelectorAll('a'); a && a.focus(); }
    q.sve.onclick = () => { save(); };
    q.neu.onclick = () => {
      const $e = $(favDOM({}));
      q.favs.appendChild($e[0]);
      $(q.favs).list('select', $e.index());
      q.fav_name.focus();
    };
    q.cln.onclick = () => {
      if (sel) {
        $(favDOM($.extend({}, sel))).insertBefore($sel);
        $('a', $sel).focus();
        q.fav_name.value += '(copy)';
        $(q.fav_name).change();
        q.fav_name.focus();
      }
    };
    q.del.onclick = () => {
      const n = $sel.length;
      n && $.confirm(
        `Are you sure you want to delete\nthe selected configuration${n > 1 ? 's' : ''}?`,
        'Confirmation',
        (x) => {
          if (x) {
            const i = Math.min($sel.eq(0).index(), q.favs.children.length - 1);
            $sel.remove();
            $(q.favs).list('select', i);
          }
        },
      );
    };
    q.go.onclick = () => { go(); return !1; };
    const a = q.rhs.querySelectorAll('input,textarea');
    for (let i = 0; i < a.length; i++) if (/^text(area)?$/.test(a[i].type)) D.util.elastic(a[i]);
    $(':text[name],textarea[name]', q.rhs).change((e) => {
      const t = e.target;
      const k = t.name;
      const v = t.value;
      v ? (sel[k] = v) : delete sel[k];
    });
    $(':checkbox[name]', q.rhs).change((e) => {
      const t = e.target;
      t.checked ? (sel[t.name] = 1) : delete sel[t.name];
    });
    // collect information about installed interpreters
    try {
      if (/^win/.test(process.platform)) {
        const s = cp.execSync(
          'reg query "HKEY_CURRENT_USER\\Software\\Dyalog" /s /v localdyalogdir',
          { timeout: 2000, encoding: 'UTF8' },
        );
        let b; // b:bits
        let v; // v:version
        let u; // u:edition
        let n; // n:match object
        s && s.split('\r\n').forEach((x) => {
          if (x) {
            if ((n = /^HK.*\\Dyalog APL\/W(-64)? (\d+\.\d+)( Unicode)?$/i.exec(x))) {
              [, b, v, u] = n;
              b = b ? 64 : 32;
              u = u ? 'unicode' : 'classic';
            } else if (v && (n = /^ *localdyalogdir +REG_SZ +(\S.*)$/i.exec(x))) {
              interpreters.push({
                exe: `${n[1]}\\dyalog.exe`,
                ver: parseVer(v),
                bits: b,
                edition: u,
                opt: '',
              });
            } else if (!/^\s*$/.test(x)) {
              b = null;
              v = null;
              u = null;
            }
          }
        });
      } else if (process.platform === 'darwin') {
        const rd = '/Applications';
        ls(rd).forEach((x) => {
          const n = /^Dyalog-(\d+\.\d+)\.app$/.exec(x);
          const exe = `${rd}/${x}/Contents/Resources/Dyalog/mapl`;
          n && fs.existsSync(exe) && interpreters.push({
            exe,
            ver: parseVer(n[1]),
            bits: 64,
            edition: 'unicode',
            opt: '',
          });
        });
      } else {
        const rd = '/opt/mdyalog';
        const sil = g => (x) => { try { g(x); } catch (_) { /* exception silencer */ } };
        ls(rd).forEach(sil((v) => {
          if (/^\d+\.\d+/.test(v)) {
            ls(`${rd}/${v}`).forEach(sil((b) => {
              if (b === '32' || b === '64') {
                ls(`${rd}/${v}/${b}`).forEach(sil((u) => {
                  if (u === 'unicode' || u === 'classic') {
                    const exe = `${rd}/${v}/${b}/${u}/mapl`;
                    fs.existsSync(exe) && interpreters.push({
                      exe,
                      ver: parseVer(v),
                      bits: +b,
                      edition: u,
                      opt: '',
                    });
                  }
                }));
              }
            }));
          }
        }));
      }
    } catch (e) { console.error(e); }
    updExes();
    document.title = 'RIDE-Dyalog Session';
    const conf = D.el.process.env.RIDE_CONF;
    if (conf) {
      const i = [...q.favs.children].findIndex(x => x.cnData.name === conf);
      if (i < 0) $.err(`Configuration '${conf}' not found.`);
      else {
        setTimeout(() => {
          $(q.favs).list('select', i);
          q.go.click();
        }, 1);
        return;
      }
    }
    setTimeout(() => $(q.favs).list('select', D.prf.connectFav()), 1);
  };

  module.exports = () => {
    D.send = (x, y) => {
      if (D.ide && !D.ide.promptType
        && !/Interrupt$|TreeList|Reply|FormatCode|GetAutocomplete|SaveChanges|CloseWindow|Exit/.test(x)) return;
      sendEach([JSON.stringify([x, y])]);
    };
    const a = rq('electron').remote.process.argv;
    const { env } = D.el.process;
    const h = { // h:args by name
      c: env.RIDE_CONNECT,
      s: env.RIDE_SPAWN || env.ride_spawn,
    };
    if (D.mac && env.DYALOG_SPAWN) {
      const app = require('electron').remote.app.getAppPath();
      h.s = `${app}${env.DYALOG_SPAWN}`;
    }
    for (let i = 1; i < a.length; i++) if (a[i][0] === '-') { h[a[i].slice(1)] = a[i + 1]; i += 1; }
    if (h.c) {
      q = J.cn;
      const m = /^([^:]+|\[[^\]]+\])(?::(\d+))?$/.exec(h.c); // parse host and port
      m ? go({ type: 'connect', host: m[1], port: +m[2] || 4502 }) : $.err('Invalid $RIDE_CONNECT');
    } else if (h.s) {
      const cnf = { type: 'start', exe: h.s };
      const open_file = rq('electron').remote.getGlobal('open_file');
      if (open_file && /(dws|dcfg)$/i.test(open_file)) {
        const qt = /\s/.test(open_file) ? '"' : '';
        cnf.args = `LOAD=${qt}${open_file}${qt}`
      }
      q = J.cn;
      go(cnf);
    } else { D.cn(); }
  };

  {
    let i = 0;
    const n = 100;
    const a = Array(n);
    const l = [];
    const t0 = +new Date();
    log = (x) => {
      const msg = `${new Date() - t0} ${x}`;
      a[i] = msg;
      i = (i + 1) % n;
      for (let j = 0; j < l.length; j++) l[j](msg);
    };
    module.exports.getLog = () => a.slice(i).concat(a.slice(0, i));
    module.exports.addLogListener = (x) => { l.push(x); };
    module.exports.rmLogListener = (x) => { const li = l.indexOf(x); li >= 0 && l.splice(li, 1); };
  }
}
