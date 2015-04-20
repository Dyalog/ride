#!/bin/bash
set -e -o pipefail
export PATH="`dirname $0`/node_modules/.bin:$PATH"
if [ ! -e node_modules ]; then npm i; fi
mkdir -p build/{static,tmp}

cp -uv index.html empty.html node_modules/codemirror/lib/codemirror.css style/apl385.* style/*.png favicon.ico package.json build/static/

i=style/style.sass o=build/static/style.css
if [ ! -e $o -o $(find `dirname $i` -type f -newer $o | wc -l) -gt 0 ]; then
  echo 'preprocessing css'
  # node-sass generates a bad source map now, but let's be ready for the time it's fixed
  node-sass -i --source-map -o `dirname $o` $i # for compression, add: --output-style=compressed
fi

js_files='
  node_modules/socket.io/node_modules/socket.io-client/socket.io.js
  node_modules/jquery/dist/cdn/jquery-2.1.3.min.js
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
  jquery.hotkeys.js
  init-nw.coffee
'
us='' # names of compiled files
changed=0
for f in $js_files; do
  u=build/tmp/${f//\//_} # replace / with _
  us="$us $u"
  if [ $f -nt $u ]; then
    changed=1
    if [ $f != ${f%%.coffee} ]; then echo "compiling $f"; coffee -bcp $f >$u
    elif [ $f != ${f%%.min.js} ]; then echo "copying $f"; cp $f $u
    else echo "cleaning up $f"; <$f sed '/^\(var \w\+ = \)\?require(/d' >$u; fi
  fi
done
if [ $changed -eq 1 ]; then echo 'concatenating libs'; cat $us >build/tmp/libs.js; fi

echo 'combining javascript files into one'
(
  cat <<.
    var D={versionInfo:{
      version:'0.1.$(git rev-list --count HEAD)',
      date:'$(git show -s HEAD --pretty=format:%ci)',
      rev:'$(git rev-parse HEAD)'
    }};
.
  cat build/tmp/libs.js
  browserify -d -t coffeeify --extension=.coffee client/init.coffee | exorcist build/static/client.map
)>build/static/D.js
