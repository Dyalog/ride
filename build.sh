#!/bin/bash
set -e
npm install
coffee=node_modules/coffee-script/bin/coffee
uglifyjs=node_modules/uglify-js/bin/uglifyjs

mkdir -p build/{static,tmp}

if [ lbar.xml -nt build/tmp/lbar.js ]; then
  echo 'preprocessing language bar'
  $coffee -s >build/tmp/lbar.js_ <<.
    b64d = (s) -> Buffer(s, 'base64').toString()
    stripTag = (s) -> s.replace /^.*<\w+>([^<]*)<\/\w+>.*$/, '\$1'
    esc = (s) -> s.replace /./g, (x) -> {'&': '&amp;', '<': '&lt;', '>': '&gt;'}[x] or x
    lbarHTML = ''; lbarTips = {}
    for line, i in require('fs').readFileSync('lbar.xml', 'utf8').split '\n'
      if line == '<LanguageBarElement>' then chr = desc = text = ''
      else if /<chr>/.test line then chr = String.fromCharCode stripTag line
      else if /<desc>/.test line then desc = b64d stripTag line
      else if /<text>/.test line then text = b64d stripTag line
      else if line == '</LanguageBarElement>'
        if chr == '\0' then lbarHTML += ' '
        else lbarHTML += "<b>#{esc chr}</b>"; lbarTips[chr] = [desc, text]
      else if line then throw Error "error at line #{i + 1}: #{JSON.stringify line}"
    process.stdout.write "var Dyalog=Dyalog||{};Dyalog.lbarTips=#{JSON.stringify lbarTips};Dyalog.lbarHTML=#{JSON.stringify lbarHTML};"
.
  mv build/tmp/lbar.js_ build/tmp/lbar.js
fi

css_files='node_modules/codemirror/lib/codemirror.css style/style.css'
css_combined=build/tmp/D.css
for f in $css_files; do if [ $f -nt $css_combined ]; then cat $css_files >$css_combined; break; fi done
h=build/static/index.html
if [ index.html -nt $h -o $css_combined -nt $h ]; then
  echo 'rendering index.html'
  <index.html >build/static/index.html \
    sed -e '/<!--css-->/{r build/tmp/D.css
                         d}'
fi

js_files='
  node_modules/socket.io/node_modules/socket.io-client/socket.io.js
  node_modules/jquery/dist/cdn/jquery-2.1.1.min.js
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
  node_modules/jquery-ui/effect.js
  node_modules/jquery-ui/effect-slide.js
  jquery.layout.js
  build/tmp/lbar.js
  docs/help-urls.coffee
  proxy.coffee
  client/keymap.coffee
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
if [ $changed -ne 0 ]; then echo 'concatenating uglified files'; cat $us >build/static/D.js; fi

cp -ur style/apl385.* style/*.png favicon.ico docs/help docs/help.css docs/help.js package.json build/static/
