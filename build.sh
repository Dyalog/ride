#!/bin/bash
set -e -o pipefail
export PATH="`dirname "$0"`/node_modules/.bin:$PATH"
cd `dirname "$0"`
if [ ! -e node_modules ]; then npm i; fi
mkdir -p build/{js/client,nw,tmp,static}

cp -uvr {index,empty,print}.html {proxy,nomnom}.js style/{*.png,apl385.woff,img} favicon.ico package.json build/nw/
cp -uv client/*.js build/js/client/

i=style/style.sass o=build/nw/style.css
if [ ! -e $o -o $(find `dirname $i` -type f -newer $o 2>/dev/null | wc -l) -gt 0 ]; then
  echo 'preprocessing css'; node-sass -i --output-style=compressed -o `dirname $o` $i
fi

lib_files='
  node_modules/jquery/dist/jquery.min.js
  node_modules/jquery-ui/core.js
  node_modules/jquery-ui/widget.js
  node_modules/jquery-ui/mouse.js
  node_modules/jquery-ui/position.js
  node_modules/jquery-ui/draggable.js
  node_modules/jquery-ui/droppable.js
  node_modules/jquery-ui/resizable.js
  node_modules/jquery-ui/sortable.js
  node_modules/jquery-ui/button.js
  node_modules/jquery-ui/dialog.js
  node_modules/jquery-ui/tabs.js
  node_modules/jquery-ui/slider.js
  node_modules/codemirror/lib/codemirror.js
  node_modules/codemirror/addon/dialog/dialog.js
  node_modules/codemirror/addon/search/searchcursor.js
  node_modules/codemirror/addon/scroll/annotatescrollbar.js
  node_modules/codemirror/addon/search/matchesonscrollbar.js
  node_modules/codemirror/addon/hint/show-hint.js
  node_modules/codemirror/addon/edit/matchbrackets.js
  node_modules/codemirror/addon/edit/closebrackets.js
  node_modules/codemirror/addon/display/placeholder.js
  node_modules/codemirror/addon/fold/foldcode.js
  node_modules/codemirror/addon/fold/indent-fold.js
  lib/jquery.layout.js
  lbar/lbar.js
  kbds/kbds.js
'
us='' # paths to versions of lib files with "require()" calls removed
changed=0
for f in $lib_files; do
  u=build/tmp/${f//\//_} # replace / with _
  us="$us $u"
  if [ $f -nt $u ]; then
    changed=1
    if [ $f != ${f%%.min.js} ]; then echo "copying $f"; cp $f $u
    else echo "cleaning up $f"; <$f sed '/^\(var \w\+ = \)\?require(/d' >$u; fi
  fi
done
if [ $changed -eq 1 ]; then echo 'concatenating libs'; cat $us >build/tmp/libs.js; fi

if [ ! -e build/nw/D.js -o $(find build/{js,tmp} -newer build/nw/D.js 2>/dev/null | wc -l) -gt 0 ]; then
  v=$(node -e "console.log($(cat package.json).version.replace(/\.0$/,''))").$(git rev-list --count HEAD)
  echo $v >build/nw/version # for the benefit of installers, store version in file
  echo 'generating version info'
  cat >build/tmp/version-info.js <<.
    D={versionInfo:{version:'$v',date:'$(git show -s HEAD --pretty=format:%ci)',rev:'$(git rev-parse HEAD)'}};
    (function(){
      var g=[];for(var x in window)g.push(x) // remember original global names (except for "D")
      D.pollution=function(){var r=[];for(var x in window)if(g.indexOf(x)<0)r.push(x);return r} // measure pollution
    }());
.
  echo 'combining js files into one'
  node >build/tmp/ride.js <<.
    // Combine a bunch of CommonJS modules into a single js file,
    // similar to Browserify (http://browserify.org/) or pure-cjs (https://github.com/RReverser/pure-cjs)
    var path=require('path'),fs=require('fs')
    function combine(ps,p0){return(
      ';(function(){\n'+
      'var m={\n'+
        ps.map(function(p){return(
          JSON.stringify(p)+':{_:function(module,require){\n'+fs.readFileSync(p,'utf8')+';return module.exports}}'
        )}).join(',\n')+'\n'+
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
    )}
    process.stdout.write(combine(fs.readdirSync('client').map(function(x){return'client/'+x}),'client/init.js'))
.
  echo 'generating D.js for desktop app'
  cat build/tmp/version-info.js build/tmp/libs.js init-nw.js build/tmp/ride.js >build/nw/D.js
  echo 'generating D.js for web app'
  cp -r build/nw/* build/static/
  rm build/static/proxy.js
  cp favicon.ico style/apl385.{eot,svg,ttf} build/static/
  cat build/tmp/version-info.js build/tmp/libs.js            build/tmp/ride.js >build/static/D.js
fi
