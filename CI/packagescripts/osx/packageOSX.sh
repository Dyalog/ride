#!/bin/bash
set -x -e -o pipefail

# The following variables must be set prior to invoking this script

# the email address of your developer account
# export APPLE_ID="your@apple.id"

# the name of your Developer ID installer certificate
# export APPLE_CERT_APPLICATION="Developer ID Application: Company (TEAMID)"
# the name of your Developer ID Application certificate
# export APPLE_CERT_INSTALLER="Developer ID Installer: Company (TEAMID)"

# the 10-digit team id
# export APPLE_TEAM="TEAMID"

# the label of the keychain item which contains an app-specific password
# export APPLE_ID_KEYCHAIN="AC_PASSWORD"

GIT_BRANCH=${JOB_NAME#*/*/}
if [ "${GIT_BRANCH:0:2}" = "PR" ]; then
        echo "skipping creating installer for pull requests"
        exit 0
fi

BUILDROOTDIR=${PWD}
TARGET=$GIT_BRANCH
APPLE_TEAM="6LKE87V3BD"
APPLE_CERT_APPLICATION="Developer ID Application: Dyalog Limited (6LKE87V3BD)"
APPLE_CERT_INSTALLER="Developer ID Installer: Dyalog Limited (6LKE87V3BD)"

## Unlock the keychain
/Users/jenkins/unlock.sh

PackageName=$(node -e "console.log($(cat package.json).productName)") # "Ride-4.0" or similar
BUILDNAME=$(node -e "console.log($(cat package.json).name)") # "ride40" or similar

if [ "arm64" = "$(uname -m)" ]; then
        R_ARCH=arm64
else
        R_ARCH=x64
fi

RIDEDIR="_/${BUILDNAME}/${PackageName}-darwin-${R_ARCH}"
SHIPDIRECTORY=ship

mkdir -p ${RIDEDIR}/${PackageName}.app/Contents/Resources/LICENCES
mv ${RIDEDIR}/LICENSE.electron ${RIDEDIR}/LICENSES.chromium.html ${RIDEDIR}/${PackageName}.app/Contents/Resources/LICENCES/

if [ -s _/version ]; then
RIDEVERSION=`cat _/version`
else
RIDEVERSION=9.9.9
fi

## Code sign application

cd ${RIDEDIR}

BASE_VERSION=`echo $RIDEVERSION | sed 's/\([0-9]*\.[0-9]*\)\.[0-9]*/\1/'`
REVISION_VERSION=`echo $RIDEVERSION | sed 's/[0-9]*\.[0-9]*\.\([0-9]*\)/\1/'`
BASE_VERSION_ND=`echo $BASE_VERSION | sed 's/\.//g'`
APPNAME=${PackageName}
identifier="com.dyalog.pkg.ride${BASE_VERSION_ND}"

cd ${BUILDROOTDIR}

mkdir -p ${SHIPDIRECTORY}

ARCHIVENAME=`echo "${SHIPDIRECTORY}/${APPNAME}.${REVISION_VERSION}_mac.pkg" | tr '[:upper:]' '[:lower:]'`

./CI/packagescripts/osx/sign.js ${RIDEDIR}/${PackageName}.app "${APPLE_CERT_APPLICATION}"

/usr/bin/pkgbuild --root "$RIDEDIR"                   \
--identifier "$identifier"                            \
--version "${RIDEVERSION}"                            \
--install-location "/Applications/"                   \
--sign "$APPLE_CERT_INSTALLER"                        \
"$ARCHIVENAME"


echo '## Done!'
