#!/bin/bash
set -x
##set -e

JENKINSROOT=$PWD

do_candle()
{
OUT=$1
SRC=$2

export CANDLE_OPTS="-nologo -v -arch x86"

${WIXDIR}/candle.exe $CANDLE_OPTS -ext WixUtilExtension -ext WixIIsExtension -out $OUT $SRC | grep -v "^$SRC\$"
}

install_dir_contents()
{
# Variables
WIXVAR=$1
DIR=$2
OUT=$3
MEDIA_DISK_ID=$4

# LMF [6886] 11-Feb-2011
# Code to protect for empty folders
# This is simply for debugging purposes

if [ "$(ls -A $DIR)" ]; then
	# Use the wix harvesting tool (Heat) to generate a list of the files to install
	# For help please visit http://wix.sourceforge.net/manual-wix3/heat.htm
	ARGS="dir $DIR"
	ARGS="$ARGS -sw5151 -scom -sreg -nologo -ag -suid -template fragment -dr INSTALLDIR"
	ARGS="$ARGS -var env.$WIXVAR"
	ARGS="$ARGS -t install_dir_contents.xsl"
	# LMF [7131] 30-Mar-2011
	if [ $MEDIA_DISK_ID ]; then
		ARGS="$ARGS -out ${OUT}.tmp"
	else
		ARGS="$ARGS -out $OUT"
	fi
	ARGS="$ARGS $HEATARGS"		# callers args
	${WIXDIR}/heat.exe $ARGS
	
	# LMF [7131] 30-Mar-2011
	if [ $MEDIA_DISK_ID ]; then
		cat ${OUT}.tmp | sed "s/DiskId=\"1\"/DiskId=\"$MEDIA_DISK_ID\"/" 	\
			| sed "s/dir_heated_/dir_heated_${WIXVAR}_/" > $OUT
	fi
else
    echo "$DIR is Empty, abandoning harvest."
fi
}


make_ride()
{(

	export IS_WIN64="no"
	export PLATFORM="x86"
	export PROGRAMFILESFOLDER="ProgramFilesFolder"

	TARGET=$OBJ_FILES/setup_ride.msi

	LIGHT_OPTS="-nologo -spdb -dcl:high -loc English-US.wxl -reusecab -cc ${OBJ_CABINETS}"

	do_candle "$OBJ_TMP/RIDE.wixobj" "ride.wxs"
	do_candle "$OBJ_TMP/RideUI.wixobj" "rideui.wxs"
	do_candle "$OBJ_TMP/CommonUI.wixobj" "CommonUI.wxs"
	do_candle "$OBJ_TMP/CommonUIText.wixobj" "CommonUIText.wxs"
	do_candle "$OBJ_TMP/CommonErrorText.wixobj" "CommonErrorText.wxs"
	do_candle "$OBJ_TMP/CommonProgressText.wixobj" "CommonProgressText.wxs"

	${WIXDIR}/light.exe 	$LIGHT_OPTS					\
				-out ${TARGET}							\
				"$OBJ_TMP/RIDE.wixobj" 					\
				"$OBJ_TMP/RideUI.wixobj" 	\
				"$OBJ_TMP/CommonUI.wixobj" 				\
				"$OBJ_TMP/CommonErrorText.wixobj" 		\
				"$OBJ_TMP/CommonProgressText.wixobj" 	\
				"$OBJ_TMP/CommonUIText.wixobj" 			\
					 | grep -v "is a non-permanent system component"


)}


