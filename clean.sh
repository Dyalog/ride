#!/bin/bash
set -e
if [ -e build ]; then echo 'deleting build directory'; rm -rf build; fi

if [ "-full" = "$1" ]; then
  echo "removing node_modules"
  rm -rf node_modules
fi
