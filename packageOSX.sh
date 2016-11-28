#!/bin/bash
set -x
set -e
GIT_BRANCH=`git branch -a | grep \* | awk '{print $2}'`
TARGET=$GIT_BRANCH

function PLISTValue() {

PLISTFILE=$1
PLKEY=$2
PLVALUE=$3

LINENUM=$(($(cat -n ${PLISTFILE} | awk "/$PLKEY/ {print \$1}") + 1))
/usr/local/bin/gsed -i "${LINENUM}s/\(<string>\).*\(<\/string>\)/\1$PLVALUE\2/" $PLISTFILE
}


## Unlock the keychain
/Users/jenkins/unlock.sh

BUILDNAME="ride40"
RIDEDIR="_/${BUILDNAME}/${BUILDNAME}-darwin-x64"
SHIPDIRECTORY=ship/
RIDEAPPDIRNAME="${BUILDNAME}.app"
PLISTFILE=${RIDEDIR}/${RIDEAPPDIRNAME}/Contents/Info.plist

if [ -s ${RIDEDIR}/../../version ]; then
RIDEVERSION=`cat ${RIDEDIR}/../../version`
else
RIDEVERSION=9.9.9
fi

BASE_VERSION=`echo $RIDEVERSION | sed 's/\([0-9]*\.[0-9]*\)\.[0-9]*/\1/'`
REVISION_VERSION=`echo $RIDEVERSION | sed 's/[0-9]*\.[0-9]*\.\([0-9]*\)/\1/'`
BASE_VERSION_ND=`echo $BASE_VERSION | sed 's/\.//g'`
APPNAME="Ride-$RIDEVERSION"

## Set the RIDE Version number and product name

PLISTValue "$PLISTFILE" "CFBundleVersion" "$RIDEVERSION"
PLISTValue "$PLISTFILE" "CFBundleShortVersionString" "Value $RIDEVERSION"
PLISTValue "$PLISTFILE" "CFBundleIdentifier" "com.dyalog.ride$BASE_VERSION_ND"
PLISTValue "$PLISTFILE" "CFBundleDisplayName" "$APPNAME"
PLISTValue "$PLISTFILE" "CFBundleName" "$APPNAME"

mkdir -p ./OSX-Packing/
cp -R ${RIDEDIR}/${RIDEAPPDIRNAME} ./OSX-Packing/${APPNAME}.app

cd OSX-Packing

/usr/bin/codesign --deep --sign "6LKE87V3BD" --verbose ${APPNAME}.app

cd ..

mkdir -p ${SHIPDIRECTORY}

=$APPNAME-tmp1.pkg 
TMP1ARCHIVE=`echo "${SHIPDIRECTORY}/${APPNAME}.${REVISION_VERSION}_mac_unsigned.pkg" | tr '[:upper:]' '[:lower:]'`
ARCHIVENAME=`echo "${SHIPDIRECTORY}/${APPNAME}.${REVISION_VERSION}_mac.pkg" | tr '[:upper:]' '[:lower:]'`

/usr/bin/pkgbuild --analyze --root ./${APPNAME}.app ${APPNAME}.plist

/usr/bin/pkgbuild --root "build"                                         \
--identifier "com.dyalog.pkg.ride${BASE_VERSION_ND}"    \
--version "${RIDEVERSION}"                              \
--install-location "/Applications/"                     \
${TMP1ARCHIVE}


/usr/bin/productsign --sign "Developer ID Installer: Dyalog Limited (6LKE87V3BD)" ${TMP1ARCHIVE} ${SHIPDIRECTORY}/${ARCHIVENAME}
