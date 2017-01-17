#!/bin/bash
set -x -e -o pipefail

GIT_BRANCH=${JOB_NAME#*/*/}
TARGET=${GIT_BRANCH#*/}

if [ "${GIT_BRANCH:0:2}" = "PR" ]; then
        echo "skipping creating installer for pull requests"
	exit 0
fi



if ! [ "$1" = "" ]; then
        TARGET=$1
else
	if ! [ "$GIT_BRANCH" ]; then
		GIT_BRANCH=`git symbolic-ref --short HEAD`
		TARGET=${GIT_BRANCH#*/}
	fi
fi

if [ "x$TARGET" = "x" ]; then
	echo "no TARGET set - bailing out"
	exit 1
fi

APP_NAME=$(node -e "console.log($(cat package.json).productName)") # "Ride-4.0" or similar

echo "Packaging for $TARGET"

RIDEDIR="_/ride40/${APP_NAME}-linux"
ICON="style/img/D.svg"
SBOXDIR=/tmp/ride$$
postinst=/tmp/postinst$$
prerm=/tmp/prerm$$

function checkEnvironment() {
	local binaries=(fpm dpkg tar fakeroot rpmbuild)
	for bin in "${binaries[@]}"; do
		if ! which "$bin" > /dev/null; then
			>&2 echo $bin is not available, Please install and try again
			exit 1
		fi
	done
}

function getVersionInfo() {
if [ -s ${RIDEDIR}-${CPUTYPE}/../../version ]; then
        RIDEVERSION=`cat ${RIDEDIR}-${CPUTYPE}/../../version`
else
        RIDEVERSION="1.9.0"
fi

BASE_VERSION=`echo $RIDEVERSION | sed 's/\([0-9]*\.[0-9]*\)\.[0-9]*/\1/'`
BASE_VERSION_ND=`echo $RIDEVERSION | sed 's/\([0-9]*\)\.\([0-9]*\)\.[0-9]*/\1\2/'`

}

function createPackageFiles() {

cat >$postinst <<-!!postinst
#!/bin/bash

if which update-alternatives >/dev/null 2>&1 ; then
  update-alternatives --install /usr/bin/ride ride /opt/ride-${BASE_VERSION}/Ride-${BASE_VERSION} `echo ${BASE_VERSION} | sed 's/\.//g'`
  update-alternatives --install /usr/bin/ride-${BASE_VERSION} ride${BASE_VERSION_ND} /opt/ride-${BASE_VERSION}/Ride-${BASE_VERSION} `echo ${BASE_VERSION} | sed 's/\.//g'`
fi

#check for an installed interpreter and update it's shortcut if it exists.

if [ -f /usr/bin/dyalog ]; then
        ## 16.0 has renamed the shortcut, this allows us to deal with 15.0 in a semi-sensible way
        if ! [ -f /usr/share/applications/dyalogtty.desktop ]; then
                cat /usr/share/applications/dyalog.desktop | sed 's/\(^Name=.*\)/\1 (tty)/' > /usr/share/applications/dyalogtty.desktop
        fi
        ## This will always launch the most recent version of DyalogAPL the user has available
        cat /usr/share/applications/dyalogtty.desktop | sed 's/^Exec=.*/Exec=env RIDE_SPAWN=\/usr\/bin\/dyalog \/usr\/bin\/ride-${BASE_VERSION}/' > /usr/share/applications/dyalog.desktop
	sed -i 's/^Name=.*/Name=Dyalog APL/' /usr/share/applications/dyalog.desktop
        sed -i 's/^Terminal=.*/Terminal=False/' /usr/share/applications/dyalog.desktop
fi


if [ -d /usr/share/applications ]; then
cat >/usr/share/applications/ride-${BASE_VERSION}.desktop <<-!!desktopFile
[Desktop Entry]
Encoding=UTF-8
Version=1.0
Type=Application
Exec=/usr/bin/ride-${BASE_VERSION}
Icon=ride
Terminal=false
Name=Ride-${BASE_VERSION}
Comment=Remote IDE for Dyalog APL
Categories=Application;Development;Programming
!!desktopFile

fi

!!postinst

cat >$prerm <<-!!prerm

if which update-alternatives >/dev/null 2>&1 ; then
	update-alternatives --remove ride /opt/ride-${BASE_VERSION}/Ride-${BASE_VERSION}
fi

if [ -L /usr/bin/ride-${BASE_VERSION} ]; then
	rm /usr/bin/ride-${BASE_VERSION}
fi

if [ -s /usr/share/applications/ride-${BASE_VERSION}.desktop ]; then
	rm /usr/share/applications/ride-${BASE_VERSION}.desktop
fi

if [ -s /usr/share/applications/dyalog.desktop ]; then
	rm /usr/share/applications/dyalog.desktop
fi

fi


!!prerm

}

function createDEB() {

	fpm						\
		-f					\
		-t deb					\
		-s dir					\
		-C ${SBOXDIR}				\
		-d 'libc6 >= 2.11.3-4'			\
		--license "Proprietary"			\
		-m "Dyalog Ltd <support@dyalog.com>"	\
		--url "http://www.dyalog.com"		\
		--category "devel"			\
		--after-install $postinst		\
		--before-remove $prerm			\
		-p ship/ride-${RIDEVERSION}_linux.${PACKAGECPUTYPE}.deb	\
		-n ride-${BASE_VERSION}			\
		-v ${RIDEVERSION}			\
		-a ${PACKAGECPUTYPE}				\
		--epoch 0				\
		--description "Remote IDE for Dyalog APL"	\
		opt usr

}

function createRPM() {

	fpm						\
		-f					\
		-t rpm					\
		-s dir					\
		-C ${SBOXDIR}				\
		-d 'glibc >= 2.11.3-4'			\
		--license "Proprietary"			\
		-m "Dyalog Ltd <support@dyalog.com>"	\
		--url "http://www.dyalog.com"		\
		--category "devel"			\
		--after-install $postinst		\
		--before-remove $prerm			\
		-p ship/ride-${RIDEVERSION}_linux.${PACKAGECPUTYPE}.rpm	\
		-n ride-${BASE_VERSION}			\
		-v ${RIDEVERSION}			\
		-a ${PACKAGECPUTYPE}				\
		--epoch 0				\
		--description "Remote IDE for Dyalog APL"	\
		opt usr

}

function cleanup() {

rm -Rf $SBOXDIR
rm -Rf $postinst
rm -Rf $prerm

}


for CPUTYPE in x64 armv7l; do

	if [ "${CPUTYPE}" = "x64" ]; then
		PACKAGECPUTYPE="amd64"
	elif [ "${CPUTYPE}" = "armv7l" ]; then
		PACKAGECPUTYPE="armhf"
	fi

	checkEnvironment
	getVersionInfo
	createPackageFiles

	if ! [ -d ship ]; then
		mkdir -p ship
	fi
	mkdir -p ${SBOXDIR}/opt/ride-${BASE_VERSION}
	mkdir -p ${SBOXDIR}/usr/share/icons/hicolor/scalable/apps
	cp -R ${RIDEDIR}-${CPUTYPE}/* ${SBOXDIR}/opt/ride-${BASE_VERSION}/
	cp "$ICON" ${SBOXDIR}/usr/share/icons/hicolor/scalable/apps/ride.svg

	createDEB
	createRPM
	cleanup

done
