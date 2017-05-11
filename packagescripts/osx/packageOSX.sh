#!/bin/bash
set -x -e -o pipefail

GIT_BRANCH=${JOB_NAME#*/*/}
if [ "${GIT_BRANCH:0:2}" = "PR" ]; then
        echo "skipping creating installer for pull requests"
        exit 0
fi


BUILDROOTDIR=${PWD}
TARGET=$GIT_BRANCH

function PLISTValue() {
	sed -i.bak "/<key>$2</,/<key>/s/<string>[^<]*/<string>$3/" "$1"
	rm "$1.bak"
}


## Unlock the keychain
/Users/jenkins/unlock.sh

PackageName="Ride-4.0"
BUILDNAME="ride40"
RIDEDIR="_/${BUILDNAME}/${PackageName}-darwin-x64"
SHIPDIRECTORY=ship
RIDEAPPDIRNAME="$PackageName.app"
PLISTFILE="$RIDEDIR/$RIDEAPPDIRNAME/Contents/Info.plist"

mkdir ${RIDEDIR}/Ride-4.0.app/Contents/Resources/LICENCES
mv ${RIDEDIR}/LICENSE.electron ${RIDEDIR}/LICENSES.chromium.html ${RIDEDIR}/Ride-4.0.app/Contents/Resources/LICENCES/

if [ -s ${RIDEDIR}/../../version ]; then
RIDEVERSION=`cat ${RIDEDIR}/../../version`
else
RIDEVERSION=9.9.9
fi

BASE_VERSION=`echo $RIDEVERSION | sed 's/\([0-9]*\.[0-9]*\)\.[0-9]*/\1/'`
REVISION_VERSION=`echo $RIDEVERSION | sed 's/[0-9]*\.[0-9]*\.\([0-9]*\)/\1/'`
BASE_VERSION_ND=`echo $BASE_VERSION | sed 's/\.//g'`
APPNAME=${PackageName}

## Use a launcher script to launch RIDE

sed s/EXECUTABLE/Ride-4.0/ < "$BUILDROOTDIR/packagescripts/osx/launcher" > "$RIDEDIR/$RIDEAPPDIRNAME/Contents/MacOS/launcher"
PLISTValue "$PLISTFILE" "CFBundleExecutable" "launcher"

cd ${BUILDROOTDIR}

mkdir -p ${SHIPDIRECTORY}

TMP1ARCHIVE=`echo "${SHIPDIRECTORY}/${APPNAME}.${REVISION_VERSION}_mac_unsigned.pkg" | tr '[:upper:]' '[:lower:]'`
ARCHIVENAME=`echo "${SHIPDIRECTORY}/${APPNAME}.${REVISION_VERSION}_mac.pkg" | tr '[:upper:]' '[:lower:]'`

/usr/bin/pkgbuild --root "${RIDEDIR}"                   \
--identifier "com.dyalog.pkg.ride${BASE_VERSION_ND}"    \
--version "${RIDEVERSION}"                              \
--install-location "/Applications/"                     \
${TMP1ARCHIVE}


/usr/bin/productsign --sign "Developer ID Installer: Dyalog Limited (6LKE87V3BD)" ${TMP1ARCHIVE} ${ARCHIVENAME}
