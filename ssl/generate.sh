#!/bin/bash
set -e
openssl req -batch -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 1000000 -nodes
