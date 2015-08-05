#!/bin/bash
set -e
. build.sh
nw_version=0.12.2 # https://github.com/nwjs/nw.js/wiki/Downloads-of-old-versions
ulimit -n $(ulimit -Hn) # Bump open file limit to its hard limit.  OSX build requires a lot.

echo 'adding nomnom library'; mkdir -p build/nw/node_modules; cp -r node_modules/nomnom build/nw/node_modules

desktop_app() {
  echo "building desktop app for $@"
  node <<.
    var NWB = require('nw-builder');
    var nwb = new NWB({files: 'build/nw/**', version: '$nw_version', platforms: '$@'.split(' ')});
    nwb.build().catch(function (e) {console.error(e); process.exit(1);});
.
}
desktop_app ${@:-win osx linux}

# workaround for https://github.com/mllrsohn/grunt-node-webkit-builder/issues/125
# Replace icons on OS X & Windows
for bits in 32 64; do
  d=build/ride/osx$bits/ride.app/Contents/Resources
  if [ -d $d ]; then cp -v style/DyalogUnicode.icns $d/nw.icns; fi
  if which wine >/dev/null; then
    w=build/ride/win$bits/ride.exe
    if [ -s $w ]; then
      echo "replacing ${bits}-bit Windows icon"
      wine node_modules/rcedit/bin/rcedit.exe $w --set-icon ./favicon.ico
    fi
  else
    echo "Please install wine to set windows icons."
  fi
done

# https://github.com/rogerwang/node-webkit/wiki/The-solution-of-lacking-libudev.so.0
for bits in 32 64; do
  d=cache/$nw_version/linux$bits
  if [ -d $d -a ! -e $d/fixed-libudev ]; then
    echo "fixing node-webkit's libudev dependency for ${bits}-bit Linux"
    sed -i 's/udev\.so\.0/udev.so.1/g' $d/nw
    touch $d/fixed-libudev
    echo 'must rebuild the app...'
    desktop_app linux$bits # re-package the app after the libudev dependency has been fixed
  fi
done

echo 'removing libffmpegsumo from build' ; find build/ride -name '*ffmpegsumo*' -delete
echo 'fixing file permissions'           ; chmod -R g+w build/ride

for bits in 32 64; do
  if [ -d build/ride/win$bits ]; then
    if [ ! -e build/ride/win$bits/set-ime.exe ]; then
      echo "copying set-ime.exe to win$bits build"
      cp windows-ime/set-ime.exe build/ride/win$bits/
    fi
    cp build/nw/version build/ride/win$bits
  fi
done
