#!/bin/bash
set -e
for x in breakpoint; do
  rm -f ${x}.png
  inkscape _.svg -i$x -D -j -e${x}.png
  exiftool -all= -overwrite_original_in_place ${x}.png
done
