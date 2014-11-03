#!/bin/bash
set -e
./build.coffee
node node_modules/node-webkit-builder/bin/nwbuild -p win,osx,linux32,linux64 -v 0.10.5 -o dist static

# https://github.com/rogerwang/node-webkit/wiki/The-solution-of-lacking-libudev.so.0
echo 'Fixing dependency udev.so.0 → udev.so.1'
for f in dist/dyalog/linux{32,64}/dyalog; do sed -i 's/udev\.so\.0/udev.so.1/g' $f; done

echo 'Done.'
