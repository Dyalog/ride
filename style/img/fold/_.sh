#!/bin/bash
set -e
for x in plus minus cont last; do
  p=${x}.png; rm -f $p; inkscape _.svg -C -j -e$p -i$x -w16; exiftool -all= -overwrite_original_in_place $p
done
