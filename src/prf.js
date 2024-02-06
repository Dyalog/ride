// Preferences API:
//  D.prf.foo()                              // getter
//  D.prf.foo(123)                           // setter
//  D.prf.foo(function(newValue,oldValue){}) // add "on change" listener
//  D.prf.foo.toggle()                       // convenience function for booleans (numbers 0 and 1)
//  D.prf.foo.getDefault()                   // retrieve default value
'use strict'
D.prf = {};
[ // name                 default (type is determined from default value; setter enforces type and handles encoding)
  ['autoStart',          0], // Auto-start default configuration when RIDE starts
  ['autoCloseBrackets',  1], //whether to insert {}[]() in pairs
  ['autocompletion',     'classic'],
  ['autoPW',             0], // update PW on resize of window
  ['autoStatus',         1], // toggle auto status
  ['blockCursor',        0], // use block cursor selection?
  ['cursorBlinking',     'blink'], // cursor blinking
  ['autocompletionDelay',500],
  ['autoCompleteCharacterLimit',1],
  ['colourScheme',       'Default'], //name of the active colour scheme
  ['colourSchemes',      []],//objects describing user-defined colour schemes
  ['confirmations',      {}],//saved responses to TaskDialog questions
  ['connectOnQuit',      0], // open connection page when active session ends
  ['customAplFont',      ''], // custom APL font, e.g. Consolas
  ['defaultConfig',      ''], // default session configuration
  ['doubleClickToEdit',  1], // whether double clicking a function name in session or editor opens an editor on that function
  ['filenameInTitle',    1], // include filename in editor title
  ['floating',           0], //floating editor and tracer windows
  ['floatSingle',        1], //create single floating edit window
  ['fold',               1], //code folding
  ['ilf',                1], //when re-formating use ODE style (interpreter level formatting)
  ['ime',                0], //switch to dyalog IME when RIDE starts (Windows-only)
  ['indent',             4], //-1 disables autoindent
  ['indentComments',     0], //whether to touch comment-only lines at all
  ['indentMethods',      -1],//-1 makes methods use the same indent as all other blocks
  ['indentOnOpen',       1], //whether to re-indent source code on editor open
  ['kbdLocale',          ''],//e.g. "US", "GB"
  ['keys',               {}],//a mapping between commands and keystrokes, only diffs from the defaults
  ['lbar',               1], //show language bar
  ['lbarOrder',          D.lb.order],
  ['breakPts',           1],
  ['lineNums',           1],
  ['matchBrackets',      1], //whether to highlight matching brackets
  ['minimapEnabled',     0], // show minimap
  ['minimapRenderCharacters',1], // minimap render characters
  ['minimapShowSlider',  "mouseover"], // show minimap slider
  ['otherExe',           ''],//content of the "exe" text box when "Other..." is selected in the Connect page
  ['pauseOnError',       0], // whether the interpreter should set thread status to 'Paused' on all threads when encountering an error on any.
  ['persistentHistory',  1], // save history between sessions
  ['persistentHistorySize',100], // max lines to save
  ['prefixKey',          '`'],
  ['prefixMaps',         {}],//per-locale strings of pairs of characters - diffs from the default map for that locale
  ['pfkeys',             [...Array(49)].map(() => '')], //command strings for pfkeys
  ['renderLineHighlight','none'], // highlight current line
  ['sbar',               1], //show status bar
  ['selectedExe',        ''],//which interpreter is selected in dropdown in the Connect page?
  ['selectionHighlight', 0],// hightlight matching words
  ['sessionLogSize',     0],// max lines of session log to show (0 = unlimited)
  ['showCCGC',           0], // show CC and GC in statusbar
  ['showEditorToolbar',  1],// show toolbar in editor windows
  ['showSessionMargin',  1],// show session margin
  ['snippetSuggestions', 1],// show snippet suggestions
  ['statusWindow',       0], //show status window
  ['title',              '{CAPTION}'], //a.k.a. "caption"
  ['valueTips',          1], //value tips
  ['dbg',                0], //show debug panel
  ['sqp',                1], //show quit prompt
  ['squiggleTips',       0],
  ['wrap',               0], //line wrapping in session
  ['wse',                0], //show workspace explorer?
  ['editWinsRememberPos',0], //editor windows remember position
  ['editWins',{              //editor windows size and placement
    width:800,height:600,
    x:200,y:200,
    ox:0,oy:0
  }], 
  ['zoom',               0],
  ['menu',
    '# see below for syntax'
    + '\n'
    + '\nDyalog                          {mac}'
    + '\n  About                    =ABT'
    + '\n  -'
    + '\n  Preferences...           =PRF'
    + '\n  -                            '
    + '\n  Hide                         {mac}'
    + '\n  Hide Others                  {mac}'
    + '\n  Show All                     {mac}'
    + '\n  -                            {mac}'
    + '\n  &Quit                    =QIT'
    + '\n&File                           {!browser}'
    + '\n  &Open...                 =OWS {local}'
    + '\n  &New Session             =NEW'
    + '\n  &Connect...              =CNC'
    + '\n  -                             {!mac}'
    + '\n  &Quit                    =QIT {!mac}'
    + '\n&Edit'
    + '\n  Reformat                 =RD'
    + '\n  -                            '
    + '\n  Undo                     =UND'
    + '\n  Redo                     =RDO'
    + '\n  -                            '
    + '\n  Cut                      =CT '
    + '\n  Copy                     =CP '
    + '\n  Paste                    =PT '
    + '\n  Select All               =SA'
    + '\n  -                             {mac||!browser}'
    + '\n  &Find...                 =SC'
    + '\n  Find and &Replace...     =RP'
    + '\n  -                             {!mac}'
    + '\n  Preferences...           =PRF {!mac}'
    + '\n&View'
    + '\n  Show Language Bar        =LBR'
    + '\n  Show Status Bar          =SBR'
    + '\n  Show Workspace Explorer  =WSE'
    + '\n  Show Debug               =DBG'
    + '\n  Line Wrapping in Session =WRP'
    + '\n  -                             {!browser}'
    + '\n  Show Status Window       =SSW'
    + '\n  Auto Status              =ASW'
    + '\n  -                             {!browser}'
    + '\n  Stops                    =TVB'
    + '\n  Line Numbers             =LN'
    + '\n  Outline                  =TVO'
    + '\n  -                             {!browser}'
    + '\n  Increase Font Size       =ZMI {!browser}'
    + '\n  Decrease Font Size       =ZMO {!browser}'
    + '\n  Reset Font Size          =ZMR {!browser}'
    + '\n  -                             {!browser}'
    + '\n  Toggle Full Screen            {!browser}'
    + '\n&Window'
    + '\n  Close All Windows        =CAW'
    + '\n&Action'
    + '\n  Edit                     =ED'
    + '\n  Trace                    =TC'
    + '\n  -'
    + '\n  Clear all trace/stop/monitor =CAM'
    + '\n  Weak Interrupt           =WI'
    + '\n  Strong Interrupt         =SI'
    + '\n&Threads                        {rp21}'
    + '\n  Pause on Error           =POE'
    + '\n  Pause all Threads        =PAT'
    + '\n  Unpause all threads      =UAT'
    + '\n  Continue all threads     =MA'
    + '\n&Help'
    + '\n  Getting &Started         =https://dyalog.com/introduction.htm'
    + '\n  -'
    + '\n  &RIDE User Guide         =RHP'
    + '\n  Dyalog &Help             =DHI'
    + '\n  &Language Elements       =LEL'
    + '\n  &Documentation Centre    =DOX'
    + '\n  -'
    + '\n  Dyalog &Website          =https://dyalog.com/'
    + '\n  &Email Dyalog            =EMD'
    + '\n  -'
    + '\n  Latest &Enhancements     =ENH'
    + '\n  Read &Me                 =RME'
    + '\n  &Third Party Licences    =TPL'
    + '\n  &About                   =ABT {!mac}'
    + '\n'
    + '\n# Syntax:'
    + '\n#   &x   access key, alt+x'
    + '\n#   =CMD command code; some are special:'
    + '\n#          LBR WRP WSE render as checkboxes'
    + '\n#   =http://example.com/  open a URL'
    + '\n#   {}   conditional display, a boolean expression'
    + '\n#          operators: && || ! ( )'
    + '\n#          variables: local browser mac win' // Add 'local' variable to check if interpreter is being run locally.
    + '\n#   -    separator (when alone)'
    + '\n#   #    comment'
    + '\n'
    + '\n# The =PRF ("Preferences...") menu item must be present.',
  ],
].forEach((kd) => {
  const [k, d] = kd; // k:preference name (key), d:default value
  const t = typeof d; // t:type
  const l = []; // l:listeners
  const str = t === 'object' ? JSON.stringify : x => `${x}`; // stringifier function
  const sd = str(d);
  const p = (x, s) => {
    if (typeof x === 'function') { l.push(x); return null; } // add listener
    if (x === undefined) { // get
      const r = D.db.getItem(k);
      if (r == null) return d;
      if (t === 'number') return +r;
      if (t === 'object') return JSON.parse(r);
      return r;
    }
    // set:
    let nx;
    if (t === 'number') nx = +x; // coerce x to type t
    else if (t === 'string') nx = `${x}`;
    else if (typeof x === 'string') nx = JSON.parse(x);
    else nx = x;
    let sx = str(nx); if (sx === sd) sx = ''; // convert to a string; if default, use ''
    const sy = D.db.getItem(k) || ''; // old value, stringified
    if (sx === sy) return nx;
    let y;
    if (l.length) y = p(); // old value as an object (only needed if we have any listeners)
    sx ? D.db.setItem(k, sx) : D.db.removeItem(k); // store
    for (let i = 0; i < l.length; i++) l[i](nx, y); // notify listeners
    if (D.ipc) {
      D.ipc.server && D.ipc.server.broadcast('prf', [k, nx]);
      !s && D.ipc.of.ride_master && D.ipc.of.ride_master.emit('prf', [k, nx]);
    }
    return nx;
  };
  D.prf[k] = p;
  p.getDefault = () => d;
  p.toggle = () => p(!p());
});

