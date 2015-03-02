#!/bin/bash
set -e
. build.sh
node_version=0.11.4
ulimit -n $(ulimit -Hn) # Bump open file limit to its hard limit.  OSX build requires a lot.

b=build/tmp/nwb
echo 'copying static files to a clean temp directory for node-webkit-build'
rm -rf $b; cp -r build/static $b
echo 'compiling proxy.coffee'
coffee -o $b -c proxy.coffee
echo 'removing extra font formats'
rm $b/apl385.{eot,svg,ttf}
echo 'removing .ico icon'
rm $b/favicon.ico
echo 'adding nomnom library'
mkdir -p $b/node_modules && cp -r node_modules/nomnom $b/node_modules

desktop_app() {
  echo "building desktop app for $1"
  coffee -s <<.
    NWB = require 'node-webkit-builder'
    nwb = new NWB
      files: '$b/**'
      version: '$node_version'
      platforms: '$@'.split ' '
      #macIcns: 'style/DyalogUnicode.icns'
    nwb.build().catch (e) -> console.error e; process.exit 1
.
}
for platform in ${@:-win osx linux}; do desktop_app $platform; done

# workaround for https://github.com/mllrsohn/grunt-node-webkit-builder/issues/125
# Replace icons on OS X & Windows
for bits in 32 64; do
  d=build/ride/osx$bits/ride.app/Contents/Resources
  if [ -d $d ]; then cp -v style/DyalogUnicode.icns $d/nw.icns; fi
  if which wine 2>/dev/null; then
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
  d=cache/$node_version/linux$bits
  if [ -d $d -a ! -e $d/fixed-libudev ]; then
    echo "fixing node-webkit's libudev dependency for ${bits}-bit Linux"
    sed -i 's/udev\.so\.0/udev.so.1/g' $d/nw
    touch $d/fixed-libudev
    echo 'must rebuild the app...'
    desktop_app linux$bits # re-package the app after the libudev dependency has been fixed
  fi
done

echo 'removing libffmpegsumo from build'
find build -name '*ffmpegsumo*' -delete

echo 'fixing file permissions'
chmod -R g+w build/ride
