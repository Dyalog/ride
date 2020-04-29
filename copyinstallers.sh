#!/bin/bash
set -x -e -o pipefail

JOB_NAME=${JOB_NAME#*/} ## remove folder from the job_name

GIT_BRANCH=${JOB_NAME#*/}
if [ "${GIT_BRANCH:0:2}" = "PR" ]; then
        echo "skipping copying files for pull requests"
        exit 0
fi


## Check /devt is mounted

mountpoint /devt; echo "Devt is mounted: good"
r=/devt/builds/${JOB_NAME}
d=${BUILD_NUMBER}

mkdir -p $r/$d

cp -v ship/*.* $r/$d/

echo 'updating "latest" symlink'; l=$r/latest; rm -f $l; ln -s $d $l
echo 'cleaning up old releases'
for x in $(ls $r/ | grep -v "latest" | grep -v "Thumbs.db" | sort -n | head -n-10); do
  echo "deleting $r/$x"; rm -rf $r/$x || true
done
