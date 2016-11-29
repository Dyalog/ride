call "c:/Program files (x86)/Microsoft Visual Studio 8/VC/vcvarsall.bat"

set JENKINSDIR=%CD%

set RIDE_BRANCH=master

set CYGWIN_DIR=c:/cygwin
set CYGWIN=nodosfilewarning
%CYGWIN_DIR%/bin/bash.exe --login %JENKINSDIR%/make.sh
