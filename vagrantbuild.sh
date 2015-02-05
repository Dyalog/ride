#!/bin/bash
set -e

if ! [ "`which vagrant`" ]; then
  echo "Please install vagrant"
  exit 1
fi

if ! [ "`vagrant status | grep running |head -1`" ]; then
 ./vagrantfiles/provision.sh
fi

vagrant ssh -c "cp -Ruv /RideJS \$HOME/RideJS"
vagrant ssh -c "cd \$HOME/RideJS && . dist.sh"
vagrant ssh -c "cp -Ruv \$HOME/RideJS/build /RideJS/build"

case `uname` in
    Linux)
          case `uname -m` in
            x86_64)
                RIDEBIN=linux64/dyalogjs
                ;;
              x86)
                RIDEBIN=linux32/dyalogjs
                ;;
          esac
          ;;
    Darwin)
          RIDEBIN=osx64/dyalogjs.app/Contents/MacOS/node-webkit
          ;;
    MINGW*)
          RIDEBIN=win32/dyalogjs.exe
          ;;
esac

echo Running RideJS for `uname`
./build/dyalogjs/${RIDEBIN}

