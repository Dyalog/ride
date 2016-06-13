#!/bin/bash
# This script is for Jenkins (continuous integration) to run.
set -x
set -e

BASE_VERSION=`node -pe "($(cat package.json)).version"`
VERSION="${BASE_VERSION%%.0}.`git rev-list HEAD --count`"  # "%%.0" strips trailing ".0"
echo "Current branch: ${GIT_BRANCH#*/}"
CURRENTBRANCH=${GIT_BRANCH#*/}
APP_NAME=$(node -e "console.log($(cat package.json).name)") # "ride30" or similar

umask 002 # user and group can do everything, others can only read and execute
mountpoint /devt; echo Devt is mounted: good # make sure it's mounted
r=/devt/builds/ride/${CURRENTBRANCH}
d=`date +%Y-%m-%d--%H-%M` # append a letter to $d if such a directory already exists
for suffix in '' {a..z}; do if [ ! -e $r/$d$suffix ]; then d=$d$suffix; break; fi; done
mkdir -p $r/$d
echo "$VERSION" > $r/$d/version
echo Copying Directories to $r/$d
#cp -r _/${APP_NAME}/* $r/$d
for DIR in `ls _/${APP_NAME}`; do

  OS=`echo ${DIR#${APP_NAME}-} | awk -F"-" '{print $1}'`
  BITS=`echo ${DIR#${APP_NAME}-} | awk -F"-" '{print $2}' | sed 's/[a-zA-Z]//g'`
	echo "DEBUG: \$DIR=$DIR"
	echo "DEBUG: \$OS=$OS"
	echo "DEBUG: \$BITS=$BITS"

  case ${OS} in
    darwin)
      OSNAME="mac${BITS}"
      ;;
    win32)
      OSNAME="win${BITS}"
      ;;
    *)
      OSNAME="${OS}${BITS}"
      ;;
  esac
	echo "DEBUG: \$OSNAME=$OSNAME"
cp -r _/${APP_NAME}/${DIR} $r/$d/${OSNAME}

  ZIPFILE="ride-${VERSION}-${OSNAME}.zip"
  TMPZIP=/tmp/$ZIPFILE

  cd _/${APP_NAME}/$DIR
  echo "creating $TMPZIP"
  zip -q -r "$TMPZIP" .
  echo Copying to devt
  cp $TMPZIP $r/$d
  echo "Removing $TMPZIP"
  rm $TMPZIP
  cd -
done

echo 'updating "latest" symlink'; l=$r/latest; [ -L $l ]; rm -f $l; ln -s $d $l
echo 'fixing permissions'; chmod +x $r/latest/win32/{*.exe,*.dll}
echo 'cleaning up old releases'
for x in $(ls $r | grep -P '^\d{4}-\d{2}-\d{2}--\d{2}-\d{2}[a-z]?$' | sort | head -n-10); do
  echo "deleting $x"; rm -rf $r/$x || true
done
