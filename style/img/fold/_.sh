#!/bin/bash
set -e
rm -f *.png
for x in plus minus cont last; do inkscape _.svg -C -j -e${x}.png -i$x -w16; done
exiftool -all= -overwrite_original_in_place *.png
