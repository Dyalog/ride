#!/bin/bash
set -e
coffee=node_modules/coffee-script/bin/coffee
node_version=0.11.4

./build.sh

ulimit -n $(ulimit -Hn) # Bump open file limit to its hard limit.  OSX build requires a lot.

b=build/tmp/nwb
echo 'copying static files to a clean temp directory for node-webkit-build'
rm -rf $b; cp -r build/static $b
echo 'compiling proxy.coffee'
$coffee -o $b -c proxy.coffee
echo 'removing extra font formats'
rm $b/apl385.{eot,svg,ttf}
echo 'removing .ico icon'
rm $b/favicon.ico

desktop_app() {
  echo "building desktop app for $1"
  node node_modules/node-webkit-builder/bin/nwbuild --quiet -p $1 -v $node_version -o build $b
}
for platform in ${@:-win osx linux}; do desktop_app $platform; done

# https://github.com/rogerwang/node-webkit/wiki/The-solution-of-lacking-libudev.so.0
for bits in 32 64; do
  d=node_modules/node-webkit-builder/cache/$node_version/linux$bits
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
chmod -R g+w build/dyalogjs
