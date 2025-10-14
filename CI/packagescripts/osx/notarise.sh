#!/bin/bash

APPLE_TEAM="6LKE87V3BD"

# functions for notarising a file

notarizefile() { # $1: path to file to notarize
    filepath=${1:?"need a filepath"}
    
    # upload file
    echo "## uploading $filepath for notarization"
    requestUUID=$(xcrun notarytool submit --apple-id "$APPLE_ID" \
                               --password "$APPLE_APP_PASS" \
                               --team-id "$APPLE_TEAM" \
                               --wait \
                               "$filepath" 2>&1 \
                  | awk '/id:/ {id=$NF} END { print id; }')
                               
    echo "Notarization RequestUUID: $requestUUID"
    
    if [[ $requestUUID == "" ]]; then 
        echo "could not upload for notarization"
        exit 1
    fi    
    
    request_info=$(xcrun notarytool info --apple-id "$APPLE_ID" \
                               --password "$APPLE_APP_PASS" \
                               --team-id "$APPLE_TEAM" \
                               "$requestUUID"  2>&1 )
    echo $request_info

    request_status=$(echo "$request_info" | awk -F ': ' '/status:/ { print $2; }')

    if [[ "$request_status" != "Accepted" ]]; then
        echo "## could not notarize $filepath"
        exit 1
    fi
    
}

## This should be moved to a common script called by both notarise and package.

APPNAME=$(node -e "console.log($(cat package.json).productName)") # "Ride-4.0" or similar
SHIPDIRECTORY=ship
if [ -s _/version ]; then
RIDEVERSION=`cat _/version`
else
RIDEVERSION=9.9.9
fi
REVISION_VERSION=`echo $RIDEVERSION | sed 's/[0-9]*\.[0-9]*\.\([0-9]*\)/\1/'`

## x64
ARCHIVENAME=`echo "${SHIPDIRECTORY}/${APPNAME}.${REVISION_VERSION}_mac_x64.pkg" | tr '[:upper:]' '[:lower:]'`

# upload for notarization
 notarizefile "$ARCHIVENAME" 

# staple result
echo "## Stapling $ARCHIVENAME"
/usr/bin/xcrun stapler staple "$ARCHIVENAME"

## arm64
ARCHIVENAME=`echo "${SHIPDIRECTORY}/${APPNAME}.${REVISION_VERSION}_mac_arm64.pkg" | tr '[:upper:]' '[:lower:]'`

# upload for notarization
 notarizefile "$ARCHIVENAME" 

# staple result
echo "## Stapling $ARCHIVENAME"
/usr/bin/xcrun stapler staple "$ARCHIVENAME"
