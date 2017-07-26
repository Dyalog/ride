#!/bin/bash
set -e 
#set -x

GIT_BRANCH=${JOB_NAME#*/*/}
GIT_COMMIT=$(git rev-parse HEAD)

if ! [ "${GIT_BRANCH}" = "ride4" ]; then
	echo "skipping creating release for ${GIT_BRANCH}"
	exit 0
fi

# create JSON
TMP_JSON=/tmp/GH-Publish.json
BASE_VERSION=`node -pe "($(cat package.json)).version"`
VERSION_AB="${BASE_VERSION%.*}"  # "%%.0" strips trailing ".0" - JR - use %.* incase the last digit isn't 0
VERSION="${VERSION_AB}.`git rev-list HEAD --count`"

if ! [ "$GHTOKEN" ]; then
  echo 'Please put your GitHub API Token in an environment variable named GHTOKEN'
  exit 1
fi

# Delete all the old draft releases, otherwise this gets filled up pretty fast as we create for every commit:
# but only if jq is available
if which jq >/dev/null 2>&1; then
        DRAFT=true
        C=0

	# Get the json from Github API
        curl -o ./GH-Releases.json \
          --silent -H "Authorization: token $GHTOKEN" \
          https://api.github.com/repos/Dyalog/Ride/releases

	RELEASE_COUNT=`cat ./GH-Releases.json | jq ". | length"`
        GH_VERSION_ND_LAST=0

        while [ $C -le $RELEASE_COUNT ] ; do
		DRAFT=`cat GH-Releases.json | jq  ".[$C].draft"`
		ID=`cat GH-Releases.json | jq  ".[$C].id"`
		GH_VERSION=$(cat GH-Releases.json | jq ".[$C].name" | sed 's/"//g;s/^v//')
		GH_VERSION_ND=$(cat ./GH-Releases.json | jq ".[$C].name" | sed 's/"//g;s/^v//;s/\.//g')
		GH_VERSION_AB=${GH_VERSION%.*}


                if [ "${GH_VERSION_AB}" = "${VERSION_AB}" ]; then
                        if [ "$DRAFT" = "true" ]; then
                                echo -e -n "*** $(cat ./GH-Releases.json | jq ".[$C].name" | sed 's/"//g') with id: $(cat ./GH-Releases.json | jq  ".[$C].id") is a draft - Deleting.\n"
                                curl -X "DELETE" -H "Authorization: token $GHTOKEN" https://api.github.com/repos/Dyalog/Ride/releases/${ID}
                        else
                                if [ $GH_VERSION_ND -gt $GH_VERSION_ND_LAST ]; then
                                        COMMIT_SHA=`cat ./GH-Releases.json | jq ".[$C].target_commitish" | sed 's/"//g'`
                                        GH_VERSION_ND_LAST=$GH_VERSION_ND
                                fi
                        fi
                fi

		let C=$C+1
        done
        rm -f GH-Releases.json

else
        echo jq not found, not removing draft releases
fi

if [ "$COMMIT_SHA" = "master" ] || [ "$COMMIT_SHA" = "ride4" ]; then
        COMMIT_SHA=c6fe399aeeae1e489a486dfa2126399200ef54bb ## first release after setting target_commitish correctly
fi

if [ $GH_VERSION_ND_LAST = 0 ]; then
        echo "No releases of $VERSION_AB found, not populating changelog"
        JSON_BODY=$(echo "Release of RIDE $VERSION_AB\n\nInitial version of RIDE $VERSION_AB" | python -c 'import json,sys; print(json.dumps(sys.stdin.read()))')
else
        echo using log from $COMMIT_SHA from $GH_VERSION_ND_LAST
        JSON_BODY=$( ( echo -e "Release of RIDE $VERSION_AB\n\nChangelog:"; git log --format='%s' ${COMMIT_SHA}.. ) | grep -v -i todo | python -c 'import json,sys; print(json.dumps(sys.stdin.read()))')
        
fi

cat >$TMP_JSON <<.
{
  "tag_name": "v$VERSION",
  "target_commitish": "${GIT_COMMIT}",
  "name": "v$VERSION",
  "body": $JSON_BODY,
  "draft": true,
  "prerelease": true
}
.

cat $TMP_JSON

REPO=Dyalog/ride # ideally this should be parsed from "git ls-remote --get-url origin"
TMP_RESPONSE=/tmp/GH-Response.json
curl -o $TMP_RESPONSE --data @$TMP_JSON -H "Authorization: token $GHTOKEN" -i https://api.github.com/repos/$REPO/releases

RELEASE_ID=`grep '"id"' $TMP_RESPONSE | head -1 | sed 's/.*: //;s/,//'`

echo "created release with id: $RELEASE_ID"

for F in `ls /devt/builds/ride/ride4/latest/ship/ | grep -v "unsigned"`; do
  echo "uploading $F to Github"
  curl -o /dev/null -H "Authorization: token $GHTOKEN" \
    -H 'Accept: application/vnd.github.manifold-preview' \
    -H 'Content-Type: application/zip' \
    --data-binary @"/devt/builds/ride/ride4/latest/ship/$F" \
    https://uploads.github.com/repos/$REPO/releases/$RELEASE_ID/assets?name=$F
done
rm $TMP_RESPONSE $TMP_JSON
