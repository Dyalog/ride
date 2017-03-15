#!/bin/bash
set -x -e -o pipefail

GIT_BRANCH=${JOB_NAME#*/*/}
if [ "${GIT_BRANCH:0:2}" = "PR" ]; then
        echo "skipping creating installer for pull requests"
        exit 0
fi


BUILDROOTDIR=${PWD}
TARGET=$GIT_BRANCH


## Unlock the keychain
/Users/jenkins/unlock.sh

PackageName="Ride-4.0"
BUILDNAME="ride40"
RIDEDIR="_/${BUILDNAME}/${PackageName}-darwin-x64"
SHIPDIRECTORY=ship

rm ${RIDEDIR}/LICENSE.electron ${RIDEDIR}/LICENSES.chromium.html

if [ -s ${RIDEDIR}/../../version ]; then
RIDEVERSION=`cat ${RIDEDIR}/../../version`
else
RIDEVERSION=9.9.9
fi

BASE_VERSION=`echo $RIDEVERSION | sed 's/\([0-9]*\.[0-9]*\)\.[0-9]*/\1/'`
REVISION_VERSION=`echo $RIDEVERSION | sed 's/[0-9]*\.[0-9]*\.\([0-9]*\)/\1/'`
BASE_VERSION_ND=`echo $BASE_VERSION | sed 's/\.//g'`
APPNAME=${PackageName}

cd ${RIDEDIR}

#/usr/bin/codesign --deep --sign "6LKE87V3BD" --verbose ${APPNAME}.app

cd ${BUILDROOTDIR}

mkdir -p ${SHIPDIRECTORY}

TMP1ARCHIVE=`echo "${SHIPDIRECTORY}/${APPNAME}.${REVISION_VERSION}_mac_unsigned.pkg" | tr '[:upper:]' '[:lower:]'`
ARCHIVENAME=`echo "${SHIPDIRECTORY}/${APPNAME}.${REVISION_VERSION}_mac.pkg" | tr '[:upper:]' '[:lower:]'`

#cd ${RIDEDIR}
#/usr/bin/pkgbuild --analyze --root ./${APPNAME}.app ${APPNAME}.plist
#cd ${BUILDROOTDIR}

/usr/bin/pkgbuild --root "${RIDEDIR}"                  \
--identifier "com.dyalog.pkg.ride${BASE_VERSION_ND}"    \
--version "${RIDEVERSION}"                              \
--install-location "/Applications/"                     \
${TMP1ARCHIVE}


/usr/bin/productsign --sign "Developer ID Installer: Dyalog Limited (6LKE87V3BD)" ${TMP1ARCHIVE} ${ARCHIVENAME}
