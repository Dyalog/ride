#!/bin/bash
set -e -o pipefail
export PATH="`dirname $0`/node_modules/.bin:$PATH"
if [ ! -e node_modules ]; then npm i; fi
mkdir -p build/{js,nw,tmp}

cp -uv index.html empty.html node_modules/codemirror/lib/codemirror.css style/apl385.woff style/*.png favicon.ico package.json build/nw/

i=style/style.sass o=build/nw/style.css
if [ ! -e $o -o $(find `dirname $i` -type f -newer $o 2>/dev/null | wc -l) -gt 0 ]; then
  echo 'preprocessing css'; node-sass -i --output-style=compressed -o `dirname $o` $i
fi

lib_files='
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
  node_modules/codemirror/lib/codemirror.js
  node_modules/codemirror/addon/dialog/dialog.js
  node_modules/codemirror/addon/search/searchcursor.js
  node_modules/codemirror/addon/scroll/annotatescrollbar.js
  node_modules/codemirror/addon/search/matchesonscrollbar.js
  node_modules/codemirror/addon/hint/show-hint.js
  node_modules/codemirror/addon/edit/matchbrackets.js
  node_modules/codemirror/addon/edit/closebrackets.js
  jquery.hotkeys.js
  init-nw.coffee
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

if [ ! -e build/js/filelist ]; then
  echo 'resolving js dependencies'
  browserify -t coffeeify --extension=.coffee --list client/init.coffee >build/js/filelist
fi

for f in `cat build/js/filelist`; do # compile coffee files before running browserify
  u=build/js/${f##$PWD/} # ${A##B} removes prefix B from $A.  In this case it turns an absolute path into a relative path.
  mkdir -p `dirname $u`
  if [ $f != ${f%%.coffee} ]; then
    u=${u%%.coffee}.js; if [ $f -nt $u ]; then echo "compiling $f"; coffee -bcp --no-header $f >$u; fi
  else
    if [ $f -nt $u ]; then echo "copying $f"; cp $f $u; fi
  fi
done

for f in proxy.coffee; do # nw-only coffee files
  u=build/nw/${f%%.coffee}.js; if [ $f -nt $u ]; then echo "compiling $f"; coffee -bcp --no-header $f >$u; fi
done

if [ ! -e build/nw/D.js -o $(find build/{js,tmp} -newer build/nw/D.js 2>/dev/null | wc -l) -gt 0 ]; then
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
    node <<.
      require('pure-cjs').transform({input: 'build/js/client/init.js', dryRun: true}).then(
        function (h) { process.stdout.write(h.code); },
        function (e) { process.stderr.write(e); process.exit(1); }
      );
.
  )>build/nw/D.js
fi
