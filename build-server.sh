#!/bin/bash
. build.sh
echo 'preparing directory with static files to serve'
st=build/static
rm -rf $st
cp -r build/nw $st
cp favicon.ico style/apl385.{eot,svg,ttf} $st/
rm $st/proxy.js
