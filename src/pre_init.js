// early set up of environment properties
const CM = CodeMirror;
CM.keyNames[106] = 'NumpadMultiply';
CM.keyNames[107] = 'NumpadAdd';
CM.keyNames[109] = 'NumpadSubtract';
CM.keyNames[110] = 'NumpadDecimal';
CM.keyNames[111] = 'NumpadDivide';

var D = typeof D === "undefined" ? {} : D;

D.keyMap = { dyalog: {}, dyalogDefault: {} };

// all elements by id, eg I.lb_tip_text is document.getElementById('lb_tip_text')
const I = {};

// grouped by id prefix using '_' as a separator; J[x][y] is the element with id x+'_'+y
// e.g. J.lb.tip_text is document.getElementById('lb_tip_text')
const J = {};

(function preInit() {
  if (typeof node_require !== 'undefined') {
    D.mop = new Promise((resolve, reject) => {
      amdRequire(['vs/editor/editor.main'], resolve, reject);
    });
    D.el = node_require('electron').remote;
    D.elw = D.el.getGlobal('elw');
    D.ipc = node_require('node-ipc');
    D.ipc.config.logInColor = false;
    D = $.extend(D, node_require('electron').remote.getGlobal('D'));
    const plt = process.platform;
    D.win = /^win/i.test(plt);
    D.mac = plt === 'darwin';
    D.zoom2fs = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
      16, 17, 18, 19, 20, 22, 24, 26, 28, 32, 36, 42, 48];
  }
}());
