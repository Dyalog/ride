#!/bin/bash
set -x -e -o pipefail

JOB_NAME=${JOB_NAME#*/} ## remove folder from the job_name

CHECKPR=${JOB_NAME#*/}
if [ "${CHECKPR:0:2}" = "PR" ]; then
        echo "skipping copying files for pull requests"
        exit 0
fi


GIT_BRANCH=`git symbolic-ref --short HEAD`

## Check /devt is mounted

mountpoint /devt; echo Devt is mouted: good
RIDEDIR=/devt/builds/${JOB_NAME}/latest

cp -vR ship $RIDEDIR
