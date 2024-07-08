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

# Identify the location of the files that will be used for zero footprint Ride.  These files are identical across
# platforms; the only difference in resources/app/<platform> is that the Windows tree has windows-ime/set-ime.exe
# which we most certainly do not want.  So let's select the Linux app directory.
# We need the directory which contains index.html
# `pwd`/_/version contains the full version number of Ride; need the major.minor and majorminor to build path

export FULLVER=$(cat _/version)
VER=$(echo ${FULLVER} | sed 's/\.[^\.]*$//')
VERNODOT=$(echo $VER | tr -d ".")
SRC_RIDEAPPDIR="_/ride${VERNODOT}/Ride-${VER}-linux-x64/resources/app"
[ -d $SRC_RIDEAPPDIR ] || { echo "cannot find RideApplication directory $SRC_RIDEAPPDIR" ; exit 1 ; }
RIDEAPPDIR=RIDEapp
mkdir -p $r/$d/$RIDEAPPDIR

cp -v ship/*.* $r/$d/
cp -r $SRC_RIDEAPPDIR/* $r/$d/$RIDEAPPDIR
( cd $r/$d ; zip -qr ride-${FULLVER}_zerofootprint.zip $RIDEAPPDIR; )

echo 'updating "latest" symlink'; l=$r/latest; rm -f $l; ln -s $d $l
echo 'cleaning up old releases'
for x in $(ls $r/ | grep -v "latest" | grep -v "Thumbs.db" | sort -n | head -n-10); do
  echo "deleting $r/$x"; rm -rf $r/$x || true
done
