#!/bin/bash
set -e

# create JSON
TMP_JSON=/tmp/GH-Publish.json
BASE_VERSION=`node -pe "($(cat package.json)).version"`
VERSION="${BASE_VERSION%%.0}.`git rev-list HEAD --count`"  # "%%.0" strips trailing ".0"

if [ -s GHTOKEN ]; then
  TOKEN="`cat GHTOKEN`"
else
  echo 'Please put your GitHub API Token in a file named "GHTOKEN"'
  exit 1
fi
cat >$TMP_JSON <<.
{
  "tag_name": "v$VERSION",
  "target_commitish": "master",
  "name": "v$VERSION",
  "body": $(
    ( echo -e 'Pre-release of RIDE 2.0\n\nChangelog:'; git log --format='%s' $(git tag | tail -n 1).. ) \
      | grep -v -i todo | python -c 'import json,sys; print(json.dumps(sys.stdin.read()))'
  ),
  "draft": true,
  "prerelease": true
}
.

REPO=Dyalog/ride # ideally this should be parsed from "git ls-remote --get-url origin"
TMP_RESPONSE=/tmp/GH-Response.json
curl -o $TMP_RESPONSE --data @$TMP_JSON -H "Authorization: token $TOKEN" -i https://api.github.com/repos/$REPO/releases

RELEASE_ID=`grep '"id"' $TMP_RESPONSE | head -1 | sed 's/.*: //;s/,//'`

echo "created release with id: $RELEASE_ID"

for DIR in `ls build/ride`; do
  OS=`echo ${DIR} | sed 's/64//;s/32//'`
  BITS=`echo ${DIR} | sed 's/linux//;s/osx//;s/win//'`

  case ${OS} in
    osx)
      OSNAME="mac${BITS}"
      ;;
    win)
      OSNAME="windows${BITS}"
      ;;
    *)
      OSNAME="${OS}${BITS}"
      ;;
  esac

  ZIP=ride2-${VERSION}-${OSNAME}.zip
  TMP_ZIP=/tmp/$ZIP
  cd build/ride/$DIR
  echo "creating $TMP_ZIP"
  zip -q -r "$TMP_ZIP" .
  echo 'uploading to Github'
  curl -o /dev/null -H "Authorization: token $TOKEN" \
    -H 'Accept: application/vnd.github.manifold-preview' \
    -H 'Content-Type: application/zip' \
    --data-binary @"$TMP_ZIP" \
    https://uploads.github.com/repos/$REPO/releases/$RELEASE_ID/assets?name=$ZIP
  if [ "jason-ubuntu" = "`uname -n`" ]; then
    echo 'uploading to MyDyalog'
    scp ${TMP_ZIP} root@gosport-web.dyalog.com:/var/www/my.dyalog.com/files/ride/prebeta/
  fi
  rm "$TMP_ZIP"
  cd -
done
rm $TMP_RESPONSE $TMP_JSON
