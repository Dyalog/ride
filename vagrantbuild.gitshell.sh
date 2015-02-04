#!/bin/bash
set -e

## Windows Path
export PATH=$PATH:/c/HashiCorp/Vagrant/bin

if ! [ "`vagrant status | grep running |head -1`" ]; then
 ./vagrantfiles/provision.sh
fi

vagrant ssh -c "cp -R /RideJS /tmp/RideJS"
vagrant ssh -c "cd /tmp/RideJS && . dist.sh"
vagrant ssh -c "cp -R /tmp/RideJS/build /RideJS/build"

./build/dyalogjs/win64/dyalogjs.exe
