#!/bin/bash
set -e
mkdir icons
grep base64 style.sass | sed 's/^.*base64,\([a-zA-Z0-9+\/=]*\).*$/\1/' | while read a; do
  echo $a | base64 -d >icons/$(echo $a | md5sum | cut -b-8).png
done
zip icons.zip icons/*
rm -r icons
