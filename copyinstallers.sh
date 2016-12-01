#!/bin/bash
set -x -e -o pipefail

GIT_BRANCH=`git symbolic-ref --short HEAD`

## Sheck /devt is mounted

mountpoint /devt; echo Devt is mouted: good
RIDEDIR=/devt/builds/ride/${GIT_BRANCH}/latest/

cp -vR ship $RIDEDIR
