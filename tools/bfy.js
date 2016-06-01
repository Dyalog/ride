#!/usr/bin/env node
// Combine a bunch of CommonJS modules into a single js file,
// similar to Browserify (http://browserify.org/) or pure-cjs (https://github.com/RReverser/pure-cjs)
let fs=require('fs')
let bfy=module.exports=(ps,p0)=>( // ps:paths to modules, p0:"main" module to load
  ';(function(){\n'+
  'var m={\n'+
    ps.map((p)=>JSON.stringify(p)+':{_:function(module,require){\n'+fs.readFileSync(p,'utf8')+';return module.exports}}')
      .join(',\n')+'\n'+
  '}\n'+
  'function load(k){\n'+
  '  if(!m[k])throw Error("no module named "+JSON.stringify(k))\n'+
  '  if(m[k]._){m[k]=m[k]._.apply(m[k],[{exports:m[k]},function(x){\n'+
  '    x=k.split("/").slice(0,-1).concat(x.split("/"))\n'+
  '    var i=0;while(i<x.length)x[i]==="."?x.splice(i,1):x[i]===".."?x.splice(--i,2):i++\n'+
  '    return load(x.join("/")+".js")\n'+
  '  }]);delete m[k]._}\n'+
  '  return m[k]\n'+
  '}\n'+
  'load('+JSON.stringify(p0)+')\n'+
  '}());\n'
)
if(module===require.main){
  let a=process.argv.slice(2),ps=[],p0,i=0;while(i<a.length)if(a[i]==='-m'){p0=a[i+1];i+=2}else{ps.push(a[i]);i++}
  process.stdout.write(bfy(ps,p0))
}
