#!/bin/bash
set -e
cd $(dirname "$0")

echo 'Exporting doc archive from svn...'
z=webhelp.zip
svn export --force -q http://svn.dyalog.bramley/svn/docbin/trunk/documentation/web/$z
echo 'Extracting...'
rm -rf tmp help && unzip -q $z -d tmp && mv tmp/Content help && rm -rf tmp $z
echo 'Clearing executable flag from files...'
find help -type f -print0 | xargs -0 chmod a-x
echo 'Removing some unnecessary files...'
rm -rf help/Glossary.* help/SkinSupport/ help/Resources/ \
    help/InterfaceGuide/Images/Grid_Components.png
../node_modules/coffee-script/bin/coffee ./fatburner.coffee
echo 'Done.'
