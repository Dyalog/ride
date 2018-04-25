#!/bin/bash
set -e

# Create D.ico and D.icns from D.png

for S in 16 24 32 48 128 256 512; do
    convert D.png -resize ${S}x${S} D$S.png
done

# http://stackoverflow.com/questions/3236115/which-icon-sizes-should-my-windows-applications-icon-include
convert D{256,48,32,24,16}.png D.ico

png2icns D.icns D{16,32,48,128,256,512}.png > /dev/null

rm D[0-9]*.png
