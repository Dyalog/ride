#!/bin/bash
set -e -o pipefail
export PATH="$(dirname "$0")/node_modules/.bin:$PATH"
cd "$(dirname "$0")"
if [ ! -e node_modules ]; then npm i; fi

mkdir -p build/themes
for f in style themes/classic themes/redmond themes/cupertino; do
  i=style/${f}.less o=build/${f}.css
  if [ ! -e $o -o $i -nt $o ]; then echo "preprocessing $i"; lessc $i $o; fi
done

echo 'generating version info'
v=$(node -e "console.log($(cat package.json).version.replace(/\.0$/,''))").$(git rev-list --count HEAD)
echo $v >build/version # for the benefit of installers
cat >build/version.js <<.
D={versionInfo:{version:'$v',date:'$(git show -s HEAD --pretty=format:%ci)',rev:'$(git rev-parse HEAD)'}}
.
