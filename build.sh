#!/bin/bash
set -e
npm install
coffee=node_modules/coffee-script/bin/coffee
#uglifyjs=node_modules/uglify-js/bin/uglifyjs
uglifyjs=cat
sass=node_modules/node-sass/bin/node-sass

mkdir -p build/{static,tmp}

if [ lbar.xml -nt build/tmp/lbar.js ]; then
  echo 'preprocessing language bar'
  $coffee -s >build/tmp/lbar.js_ <<.
    b64d = (s) -> Buffer(s, 'base64').toString()
    stripTag = (s) -> s.replace /^.*<\w+>([^<]*)<\/\w+>.*$/, '\$1'
    esc = (s) -> s.replace /./g, (x) -> {'&': '&amp;', '<': '&lt;', '>': '&gt;'}[x] or x
    lbarHTML = ''; lbarTips = {}; isFirst = 1
    for line, i in require('fs').readFileSync('lbar.xml', 'utf8').split '\n'
      if line == '<LanguageBarElement>' then chr = desc = text = ''
      else if /<chr>/.test line then chr = String.fromCharCode stripTag line
      else if /<desc>/.test line then desc = b64d stripTag line
      else if /<text>/.test line then text = b64d stripTag line
      else if line == '</LanguageBarElement>'
        if chr == '\0' then lbarHTML += ' '; isFirst = 1
        else lbarHTML += "<b#{['', ' class="first"'][isFirst]}>#{esc chr}</b>"; lbarTips[chr] = [desc, text]; isFirst = 0
      else if line then throw Error "error at line #{i + 1}: #{JSON.stringify line}"
    process.stdout.write "var Dyalog=Dyalog||{};Dyalog.lbarTips=#{JSON.stringify lbarTips};Dyalog.lbarHTML=#{JSON.stringify lbarHTML};"
.
  mv build/tmp/lbar.js_ build/tmp/lbar.js
fi

cp -uv node_modules/codemirror/lib/codemirror.css build/static/
i=style/style.sass o=build/static/style.css; if [ $i -nt $o ]; then echo 'preprocessing css'; $sass -i <$i >$o; fi

cp -uv index.html build/static/

js_files='
  node_modules/socket.io/node_modules/socket.io-client/socket.io.js
  node_modules/jquery/dist/cdn/jquery-2.1.3.min.js
  node_modules/codemirror/lib/codemirror.js
  node_modules/codemirror/mode/apl/apl.js
  node_modules/codemirror/addon/hint/show-hint.js
  node_modules/codemirror/addon/edit/matchbrackets.js
  node_modules/codemirror/addon/edit/closebrackets.js
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
  jquery.layout.js
  build/tmp/lbar.js
  proxy.coffee
  client/keymap.coffee
  client/help-urls.coffee
  client/prefs.coffee
  client/editor.coffee
  client/session.coffee
  client/ide.coffee
  client/welcome.coffee
  client/init.coffee
'
us='' # names of uglified files
changed=0
for f in $js_files; do
  u=build/tmp/${f//\//_} # replace / with _
  us="$us $u"
  if [ $f -nt $u ]; then
    changed=1
    if [ $f != ${f%%.coffee} ]; then echo "compiling and uglifying $f"; $coffee -bcp $f | $uglifyjs >$u
    elif [ $f != ${f%%.min.js} ]; then echo "copying $f"; cp $f $u
    else echo "uglifying $f"; <$f sed '/^\(var \w\+ = \)\?require(/d' | $uglifyjs >$u; fi
  fi
done
version_file=build/tmp/version.js
echo 'var Dyalog=Dyalog||{}; Dyalog.version="0.1.'$(git rev-list HEAD --count)'"; Dyalog.buildDate="'$(date --iso-8601)'";' > $version_file
if [ $changed -ne 0 ]; then echo 'concatenating uglified files'; cat $version_file $us >build/static/D.js; fi

cp -ur style/apl385.* style/*.png favicon.ico package.json build/static/
