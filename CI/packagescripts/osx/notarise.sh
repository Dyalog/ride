#!/bin/bash
# functions for notarising a file

requeststatus() { # $1: requestUUID
    requestUUID=${1?:"need a request UUID"}
    req_status=$(xcrun altool --notarization-info "$requestUUID" \
                              --username "$APPLE_ID" \
                              --password "$APPLE_APP_PASS" 2>&1 \
                 | awk -F ': ' '/Status:/ { print $2; }' )
    echo "$req_status"
}

notarizefile() { # $1: path to file to notarize, $2: identifier
    filepath=${1:?"need a filepath"}
    identifier=${2:?"need an identifier"}
    
    # upload file
    echo "## uploading $filepath for notarization"
    requestUUID=$(xcrun altool --notarize-app \
                               --primary-bundle-id "$identifier" \
                               --username "$APPLE_ID" \
                               --password "$APPLE_APP_PASS" \
                               --asc-provider "$APPLE_TEAM" \
                               --file "$filepath" 2>&1 \
                  | awk '/RequestUUID/ { print $NF; }')
                               
    echo "Notarization RequestUUID: $requestUUID"
    
    if [[ $requestUUID == "" ]]; then 
        echo "could not upload for notarization"
        exit 1
    fi
    echo "sleeping for 10 seconds for request to be available"
    sleep 10
        
    # wait for status to be not "in progress" any more
    request_status="in progress"
    while [[ "$request_status" == "in progress" ]]; do
        echo -n "waiting... "
        sleep 10
        request_status=$(requeststatus "$requestUUID")
        if [ "$request_status" = "" ] ; then
          request_status="in progress"
        fi
        echo "$request_status"
    done
    
    # print status information
    xcrun altool --notarization-info "$requestUUID" \
                 --username "$APPLE_ID" \
                 --password "$APPLE_APP_PASS"

    if [[ "$request_status" != "success" ]]; then
        echo "## could not notarize $filepath"
        exit 1
    fi
    
}