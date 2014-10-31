#!/bin/bash
set -e
./build.coffee
node node_modules/node-webkit-builder/bin/nwbuild -p win,osx,linux32,linux64 -v 0.10.5 -o dist static
echo 'Fixing dependency udev.so.0 → udev.so.1'
for f in dist/dyalog/linux{32,64}/dyalog; do sed -i 's/udev\.so\.0/udev.so.1/g' $f; done
echo 'Done.'
