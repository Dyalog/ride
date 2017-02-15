#!/bin/bash

for S in 16 24 32 48 128 256 512; do
    convert D.png -resize ${S}x${S} D$S.png
done

# http://stackoverflow.com/questions/3236115/which-icon-sizes-should-my-windows-applications-icon-include
convert D{16,24,32,48,256}.png D.ico

png2icns D.icns D{16,32,48,128,256,512}.png > /dev/null

rm D[0-9]*.png
