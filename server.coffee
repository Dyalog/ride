#!/usr/bin/env node_modules/coffee-script/bin/coffee
fs = require 'fs'
t0 = +new Date; log = (s) -> process.stdout.write "#{new Date - t0}: #{s}\n"

opts = require('nomnom').options(
  cert: metavar: 'FILE', help: 'PEM-encoded certificate for https', default: 'ssl/cert.pem'
  key:  metavar: 'FILE', help: 'PEM-encoded private key for https', default: 'ssl/key.pem'
  insecure: flag: true, help: 'use http (on port 8000) instead of https (on port 8443)'
  ipv6: abbr: '6', flag: true, help: 'use IPv6'
).parse()

express = require 'express'
app = express()
app.disable 'x-powered-by'
app.use (req, res, next) -> log req.method + ' ' + req.path; next()
app.use do require 'compression'
app.use '/', express.static 'build/static'
if opts.insecure
  server = require('http').createServer(app).listen (httpPort = 8000), (if opts.ipv6 then '::' else '0.0.0.0'),
    -> log "http server listening on :#{httpPort}"
else
  httpsOptions = cert: fs.readFileSync(opts.cert), key: fs.readFileSync(opts.key)
  server = require('https').createServer(httpsOptions, app).listen (httpsPort = 8443), (if opts.ipv6 then '::' else '0.0.0.0'),
    -> log "https server listening on :#{httpsPort}"
require('socket.io').listen(server).on 'connection', require('./proxy').Proxy()
