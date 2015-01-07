#!/bin/bash
# This script is for Jenkins (continuous integration) to run.
set -e
umask 002 # user and group can do everything, others can only read and execute
mountpoint /devt; echo good # make sure it's mounted
r=/devt/ride/jsride
d=`date +%Y-%m-%d--%H-%M` # append a letter to $d if such a directory already exists
for suffix in '' {a..z}; do if [ ! -e $r/$d$suffix ]; then d=$d$suffix; break; fi; done
echo "copying to $r/$d"; cp -r build/dyalogjs $r/$d
echo 'updating "latest" symlink'; l=$r/latest; [ -L $l ]; rm $l; ln -s $d $l
echo 'cleaning up old releases'
for x in $(ls $r | grep -P '^\d{4}-\d{2}-\d{2}--\d{2}-\d{2}[a-z]?$' | sort | head -n-10); do
  echo "deleting $x"; rm -rf $r/$x || true
done
