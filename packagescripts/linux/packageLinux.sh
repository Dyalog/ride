#!/bin/bash
set -x


if ! [ "$1" = "" ]; then
        TARGET=$1
else
	if ! [ "$GIT_BRANCH" ]; then
		GIT_BRANCH=`git branch -a | grep \* | awk '{print $2}'`
		TARGET=${GIT_BRANCH#*/}
	fi
fi

if [ "x$TARGET" = "x" ]; then
	echo "no TARGET set - bailing out"
	exit 1
fi

APP_NAME=$(node -e "console.log($(cat package.json).name)") # "ride30" or similar

echo "Packaging for $TARGET"

RIDEDIR="_/${APP_NAME}/${APP_NAME}-linux-x64"
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
if [ -s ${RIDEDIR}/../../version ]; then
        RIDEVERSION=`cat ${RIDEDIR}/../../version`
else
        RIDEVERSION="1.9.0"
fi

BASE_VERSION=`echo $RIDEVERSION | sed 's/\([0-9]*\.[0-9]*\)\.[0-9]*/\1/'`
BASE_VERSION_ND=`echo $RIDEVERSION | sed 's/\([0-9]*\)\.\([0-9]*\)\.[0-9]*/\1\2/'`

}

function createPackageFiles() {

cat >$postinst <<-!!postinst
#!/bin/bash

if ! [ -L /usr/bin/ride-${BASE_VERSION} ]; then
	ln -s /opt/ride-${BASE_VERSION}/ride /usr/bin/ride-${BASE_VERSION}
fi

if which update-alternatives >/dev/null 2>&1 ; then
  update-alternatives --install /usr/bin/ride ride /opt/ride-${BASE_VERSION}/ride${BASE_VERSION_ND} `echo ${BASE_VERSION} | sed 's/\.//g'`
  update-alternatives --install /usr/bin/ride-${BASE_VERSION} ride${BASE_VERSION_ND} /opt/ride-${BASE_VERSION}/ride${BASE_VERSION_ND} `echo ${BASE_VERSION} | sed 's/\.//g'`
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
		-p ship/ride-${RIDEVERSION}_linux.amd64.deb	\
		-n ride-${BASE_VERSION}			\
		-v ${RIDEVERSION}			\
		-a amd64				\
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
		-p ship/ride-${RIDEVERSION}_linux.amd64.rpm	\
		-n ride-${BASE_VERSION}			\
		-v ${RIDEVERSION}			\
		-a amd64				\
		--epoch 0				\
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

if ! [ -d ship ]; then
	mkdir -p ship
fi
mkdir -p ${SBOXDIR}/opt/ride-${BASE_VERSION}
mkdir -p ${SBOXDIR}/usr/share/icons/hicolor/scalable/apps
cp -R ${RIDEDIR}/* ${SBOXDIR}/opt/ride-${BASE_VERSION}/
cp "$ICON" ${SBOXDIR}/usr/share/icons/hicolor/scalable/apps/ride.svg

createDEB
createRPM
cleanup
