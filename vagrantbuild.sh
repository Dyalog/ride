#!/bin/bash
set -e

if ! [ "`which vagrant`" ]; then
  echo "Please install vagrant"
  exit 1
fi

if ! [ "`vagrant status | grep running |head -1`" ]; then
 ./vagrantfiles/provision.sh
fi

if [ "$1" = "clean" ]; then
  echo "Cleaning Files"
  ./clean.sh
  vagrant ssh -c "rm -Rf \$HOME/RideJS"
fi
  echo "Copying Files"
vagrant ssh -c "cp -Ruv /RideJS \$HOME/"
  echo "Building"
vagrant ssh -c "cd \$HOME/RideJS && . dist.sh"
vagrant ssh -c "cp -Ruv \$HOME/RideJS/build /RideJS/"

case `uname` in
    Linux)
          case `uname -m` in
            x86_64)
                RIDEBIN=linux64/ride
                ;;
              x86)
                RIDEBIN=linux32/ride
                ;;
          esac
          ;;
    Darwin)
          RIDEBIN=osx64/ride.app/Contents/MacOS/node-webkit
          ;;
    MINGW*)
          RIDEBIN=win32/ride.exe
          ;;
esac

echo Running RideJS for `uname`
./build/ride/${RIDEBIN}

