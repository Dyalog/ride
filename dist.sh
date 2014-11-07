#!/bin/bash
set -e
coffee=node_modules/coffee-script/bin/coffee

$coffee ./build.coffee
$coffee -c server.coffee && mv server.js static/

node node_modules/node-webkit-builder/bin/nwbuild --quiet -p win,osx,linux32,linux64 -v 0.10.5 -o dist static

# https://github.com/rogerwang/node-webkit/wiki/The-solution-of-lacking-libudev.so.0
echo 'Fixing dependency udev.so.0 → udev.so.1'
for f in dist/dyalog/linux{32,64}/dyalog; do [ -w $f ] && sed -i 's/udev\.so\.0/udev.so.1/g' $f; done

echo 'Done.'
