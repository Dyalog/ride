#!/bin/bash
set -e
coffee=node_modules/coffee-script/bin/coffee
node_version=0.10.5

./build.sh

if [ server.coffee -nt build/static/server.js ]; then
  echo 'compiling server.coffee'
  $coffee -o build/static/ -c server.coffee
fi

desktop_app() {
  echo "building desktop app for $1"
  node node_modules/node-webkit-builder/bin/nwbuild --quiet -p $1 -v $node_version -o build build/static
}
for platform in win osx linux32 linux64; do desktop_app $platform; done

# https://github.com/rogerwang/node-webkit/wiki/The-solution-of-lacking-libudev.so.0
for bits in 32 64; do
  d=node_modules/node-webkit-builder/cache/$node_version/linux$bits
  if [ ! -e $d/fixed-libudev ]; then
    echo "fixing node-webkit's libudev dependency for ${bits}-bit Linux"
    sed -i 's/udev\.so\.0/udev.so.1/g' $d/nw
    touch node_modules/node-webkit-builder/cache/$node_version/linux$bits/fixed-libudev
    echo 'must rebuild the app...'
    desktop_app linux$bits # re-package the app after the libudev dependency has been fixed
  fi
done
