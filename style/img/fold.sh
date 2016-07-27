#!/bin/bash
set -e
for x in open folded cont end; do
  rm -f fold_${x}.png
  inkscape fold.svg -C -j -e fold_${x}.png -i $x -w16
done
exiftool -all= -overwrite_original_in_place fold_*.png
