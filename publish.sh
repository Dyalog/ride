#!/bin/bash
set -e
if [ `id -un` != nick -a "$1" != iknow ]; then echo "here be dragons; don't run it unless you know what you're doing"; exit 1; fi
git stash && ./clean.sh && ./dist.sh && (git stash pop || true)
if ! mountpoint /devt >/dev/null; then echo 'mounting devt' && sudo mount /devt; fi
r=/devt/ride/jsride
d=`date +%Y-%m-%d--%H-%M`
if [ -e $r/$d ]; then echo "$r/$d already exists, try again later"; exit 2; fi
echo "copying to $r/$d" && cp -r build/dyalogjs $r/$d
echo 'updating "latest" symlink'
[ -L $r/latest ] && rm $r/latest && ln -s $d $r/latest
echo 'all available releases in $r:' && ls $r
