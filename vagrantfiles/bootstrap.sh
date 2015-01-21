#!/usr/bin/env bash
set -e

apt-get update
apt-get install -y curl

curl -sL https://deb.nodesource.com/setup | sudo bash -

apt-get install -y git nodejs


