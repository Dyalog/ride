#!/bin/bash

rm D.icns

for S in 16 32 48 128 256 512; do
convert D.png -resize ${S}x${S} icns_${S}px.png

done

png2icns D.icns icns_*px.png

rm icns_*px.png
