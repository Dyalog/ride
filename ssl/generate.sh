#!/bin/bash
set -e

openssl genrsa -out key.pem 1024
openssl req -new -key key.pem -out certrequest.csr
openssl x509 -req -in certrequest.csr -signkey key.pem -out cert.pem
rm certrequest.csr