get_ride()
{(
#rm -rf $RIDEDIR
mkdir -p $RIDEDIR			# create tmp dir

cp -R ${RIDE_SRC}/* $RIDEDIR	# copy from build to tmp

HEATARGS="-srd"
install_dir_contents RIDEDIR $RIDEDIR ${OBJ_TMP}/RIDE.wxi $RIDE_FILES_MEDIA_DISK_ID 
)}

make_ride_setup()
{
rm -rf $OBJ_TMP/guids.h
echo "#define GUID_RIDE \"{$GUID_RIDE}\"" >> $OBJ_TMP/guids.h
echo "#define GUID_RIDE_UPGRADE \"{$GUID_RIDE_UPGRADE}\"" >> $OBJ_TMP/guids.h

#cp "$MK_LICENCE_FILE" $OBJ_FILES/licence.rtf

	(
	export SETUPTITLE="$RIDE_DESC_0 $RIDE_VERSION_ABC_DOT"

	export MK_SETUPDIR=$OBJ_TMP/RIDE
	export MK_RIDE_SETUP=1
	export MK_BITS=32
	export MK_ICONDIR=$OBJ_TMP/images

	export LIB="$LIB;c:/Program Files (x86)/Microsoft SDKs/Windows/v7.1A/Lib"
	cd $OBJ_TMP/setup
	. ./make.ksh

	cp ${MK_SETUPDIR}/setup.exe ${OBJ_FILES}/setup_ride.exe
	)
}

get_svn()
{
${SVNDIR}/svn export -q http://svn.dyalog.bramley/svn/dyalog/branches/14.1.dss/svn/installs/win/allwidth/setup $OBJ_TMP/setup
${SVNDIR}/svn export -q http://svn.dyalog.bramley/svn/dyalog/branches/14.1.dss/svn/installs/win/allwidth/images $OBJ_TMP/images
}

get_upgrade_guid()
{
UPGRADE_GUID=$(cat $JENKINSROOT/packagescripts/windows/upgrade_guids | grep  "^${RIDE_VERSION_AB_DOT}=" | sed "s/^${RIDE_VERSION_AB_DOT}=\(.*\)/\1/")
#echo UPGRADE_GUID=$UPGRADE_GUID

if [ _${UPGRADE_GUID}_ = "__" ]
then
	echo "${RIDE_VERSION_AB_DOT}=$(uuidgen)" >> $JENKINSROOT/packagescripts/windows/upgrade_guids
	UPGRADE_GUID=$(cat upgrade_guids | grep  "^${RIDE_VERSION_AB_DOT}=" | sed "s/^${RIDE_VERSION_AB_DOT}=\(.*\)/\1/")
	echo svn commit upgrade_guids -m "automatic add of upgrade guid"
fi

echo $UPGRADE_GUID
}

move_ride()
{
cd ${OBJ_FILES}/..
echo "Compressing Ride setup Files"
zip -r $RIDE_ZIP_FILENAME ride
cp $RIDE_ZIP_FILENAME $RIDE_SHIP

}

export WORKSPACE=$(echo $WORKSPACE | sed 's/\\/\//')

if ! [ "$RIDE_BRANCH" ]; then
	export RIDE_BRANCH="master"
fi

export RIDE_BITS="32"
export RIDE_SRC="$JENKINSROOT/_/ride40/ride40-win32-ia32"
export RIDE_SHIP="$JENKINSROOT/ship/"

export RIDE_VERSION_ABC_DOT=$(cat ${RIDE_SRC}/../../version | tr -d '\n')

export RIDE_VERSION_A=$(echo $RIDE_VERSION_ABC_DOT | sed "s/\([0-9]*\)\.\([0-9]*\)\.\([0-9]*\)/\1/")
export RIDE_VERSION_B=$(echo $RIDE_VERSION_ABC_DOT | sed "s/\([0-9]*\)\.\([0-9]*\)\.\([0-9]*\)/\2/")
export RIDE_VERSION_C=$(echo $RIDE_VERSION_ABC_DOT | sed "s/\([0-9]*\)\.\([0-9]*\)\.\([0-9]*\)/\3/")

export RIDE_VERSION=$RIDE_VERSION_ABC_DOT
export RIDE_VERSION_AB_DOT=${RIDE_VERSION_A}.${RIDE_VERSION_B}

export RIDE_ZIP_FILENAME="ride-${RIDE_VERSION}_windows.zip"

export RIDE_MIN_UPGRADE_VERSION=${RIDE_VERSION_AB_DOT}.0
export RIDE_MAX_UPGRADE_VERSION=${RIDE_VERSION_AB_DOT}.$((${RIDE_VERSION_C} - 1))

export GUID_RIDE="$(uuidgen | tr -d '\r\n')"
export GUID_RIDE_UPGRADE=$(get_upgrade_guid)

export WIXDIR="c:/wix36"
export SVNDIR="c:/svn"

export RIDE_FILES_MEDIA_DISK_ID=1

export OBJ_TMP=packagescripts/windows
export OBJ_FILES=${OBJ_TMP}/files/ride	# LMF [6886] 11-Feb-2011
export OBJ_CABINETS=${OBJ_TMP}/cabs
export RIDEDIR=$OBJ_TMP/RIDE

export RIDE_DESC_0="Dyalog RIDE"
export RIDE_DESC="$RIDE_DESC_0 $RIDE_VERSION"
export RIDE_EXE="ride${RIDE_VERSION_A}${RIDE_VERSION_B}.exe"
export RIDE_ICON_LABEL="Ride ${RIDE_VERSION_AB_DOT}"

#rm -rf $OBJ_TMP

mkdir -p $OBJ_TMP
mkdir -p $OBJ_FILES
mkdir -p $OBJ_CABINETS
mkdir -p $RIDEDIR

get_svn

get_ride
make_ride
make_ride_setup
move_ride
