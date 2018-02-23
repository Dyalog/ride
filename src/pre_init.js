// early set up of environment properties
var CM=CodeMirror;
CM.keyNames[106]='NumpadMultiply'
CM.keyNames[107]='NumpadAdd'
CM.keyNames[109]='NumpadSubtract'
CM.keyNames[110]='NumpadDecimal'	
CM.keyNames[111]='NumpadDivide'

var D=typeof D==="undefined"?{}:D
;(function(){
  if(typeof node_require!=='undefined'){
    D.mop = new Promise(function(resolve, reject) {
      amdRequire(['vs/editor/editor.main'], resolve, reject)
    });
    D.el=node_require('electron').remote
    D.elw=D.el.getGlobal('elw');
    D.ipc=node_require('node-ipc');
    D.ipc.config.logInColor=false;
    D=$.extend(D,node_require('electron').remote.getGlobal('D'))
    var plt=process.platform;D.win=/^win/i.test(plt);D.mac=plt==='darwin'
    D.zoom2fs = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
      16, 17, 18, 19, 20, 22, 24, 26, 28, 32, 36, 42, 48];
  }
}())
