#!/bin/bash
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
    echo $resuest_info

    request_status=$(echo "$request_info" | awk -F ': ' '/status:/ { print $2; }')

    if [[ "$request_status" != "Accepted" ]]; then
        echo "## could not notarize $filepath"
        exit 1
    fi
    
}