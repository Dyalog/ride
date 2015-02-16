#!/bin/bash
set -e

# create JSON
JSONTMP='/tmp/GH-Publish.json'
BASE_VERSION=0.1
COMMIT_NUMBER=`git rev-list HEAD --count`
VERSION="${BASE_VERSION}.${COMMIT_NUMBER}"

if [ -s GHTOKEN ]; then
  TOKEN="`cat GHTOKEN`"
else
  echo "Please put your Github API Token a file named \"GHTOKEN\""
  exit 1
fi
cat >${JSONTMP} <<-!!EOF
{
  "tag_name": "v${VERSION}",
  "target_commitish": "master",
  "name": "v${VERSION}",
  "body": "Pre-Release of Ride 2.0",
  "draft": true,
  "prerelease": true
}
!!EOF

curl -o /tmp/GH-Response.json --data @${JSONTMP} -H "Authorization: token ${TOKEN}" -i https://api.github.com/repos/Dyalog/RideJS/releases

ReleaseID=`cat /tmp/GH-Response.json | grep "\"id\"" | head -1 | sed 's/.*: //;s/,//'`

echo "Created release with Id: ${ReleaseID}"

for DIR in `ls build/ride`; do

  cd build/ride/${DIR}
  echo "creating /tmp/Ride-${VERSION}-${DIR}.zip"
  zip -q -r /tmp/Ride-${VERSION}-${DIR}.zip .

  echo "uploading File..."
  curl -o /dev/null -H "Authorization: token ${TOKEN}" \
    -H "Accept: application/vnd.github.manifold-preview" \
    -H "Content-Type: application/zip" \
    --data-binary @/tmp/Ride-${VERSION}-${DIR}.zip \
    "https://uploads.github.com/repos/Dyalog/RideJS/releases/${ReleaseID}/assets?name=Ride-${VERSION}-${DIR}.zip"

  rm /tmp/Ride-${VERSION}-${DIR}.zip
  cd -
done
rm /tmp/GH-Response.json
rm $JSONTMP
