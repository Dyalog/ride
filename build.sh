#!/bin/bash
set -e -o pipefail
export PATH="`dirname "$0"`/node_modules/.bin:$PATH"
cd `dirname "$0"`
if [ ! -e node_modules ]; then npm i; fi
mkdir -p build/{js/client,nw,tmp}

cp -uvr {index,empty,print}.html style/apl385.woff style/*.png style/img favicon.ico package.json build/nw/
i=style/style.sass o=build/nw/style.css
if [ ! -e $o -o $(find `dirname $i` -type f -newer $o 2>/dev/null | wc -l) -gt 0 ]; then
  echo 'preprocessing css'; node-sass -i --output-style=compressed -o `dirname $o` $i
fi

lib_files='
  node_modules/engine.io-client/engine.io.js
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
  init-nw.js
  lbar/lbar.js
  kbds/kbds.js
'
us='' # names of compiled files
changed=0
for f in $lib_files; do
  u=build/tmp/${f//\//_} # replace / with _
  us="$us $u"
  if [ $f -nt $u ]; then
    changed=1
    if [ $f != ${f%%.coffee} ]; then echo "compiling $f"; coffee -bcp --no-header $f >$u
    elif [ $f != ${f%%.min.js} ]; then echo "copying $f"; cp $f $u
    else echo "cleaning up $f"; <$f sed '/^\(var \w\+ = \)\?require(/d' >$u; fi
  fi
done
if [ $changed -eq 1 ]; then echo 'concatenating libs'; cat $us >build/tmp/libs.js; fi

cp -uv client/*.js build/js/client/
for f in client/*.coffee; do # compile coffee files before running browserify
  u=build/js/${f%%.coffee}.js; if [ $f -nt $u ]; then echo "compiling $f"; coffee -bcp --no-header $f >$u; fi
done

cp -uv proxy.js build/nw/

if [ ! -e build/nw/D.js -o $(find build/{js,tmp} -newer build/nw/D.js 2>/dev/null | wc -l) -gt 0 ]; then
  v=$(node -e "console.log($(cat package.json).version.replace(/\.0$/,''))").$(git rev-list --count HEAD)
  echo $v >build/nw/version
  echo 'combining javascript files into one'
  (
    cat <<.
      var D={versionInfo:{
        version:'$v',
        date:'$(git show -s HEAD --pretty=format:%ci)',
        rev:'$(git rev-parse HEAD)'
      }};
      ;(function(){
        var g=[];for(var x in window)g.push(x) // remember original global names (except for "D")
        D.pollution=function(){var r=[];for(var x in window)if(g.indexOf(x)<0)r.push(x);return r} // measure pollution
      }())
.
    cat build/tmp/libs.js
    node <<.
      require('pure-cjs').transform({input: 'build/js/client/init.js', dryRun: true}).then(
        function (h) { process.stdout.write(h.code); },
        function (e) { process.stderr.write(e); process.exit(1); }
      );
.
  )>build/nw/D.js
fi
