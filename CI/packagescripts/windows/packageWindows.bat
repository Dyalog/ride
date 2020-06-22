@setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

set JENKINSDIR=%CD%

for /F "tokens=1,2,3 delims=/" %%a in ("%JOB_NAME%") do set GHBRANCH=%%c

IF "%GHBRANCH:~0,2%"=="PR" ( GOTO PR ) else ( GOTO BUILD )

IF not x%GHBRANCH:-=%==x%GHBRANCH% (GOTO PR) else (GOTO BUILD)

:PR
	echo Skipping creating Windows installer for pull requests or branches with a hyphen"
	GOTO END

:BUILD

call "c:/Program files (x86)/Microsoft Visual Studio 8/VC/vcvarsall.bat"

set RIDE_BRANCH=master

set CYGWIN_DIR=c:/cygwin
set CYGWIN=nodosfilewarning
%CYGWIN_DIR%/bin/bash.exe --login -c "cd $JENKINSDIR ; packagescripts/windows/make.sh"

:END
