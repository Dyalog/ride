#!/usr/bin/env node_modules/coffee-script/bin/coffee
compression = require 'compression'
express = require 'express'
fs = require 'fs'
http = require 'http'
https = require 'https'
io = require 'socket.io'
nomnom = require 'nomnom'
{Proxy} = require './proxy'
{spawn} = require 'child_process'

t0 = +new Date; log = (s) -> process.stdout.write "#{new Date - t0}: #{s}\n"

opts = nomnom.options(
  cert: metavar: 'FILE', help: 'PEM-encoded certificate for https', default: 'ssl/cert.pem'
  key:  metavar: 'FILE', help: 'PEM-encoded private key for https', default: 'ssl/key.pem'
  insecure: flag: true, help: 'use http (on port 8000) instead of https (on port 8443)'
  ipv6: abbr: '6', flag: true, help: 'use IPv6'
  watch: abbr: 'w', flag: true, help: 'watch for changes and rebuild (useful for development)'
).parse()

if opts.watch then do ->
  _d = __dirname; tid = isRunning = 0
  build = ->
    if isRunning
      tid = setTimeout build, 100
    else
      log 'building'; tid = 0; isRunning = 1
      spawn("#{_d}/build-server.sh", cwd: _d, stdio: 'inherit').on 'close', -> log 'build done'; isRunning = 0; return
    return
  for x in ['.', 'client', 'style', 'style/themes'] then fs.watch "#{_d}/#{x}", -> tid ||= setTimeout build, 100; return
  return

app = express()
app.disable 'x-powered-by'
app.use (req, res, next) -> log req.method + ' ' + req.path; next()
app.use compression()
app.use '/', express.static 'build/static'
if opts.insecure
  server = http.createServer(app).listen (httpPort = 8000), (if opts.ipv6 then '::' else '0.0.0.0'),
    -> log "http server listening on :#{httpPort}"
else
  httpsOptions = cert: fs.readFileSync(opts.cert), key: fs.readFileSync(opts.key)
  server = https.createServer(httpsOptions, app).listen (httpsPort = 8443), (if opts.ipv6 then '::' else '0.0.0.0'),
    -> log "https server listening on :#{httpsPort}"
io.listen(server).on 'connection', Proxy()
