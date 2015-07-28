#!/bin/bash
set -x

if ! [ "$1" = "" ]; then
        TARGET=$1
else
	TARGET=${GIT_BRANCH#*/}
fi
echo "Packaging for $TARGET"

RIDEDIR="/devt/builds/ride/${TARGET}/latest/linux64"
ICON="/devt/admin/Dyalog Logos Stationery/Logos/Dyalog-D.svg"
SBOXDIR=/tmp/ride$$
postinst=/tmp/postinst$$
prerm=/tmp/prerm$$

function checkEnvironment() {
	local binaries=(fpm dpkg tar fakeroot)
	for bin in "${binaries[@]}"; do
		if ! which "$bin" > /dev/null; then
			>&2 echo $bin is not available, Please install and try again
			exit 1
		fi
	done
}

function getVersionInfo() {
if [ "${TARGET}" != "support" ]; then
	#RIDEVERSION=`${RIDEDIR}/ride --version 2>/dev/null`
	RIDEVERSION="2.0.`git rev-list HEAD --count`"
else
	RIDEVERSION="1.9.0"
fi
BASE_VERSION=`echo $RIDEVERSION | sed 's/\([0-9]*\.[0-9]*\)\.[0-9]*/\1/'`

}

function createPackageFiles() {

cat >$postinst <<-!!postinst
#!/bin/bash

if ! [ -L /usr/bin/ride-${BASE_VERSION} ]; then
	ln -s /opt/ride-${BASE_VERSION}/ride /usr/bin/ride-${BASE_VERSION}
fi

if which update-alternatives >/dev/null 2>&1 ; then
  update-alternatives --install /usr/bin/ride ride /opt/ride-${BASE_VERSION}/ride `echo ${BASE_VERSION} | sed 's/\.//g'`
fi


if [ -d /usr/share/applications ]; then
cat >/usr/share/applications/ride-${BASE_VERSION}.desktop <<-!!desktopFile
[Desktop Entry]
Encoding=UTF-8
Version=1.0
Type=Application
Exec=ride-${BASE_VERSION}
Icon=ride
Terminal=false
Name=Ride-${BASE_VERSION}
Comment=Remote IDE for Dyalog APL
Catefories=Application;Development;
!!desktopFile

fi

!!postinst

cat >$prerm <<-!!prerm

if which update-alternatives >/dev/null 2>&1 ; then
	update-alternatives --remove ride /opt/ride-${BASE_VERSION}/ride
fi

if [ -L /usr/bin/ride-${BASE_VERSION} ]; then
	rm /usr/bin/ride-${BASE_VERSION}
fi

if [ -s /usr/share/applications/ride-${BASE_VERSION}.desktop ]; then
	rm /usr/share/applications/ride-${BASE_VERSION}.desktop
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
		-p /devt/builds/ride/${TARGET}/latest/ship/ride-linux-${RIDEVERSION}_amd64.deb	\
		-n ride-${BASE_VERSION}			\
		-v ${RIDEVERSION}			\
		-a amd64				\
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
		-p /devt/builds/ride/${TARGET}/latest/ship/ride-linux-${RIDEVERSION}_amd64.rpm	\
		-n ride-${BASE_VERSION}			\
		-v ${RIDEVERSION}			\
		-a amd64				\
		--description "Remote IDE for Dyalog APL"	\
		opt usr

}

function cleanup() {

rm -Rf $SBOXDIR
rm -Rf $postinst
rm -Rf $prerm

}



checkEnvironment
getVersionInfo
createPackageFiles

if ! [ -d /devt/builds/ride/${TARGET}/latest/ship ]; then
	mkdir -p /devt/builds/ride/${TARGET}/latest/ship
fi
mkdir -p ${SBOXDIR}/opt/ride-${BASE_VERSION}
mkdir -p ${SBOXDIR}/usr/share/icons/hicolor/scalable/apps
cp -R ${RIDEDIR}/* ${SBOXDIR}/opt/ride-${BASE_VERSION}/
cp "$ICON" ${SBOXDIR}/usr/share/icons/hicolor/scalable/apps/ride.svg

createDEB
createRPM
cleanup
