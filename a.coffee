#!/usr/bin/env coffee

rideMsg = (s) ->
  console.assert /[\x00-\xff]*/.test s
  b = Buffer s.length + 8
  b.writeInt32BE b.length, 0
  b.write 'RIDE' + s, 4
  b

b64 = (s) -> Buffer(s).toString 'base64'
b64d = (s) -> '' + Buffer s, 'base64'

express = require 'express'
app = express()
router = express.Router()
router.use express.static __dirname

# compile *.coffee on the fly and serve it as *.js
app.get '/:name.js', (req, res, next) ->
  require('fs').readFile "#{__dirname}/#{req.params.name}.coffee", 'utf8', (err, s) ->
    if err then console.error err; res.status(404).send ''
    else res.header('Content-Type', 'application/x-javascript').send require('coffee-script').compile s, bare: true
    next()

app.use '/', router
server = app.listen 3000, -> console.info 'HTTP server listening on :3000'

require('socket.io').listen(server).on 'connection', (socket) ->
  console.info 'browser connected'
  client = require('net').connect {host: '127.0.0.1', port: 4502}, -> console.info 'interpreter connected'

  toInterpreter = (s) -> console.info 'to interpreter: ' + JSON.stringify(s)[..100]; client.write rideMsg s
  toBrowser = (m...) -> console.info 'to browser: ' + JSON.stringify(m)[..100]; socket.emit m...

  q = Buffer 0 # a buffer for data received from the server
  client.on 'data', (data) ->
    q = Buffer.concat [q, data]
    while q.length >= 4 and (n = q.readInt32BE 0) <= q.length
      m = '' + q[8...n]
      q = q[n..]
      console.info 'from interpreter: ' + JSON.stringify(m)[..100]
      if /^SupportedProtocols=/.test m
        # ignore
      else if /^UsingProtocol=/.test m
        # ignore
      else if /^<ReplyIdentify>/.test m
        # ignore
      else if /^<ReplyConnect>/.test m
        # ignore
      else if /^<ReplyExecute>/.test m
        toBrowser 'add', b64d m.replace /^[^]*<result>([^]*)<\/result>[^]*$/, '$1'
      else if /^<ReplyNotAtInputPrompt>/.test m
        # ignore
      else if /^<ReplyEchoInput>/.test m
        toBrowser 'add', b64d(m.replace /^[^]*<input>([^]*)<\/input>[^]*$/, '$1') + '\n'
      else if /^<ReplyAtInputPrompt>/.test m
        toBrowser 'prompt'
      else if /^<ReplyGetLog>/.test m
        toBrowser 'add', b64d m.replace /^[^]*<Log>([^]*)<\/Log>[^]*$/, '$1'
      else
        console.info 'unrecognised'
    return

  socket.on 'exec', (s) ->
    console.info 'from browser: ' + JSON.stringify ['exec', s]
    toInterpreter """
      <?xml version="1.0" encoding="utf-8"?>
      <Command>
        <cmd>Execute</cmd>
        <id>0</id>
        <args><Execute><Text>#{b64 s}</Text><Trace>0</Trace></Execute></args>
      </Command>
    """

  toInterpreter 'SupportedProtocols=1'
  toInterpreter 'UsingProtocol=1'
  toInterpreter '<?xml version="1.0" encoding="utf-8"?><Command><cmd>Identify</cmd><id>0</id><args><Identify><Sender><Process>RIDE.EXE</Process><Proxy>0</Proxy></Sender></Identify></args></Command>'
  toInterpreter '<?xml version="1.0" encoding="utf-8"?><Command><cmd>Connect</cmd><id>0</id><args><Connect><Token /></Connect></args></Command>'


  client.on 'end', -> console.info 'interpreter disconnected'; socket.emit 'end'
  socket.on 'disconnect', -> console.info 'browser disconnected'; client.end()
