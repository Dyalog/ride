#!/bin/bash
set -e
if [ -e build ]; then echo 'deleting build directory'; rm -rf build; fi
