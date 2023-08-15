#!/bin/bash
# This script is for Jenkins (continuous integration) to run.
set -x -e -o pipefail

BASE_VERSION=`node -pe "($(cat package.json)).version"`
PACKAGE_NAME=`node -pe "($(cat package.json)).productName"`
APP_NAME=$(node -e "console.log($(cat package.json).name)") # "ride30" or similar

VERSION="${BASE_VERSION%%.0}.`git rev-list HEAD --count`"  # "%%.0" strips trailing ".0"
if [ "${JOB_NAME:0:6}" = "Github" ]; then
	JOB_NAME=${JOB_NAME#*/}
fi

GIT_BRANCH=${JOB_NAME#*/}

echo "Current branch: ${GIT_BRANCH#*/}"
CURRENTBRANCH=${GIT_BRANCH#*/}

umask 002 # user and group can do everything, others can only read and execute
mountpoint /devt; echo "Devt is mounted: good" # make sure it's mounted
r=/devt/builds/${JOB_NAME}
d=${BUILD_NUMBER}
for suffix in '' {a..z}; do if [ ! -e $r/$d$suffix ]; then d=$d$suffix; break; fi; done
mkdir -p $r/$d
echo "$VERSION" > $r/$d/version
echo "Copying Directories to $r/$d"
#cp -r _/${APP_NAME}/* $r/$d
for DIR in `ls _/${APP_NAME}`; do

  OS=`echo ${DIR#${PACKAGE_NAME}-} | awk -F"-" '{print $1}'`
  ARCH=`echo ${DIR#${PACKAGE_NAME}-} | awk -F"-" '{print $2}'`
	echo "DEBUG: \$DIR=$DIR"
	echo "DEBUG: \$OS=$OS"
	echo "DEBUG: \$ARCH=$ARCH"

  case ${OS} in
    darwin)
      OSNAME="mac-${ARCH}"
      ;;
    win32)
      OSNAME="win32"
      ;;
    *)
      OSNAME="${OS}-${ARCH}"
      ;;
  esac
	echo "DEBUG: \$OSNAME=$OSNAME"

  cp -R _/${APP_NAME}/${DIR} $r/$d/${OSNAME}
  chmod 755 $r/$d/${OSNAME}
done

echo 'fixing permissions'; chmod +x $r/$d/win32/{*.exe,*.dll}

if [ -L $r/latest ]; then
  rm -f $r/latest
fi

cd $r
ln -s $d latest

ls | grep -v "latest" | sort -n | head -n-10 | while read D; do
  rm -Rf $D
done
