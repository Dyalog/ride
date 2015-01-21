#!/bin/bash
set -e

if ! [ "`vagrant 2>/dev/null`" ]; then
  echo "Please install vagrant"
  exit 1
fi

if ! [ "`vboxheadless 2>/dev/null`" ]; then
  echo "Please install vagrant"
  exit 1
fi

if ! [ "`vagrant status | grep running |head -1`" ]; then
 ./vagrantfiles/provision.sh
fi

vagrant ssh -c "cd /RideJS && . dist.sh"

if [ "`uname`" = "Linux" ]; then
  if [ "`uname -m`" = "x86_64" ]; then
    RIDEBIN=linux64/dyalogjs
  elif [ "`uname -m`" = "x86" ]; then
    RIDEBIN=linux32/dyalogjs
  fi
elif [ "`uname`" = "Darwin" ]; then
  RIDEBIN=osx64/dyalogjs.app/Contents/MacOS/node-webkit
fi

echo Running RideJS for `uname`
./build/dyalogjs/${RIDEBIN}
