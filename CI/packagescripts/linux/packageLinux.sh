#!/bin/bash
set -x -e -o pipefail

GIT_BRANCH=${JOB_NAME#*/*/}
TARGET=${GIT_BRANCH#*/}

case "${GIT_BRANCH}" in
PR*)
	echo "skipping creating installer for pull requests"
	exit 0
	;;
esac

if ! [ "$1" = "" ] ; then
	TARGET=$1
else
	if ! [ "$GIT_BRANCH" ] ; then
		GIT_BRANCH=$(git symbolic-ref --short HEAD)
		TARGET=${GIT_BRANCH#*/}
	fi
fi

if [ "x$TARGET" = "x" ] ; then
	echo "no TARGET set - bailing out"
	exit 1
fi

APP_NAME=$(node -e "console.log($(cat package.json).productName)") # "Ride-4.0" or similar
BUILDNAME=$(node -e "console.log($(cat package.json).name)") # "ride40" or similar

echo "Packaging for $TARGET"

ICON="D.svg"
SBOXDIR=/tmp/ride$$
postinst=/tmp/postinst$$
prerm=/tmp/prerm$$

checkEnvironment() {
	for bin in fpm dpkg tar fakeroot rpmbuild ; do
		if ! command -v "$bin" > /dev/null ; then
			>&2 echo "$bin is not available, please install and try again"
			exit 1
		fi
	done
}

getVersionInfo() {
if [ -s _/version ] ; then
	RIDEVERSION=$(cat _/version)
else
	RIDEVERSION="0.0.0"
fi

BASE_VERSION=$(echo $RIDEVERSION | sed 's/\([0-9]*\.[0-9]*\)\.[0-9]*/\1/')
BASE_VERSION_ND=$(echo $RIDEVERSION | sed 's/\([0-9]*\)\.\([0-9]*\)\.[0-9]*/\1\2/')

}

createPackageFiles() {

if [ "$CPUTYPE" = armv7l ] ; then
	EXECUTABLE=/opt/ride-${BASE_VERSION}/launcher
else
	EXECUTABLE=/opt/ride-${BASE_VERSION}/Ride-${BASE_VERSION}
fi

cat > $postinst <<EOFpostinst
#!/bin/sh
set -e

if command -v update-alternatives > /dev/null ; then
	update-alternatives --install /usr/bin/ride ride ${EXECUTABLE} $(echo "${BASE_VERSION}" | sed 's/\.//g')
	update-alternatives --install /usr/bin/ride-${BASE_VERSION} ride${BASE_VERSION_ND} ${EXECUTABLE} $(echo "${BASE_VERSION}" | sed 's/\.//g')
fi

if [ -d /usr/share/applications ] ; then
	# check for an installed interpreter and update its shortcut if it exists
	if [ -f /usr/bin/dyalog ] ; then
		## 16.0 has renamed the shortcut, this allows us to deal with 15.0 in a semi-sensible way
		if ! [ -f /usr/share/applications/dyalog-tty.desktop ] ; then
			sed 's/\(^Name=.*\)/\1 (tty)/' /usr/share/applications/dyalog.desktop > /usr/share/applications/dyalog-tty.desktop
		fi
		## This will always launch the most recent version of DyalogAPL the user has available
		sed 's:^Exec=.*:Exec=env RIDE_SPAWN=/usr/bin/dyalog /usr/bin/ride-${BASE_VERSION}:' /usr/share/applications/dyalog-tty.desktop > /usr/share/applications/dyalog.desktop
		sed -i 's/^Name=.*/Name=Dyalog APL/' /usr/share/applications/dyalog.desktop
		sed -i 's/^Terminal=.*/Terminal=False/' /usr/share/applications/dyalog.desktop
	fi

	cat > /usr/share/applications/ride-${BASE_VERSION}.desktop <<-EOFdesktopFile
		[Desktop Entry]
		Encoding=UTF-8
		Version=1.0
		Type=Application
		Exec=/usr/bin/ride-${BASE_VERSION}
		Icon=ride${BASE_VERSION_ND}
		Terminal=false
		Name=Ride-${BASE_VERSION}
		Comment=Remote IDE for Dyalog APL
		Categories=Application;Development;Programming
	EOFdesktopFile
fi

if command -v gtk-update-icon-cache > /dev/null ; then
	gtk-update-icon-cache --quiet --force --ignore-theme-index /usr/share/icons/hicolor
fi
EOFpostinst

cat > $prerm <<EOFprerm
#!/bin/sh
set -e

if command -v update-alternatives > /dev/null ; then
	update-alternatives --remove ride ${EXECUTABLE}
	update-alternatives --remove ride${BASE_VERSION_ND} ${EXECUTABLE}
fi

if [ -L /usr/bin/ride-${BASE_VERSION} ] ; then
	rm /usr/bin/ride-${BASE_VERSION}
fi

if [ -f /usr/share/applications/ride-${BASE_VERSION}.desktop ] ; then
	rm /usr/share/applications/ride-${BASE_VERSION}.desktop
fi

if [ -f /usr/share/applications/dyalog.desktop ] ; then
	rm /usr/share/applications/dyalog.desktop
fi

if command -v gtk-update-icon-cache > /dev/null ; then
	gtk-update-icon-cache --quiet --force --ignore-theme-index /usr/share/icons/hicolor
fi
EOFprerm

}

createDEB() {

	# https://www.debian.org/doc/manuals/debian-faq/ch-pkg_basics#s-pkgname
	PACKAGENAME="ride-${RIDEVERSION}-1_${DEBCPUTYPE}.deb"

	# Dependencies tested with Debian 8 and Ubuntu 14.04.
	fpm						\
		-f					\
		-t deb					\
		-s dir					\
		-C ${SBOXDIR}				\
		-d 'libc6 >= 2.17'			\
		-d 'libnss3 >= 3.26'			\
		-d 'libgbm1'				\
		-d 'libgtk-3-0'				\
		-d 'libxss1'				\
		-d 'libasound2'				\
		-d 'libx11-xcb1'			\
		--license "MIT"			\
		-m "Dyalog Ltd <support@dyalog.com>"	\
		--url "http://www.dyalog.com"		\
		--category "devel"			\
		--after-install $postinst		\
		--before-remove $prerm			\
		-p "ship/${PACKAGENAME}"		\
		-n "ride-${BASE_VERSION}"		\
		-v ${RIDEVERSION}			\
		-a "${DEBCPUTYPE}"			\
		--epoch 0				\
		--description "Remote IDE for Dyalog APL"	\
		--deb-priority optional			\
		--deb-no-default-config-files		\
		opt usr

	command -v lintian > /dev/null && lintian --include-dir CI/packagescripts/linux/lintian --profile ride "ship/${PACKAGENAME}" || true

}

createRPM() {

	# http://ftp.rpm.org/max-rpm/ch-rpm-file-format.html
	PACKAGENAME="ride-${RIDEVERSION}-1.${RPMCPUTYPE}.rpm"

	# Dependencies tested with Fedora 25, Centos 7 and openSUSE 13.2.
	# (NB Electron 2 needs libnss3.so >= 3.26. All these distributions have
	# it available, but using different package names: "mozilla-nss" for
	# openSUSE vs "nss" for the others.)
	fpm						\
		-f					\
		-t rpm					\
		-s dir					\
		-C ${SBOXDIR}				\
		-d 'libc.so.6(GLIBC_2.17)(64bit)'	\
		-d 'libXss.so.1()(64bit)'		\
		-d 'libgbm.so.1()(64bit)'		\
		-d 'libgtk-3.so.0()(64bit)'		\
		-d 'libasound.so.2()(64bit)'		\
		-d 'libnss3.so()(64bit)'		\
		-d 'libX11-xcb.so.1()(64bit)'		\
		--license "MIT"			\
		-m "Dyalog Ltd <support@dyalog.com>"	\
		--url "http://www.dyalog.com"		\
		--category "devel"			\
		--after-install $postinst		\
		--before-remove $prerm			\
		-p "ship/${PACKAGENAME}"		\
		-n "ride-${BASE_VERSION}"		\
		-v ${RIDEVERSION}			\
		-a "${RPMCPUTYPE}"			\
		--epoch 0				\
		--description "Remote IDE for Dyalog APL"	\
		--rpm-tag '%define _build_id_links none' \
		--rpm-tag '%undefine _missing_build_ids_terminate_build' \
		opt usr

	command -v rpmlint > /dev/null && rpmlint -f CI/packagescripts/linux/rpmlint/config "ship/${PACKAGENAME}" || true

}

cleanup() {

	rm -Rf $SBOXDIR
	rm -Rf $postinst
	rm -Rf $prerm

}

for CPUTYPE in x64 armv7l ; do

	RIDEDIR="_/${BUILDNAME}/${APP_NAME}-linux-${CPUTYPE}"

	if [ "${CPUTYPE}" = "x64" ] ; then
		DEBCPUTYPE="amd64"
		RPMCPUTYPE="x86_64"
	elif [ "${CPUTYPE}" = "armv7l" ] ; then
		DEBCPUTYPE="armhf"
		RPMCPUTYPE="armhf"
	fi

	checkEnvironment
	getVersionInfo
	createPackageFiles

	mkdir -p "${SBOXDIR}/opt/ride-${BASE_VERSION}"
	cp -R "${RIDEDIR}"/* "${SBOXDIR}/opt/ride-${BASE_VERSION}"/
	find "${SBOXDIR}" -type f "(" -name "*.so" -o -name "*.svg" -o -name "*.js" ")" | xargs chmod -x # for lintian
	#find "${SBOXDIR}" -name ".git*" | xargs rm -r # for lintian
	find "${SBOXDIR}" -type f "(" -name ".*" -o -name "*.c" ")" | xargs rm # for rpmlint
	find "${SBOXDIR}" -xtype l | xargs rm -f # remove dangling symlinks, for rpmlint

	mkdir -p ${SBOXDIR}/usr/share/icons/hicolor/scalable/apps
	cp "$ICON" ${SBOXDIR}/usr/share/icons/hicolor/scalable/apps/ride${BASE_VERSION_ND}.svg

	if [ $CPUTYPE = armv7l ] ; then
		sed "s/EXECUTABLE/Ride-${BASE_VERSION}/" < CI/packagescripts/linux/launcher > "${SBOXDIR}/opt/ride-${BASE_VERSION}/launcher"
		chmod +x "${SBOXDIR}/opt/ride-${BASE_VERSION}/launcher"
	fi

	mkdir -p ship
	createDEB
	createRPM
	cleanup

done
