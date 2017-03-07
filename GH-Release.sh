#!/bin/bash
set -e 

GIT_BRANCH=${JOB_NAME#*/*/}

if ! [ "${GIT_BRANCH}" = "master" ]; then
	echo "skipping creating release for ${GIT_BRANCH}"
	exit 0
fi

# create JSON
TMP_JSON=/tmp/GH-Publish.json
BASE_VERSION=`node -pe "($(cat package.json)).version"`
VERSION="${BASE_VERSION%%.0}.`git rev-list HEAD --count`"  # "%%.0" strips trailing ".0"

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

        while [ $DRAFT = "true" ] ; do
		DRAFT=`cat GH-Releases.json | jq  ".[$C].draft"`
		ID=`cat GH-Releases.json | jq  ".[$C].id"`

		if [ "$DRAFT" = "true" ]; then
			echo -e -n "*** $(cat GH-Releases.json | jq ".[$C].name" | sed 's/"//g') with id: $(cat GH-Releases.json | jq  ".[$C].id") is a draft - Deleting.\n"
			curl -X "DELETE" -H "Authorization: token $GHTOKEN" https://api.github.com/repos/Dyalog/Ride/releases/${ID}
		fi

		let C=$C+1
        done
        rm -f GH-Releases.json

else
        echo jq not found, not removing draft releases
fi

cat >$TMP_JSON <<.
{
  "tag_name": "v$VERSION",
  "target_commitish": "master",
  "name": "v$VERSION",
  "body": $(
    ( echo -e 'Pre-Release of RIDE 4.0\n\nWARNING: This is a pre-release version of RIDE. We cannot guarantee the stability of this product at this time.\n\nChangelog:'; git log --format='%s' $(git tag | tail -n 1).. ) \
      | grep -v -i todo | python -c 'import json,sys; print(json.dumps(sys.stdin.read()))'
  ),
  "draft": true,
  "prerelease": true
}
.

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