D.db = !nodeRequire ? localStorage : (function DB() {
  const rq = nodeRequire;
  const fs = rq('fs');
  const el = rq('@electron/remote');
  // file-backed storage with API similar to that of localStorage
  const k = []; // keys
  const v = []; // values
  const f = el.process.env.RIDE_PREFS || `${el.app.getPath('userData')}/prefs.json`;
  try {
    if (fs.existsSync(f)) {
      const h = JSON.parse(fs.readFileSync(f, 'utf8'));
      Object.keys(h).forEach((x) => { k.push(x); v.push(h[x]); });
    }
  } catch (e) { console.error(e); }
  const dbWrite = () => {
    const s = `{\n${k.map((x, i) => `  ${JSON.stringify(x)}:${JSON.stringify(v[i])}`).sort().join(',\n')}\n}\n`;
    fs.writeFileSync(f, s);
  };
  // var iv=['wse'] //ignored vars (not saved to file)
  const db = {
    key(x) { return k[x]; },
    getItem(x) {
      const i = k.indexOf(x);
      return i < 0 ? null : v[i];
    },
    setItem(x, y) {
      const i = k.indexOf(x);
      if (i < 0) {
        k.push(x);
        v.push(y);
      } else {
        v[i] = y;
      }
      dbWrite();
    },
    removeItem(x) {
      const i = k.indexOf(x);
      if (i >= 0) {
        k.splice(i, 1);
        v.splice(i, 1);
        dbWrite();
      }
    },
    _getAll() {
      const r = {};
      for (let i = 0; i < k.length; i++) r[k[i]] = v[i];
      return r;
    },
  };
  Object.defineProperty(db, 'length', { get() { return k.length; } });
  return db;
}());
if (D.el && D.win && D.prf.ime()) {
  const setImeExe = `${__dirname}\\windows-ime\\set-ime.exe`;
  const fs = nodeRequire('fs');
  const { spawn } = nodeRequire('child_process');
  fs.existsSync(setImeExe) && spawn(setImeExe, [process.pid], { stdio: ['ignore', 'ignore', 'ignore'] });
}
