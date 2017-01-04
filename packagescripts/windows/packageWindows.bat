call "c:/Program files (x86)/Microsoft Visual Studio 8/VC/vcvarsall.bat"

set JENKINSDIR=%CD%

for /F "delims=/" %%a in (%JOB_NAME%) do set GHBRANCH=%%c

IF "%GHBRANCH:~0,2%"=="PR" ( GOTO PR ) else ( GOTO BUILD )

:PR
	echo Skipping creating installer for pull requests
	GOTO END

:BUILD
set RIDE_BRANCH=master

set CYGWIN_DIR=c:/cygwin
set CYGWIN=nodosfilewarning
%CYGWIN_DIR%/bin/bash.exe --login -c "cd $JENKINSDIR ; packagescripts/windows/make.sh"

:END
