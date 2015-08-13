#!/bin/bash
set -e
. build.sh
app_name=$(node -e "console.log($(cat package.json).name)")
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
  d=build/$app_name/osx$bits/ride.app/Contents/Resources
  if [ -d $d ]; then cp -v style/DyalogUnicode.icns $d/nw.icns; fi
  if which wine >/dev/null; then
    w=build/$app_name/win$bits/ride.exe
    if [ -s $w ]; then
      echo "replacing ${bits}-bit Windows icon"
      wine node_modules/rcedit/bin/rcedit.exe $w --set-icon ./favicon.ico
    fi
  else
    echo "Please install wine to set windows icons."
  fi
done

for bits in 32 64; do
  d=cache/$nw_version/linux$bits
  if [ -d $d -a ! -e $d/ok ]; then
    echo "fixing nw-builder's cache"
    chmod a-x $d/icudtl.dat $d/nw.pak
    rm $d/locales/*
    touch $d/ok
    echo 'must rebuild the app...'
    desktop_app linux$bits
  fi
done

echo 'removing libffmpegsumo from build' ; find build/$app_name -name '*ffmpegsumo*' -delete
echo 'fixing file permissions'           ; chmod -R g+w build/$app_name
find build/$app_name -perm /111 -print0 | xargs -0 chmod 755

for bits in 32 64; do
  if [ -d build/$app_name/win$bits ]; then
    if [ ! -e build/$app_name/win$bits/set-ime.exe ]; then
      echo "copying set-ime.exe to win$bits build"
      cp windows-ime/set-ime.exe build/$app_name/win$bits/
    fi
    cp build/nw/version build/$app_name/win$bits
  fi
done
