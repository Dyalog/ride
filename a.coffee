#!/usr/bin/env coffee
express = require 'express'
net = require 'net'

rideMsg = (s) ->
  console.assert /[\x00-\xff]*/.test s
  b = new Buffer s.length + 8
  b.writeInt32BE b.length, 0
  b.write 'RIDE' + s, 4
  b

b64 = (s) -> new Buffer(s).toString 'base64'
b64d = (s) -> '' + new Buffer s, 'base64'

client = net.connect {host: '127.0.0.1', port: 4502}, ->

  session = '' # the text of it

  q = new Buffer 0 # a queue for data received from the server
  client.on 'data', (data) ->
    console.info 'data: ', data.length
    console.info 'data: ' + data
    q = Buffer.concat [q, data]
    while q.length >= 4 and (n = q.readInt32BE 0) <= q.length
      processServerMsg q[8...n].toString()
      q = q[n..]
    return

  processServerMsg = (m) ->
    session +=
      if /^<ReplyExecute>/.test m
        b64d m.replace /^[^]*<result>([^]*)<\/result>[^]*$/, '$1'
      else if /^<ReplyEchoInput>/.test m
        "      #{b64d m.replace /^[^]*<input>([^]*)<\/input>[^]*$/, '$1'}\n"
      else
        ''

  client.write rideMsg 'SupportedProtocols=1'
  client.write rideMsg 'UsingProtocol=1'
  client.write rideMsg '''<?xml version="1.0" encoding="utf-8"?><Command><cmd>Identify</cmd><id>0</id><args><Identify><Sender><Process>RIDE.EXE</Process><Proxy>0</Proxy></Sender></Identify></args></Command>'''

  app = express()
  router = express.Router()
  router.use express.static __dirname

  app.use (req, res, next) ->
    data = ''
    req.setEncoding 'utf8'
    req.on 'data', (chunk) -> data += chunk
    req.on 'end', -> req.body = data; next()

  app.post '/session', (req, res, next) ->
    s = req.body + '\n'
    client.write rideMsg """<?xml version="1.0" encoding="utf-8"?><Command><cmd>Execute</cmd><id>0</id><args><Execute><Text>#{b64 s}</Text><Trace>0</Trace></Execute></args></Command>"""
    res.send 'ok'

  app.get '/session', (req, res) -> res.send session; session = ''
  app.use '/', router
  app.listen 3000
