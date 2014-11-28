#!/usr/bin/env node_modules/coffee-script/bin/coffee

DEFAULT_HOST = '127.0.0.1'
DEFAULT_PORT = 4502

fs = require 'fs'
if fs.existsSync 'build.sh'
  # we are running on a developer box, invoke the build script first
  require 'coffee-script/register'
  execSync = require 'exec-sync'
  throttle = (f) -> tid = null; -> if !tid? then tid = setTimeout (-> f(); tid = null), 200
  do build = throttle -> console.info 'building...'; execSync './build.sh'; console.info 'build done'
  'client/editor.coffee client/init.coffee client/keymap.coffee client/session.coffee client/welcome.coffee style/style.css style/apl385.ttf index.html'
    .split(' ').forEach (f) -> fs.watch f, build

opts = require('nomnom').options(
  host: position: 0, help: "interpreter host to connect to, default: #{DEFAULT_HOST}"
  port: position: 1, help: "interpreter port to connect to, default: #{DEFAULT_PORT}"
  cert: help: 'PEM-encoded certificate file for https', default: 'ssl/cert.pem'
  key:  help: 'PEM-encoded private key file for https', default: 'ssl/key.pem'
  insecure: flag: true, help: 'use http (on port 8000) instead of https (on port 8443)'
  ipv6: abbr: '6', flag: true, help: 'use IPv6'
).parse()

express = require 'express'
app = express()
app.disable 'x-powered-by'
app.use (req, res, next) -> console.info req.method + ' ' + req.path; next()
app.use do require 'compression'
app.use '/', express.static 'build/static'
if opts.insecure
  server = require('http').createServer(app).listen (httpPort = 8000), (if opts.ipv6 then '::' else '0.0.0.0'),
    -> console.info "http server listening on :#{httpPort}"
else
  httpsOptions = cert: fs.readFileSync(opts.cert), key: fs.readFileSync(opts.key)
  server = require('https').createServer(httpsOptions, app).listen (httpsPort = 8443), (if opts.ipv6 then '::' else '0.0.0.0'),
    -> console.info "https server listening on :#{httpsPort}"
require('socket.io').listen(server).on 'connection', require('./proxy').Proxy opts.host, opts.port
