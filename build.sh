#!/bin/bash
set -e -o pipefail
export PATH="$(dirname "$0")/node_modules/.bin:$PATH"
cd "$(dirname "$0")"
if [ ! -e node_modules ]; then npm i; fi
mkdir -p build/{js/client,nw,nw/themes,nw/jstree,tmp,static}

cp -uvr *.html proxy.js style/{*.png,apl385.woff,img,jstree} favicon.ico package.json build/nw/
cp -uvr client build/js/

i=style/style.less o=build/nw/style.css
if [ ! -e $o -o $(find "$(dirname $i)" -type f -newer $o 2>/dev/null | wc -l) -gt 0 ]; then
  echo 'preprocessing css'; lessc $i >$o
  for t in classic redmond cupertino; do lessc style/themes/${t}.less >build/nw/themes/${t}.css; done
fi

nm=node_modules cm=$nm/codemirror cma=$cm/addon
lib_files="$(echo                            \
  $nm/jquery/dist/jquery.min.js              \
  $nm/jquery-ui/{core,widget,mouse,position,draggable,droppable,resizable,sortable,button,dialog,tabs,slider}.js \
  $cm/lib/codemirror.js                      \
  $cma/dialog/dialog.js                      \
  $cma/search/searchcursor.js                \
  $cma/scroll/annotatescrollbar.js           \
  $cma/search/matchesonscrollbar.js          \
  $cma/hint/show-hint.js                     \
  $cma/edit/{matchbrackets,closebrackets}.js \
  $cma/display/placeholder.js                \
  $cma/fold/{foldcode,indent-fold}.js        \
  lib/jquery.layout.js                       \
  lib/jstree.min.js
)"

us='' changed=0 # us:paths to versions of lib files with "require()" calls removed
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
  tools/bfy.js client/*.js -m client/init.js >build/tmp/ride.js
  echo 'generating D.js for desktop app'
  cat build/tmp/{version-info,libs}.js init-nw.js build/tmp/ride.js >build/nw/D.js
  echo 'generating D.js for web app'
  cp -r build/nw/* build/static/
  rm build/static/proxy.js
  cp favicon.ico style/apl385.ttf build/static/
  cat build/tmp/version-info.js build/tmp/libs.js build/tmp/ride.js >build/static/D.js
fi
