#!/bin/bash
cd "$(dirname "$0")"
. build.sh
pkg(){
  electron-packager . ride --platform=$1 --arch=$2 \
    --out=build/ride --overwrite --download.cache=cache --icon=favicon.ico \
    --app-copyright="(c) 2014-$(date +%Y) Dyalog Ltd" \
    --app-version="$(cat build/version)" \
    --build-version="$(cat build/version)" \
    --version-string.CompanyName='Dyalog Ltd' \
    --version-string.FileDescription='Remote Integrated Development Environment for Dyalog APL' \
    --version-string.OriginalFilename=ride.exe \
    --version-string.ProductName=RIDE \
    --version-string.InternalName=RIDE
}
pkg linux x64
pkg win32 ia32
pkg darwin x64
