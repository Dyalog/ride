// https://github.com/electron/electron/blob/master/docs/faq/electron-faq.md#i-can-not-use-jqueryrequirejsmeteorangularjs-in-electron
if(typeof require!=='undefined'){var node_require=require;delete require;delete exports;delete module}

// a simple way for src/*.js to require() each other, without resorting to a preprocessor like Browserify
D.modules={}
D.require=function(x){
  var m=D.modules[x.slice(2)];if(x.slice(0,2)!=='./'||!m)throw Error('Cannot find module '+JSON.stringify(x))
  return m.exports=m.exports||m.apply(m.exports={},[D.require,m])||m.exports
}
