#!/bin/bash
set -x -e -o pipefail

JOB_NAME=${JOB_NAME#*/} ## remove folder from the job_name

GIT_BRANCH=${JOB_NAME#*/}
if [ "${GIT_BRANCH:0:2}" = "PR" ]; then
        echo "skipping copying files for pull requests"
        exit 0
fi


## Check /devt is mounted

mountpoint /devt; echo Devt is mouted: good
RIDEDIR=/devt/builds/${JOB_NAME}/latest

cp -vR ship $RIDEDIR
