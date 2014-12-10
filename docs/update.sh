#!/bin/bash
set -e
cd $(dirname "$0")

echo 'Exporting doc archive from svn...'
z=webhelp.zip
svn export --force -q http://svn.dyalog.bramley/svn/docbin/trunk/documentation/web/$z
echo 'Extracting...'
rm -rf Content && unzip -q $z 'Content/Language/*' && rm -rf help $z && mv Content help
echo 'Clearing executable flag from files...'
find help -type f -print0 | xargs -0 chmod a-x
../node_modules/coffee-script/bin/coffee ./fatburner.coffee
echo 'Done.'
