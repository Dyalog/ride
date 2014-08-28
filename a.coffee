#!/usr/bin/env coffee
fs = require 'fs'
coffee = require 'coffee-script'
express = require 'express'
io = require 'socket.io'
net = require 'net'

debug = 1

jsFiles = [
  'node_modules/socket.io/node_modules/socket.io-client/socket.io.js'
  'node_modules/jquery/dist/cdn/jquery-2.1.1.min.js'
  'node_modules/codemirror/lib/codemirror.js'
  'node_modules/codemirror/mode/apl/apl.js'
  'jquery-ui.min.js'
  'jquery.layout.js'
  'lbar.js'
  'index.coffee'
]
cssFiles = [
  'node_modules/codemirror/lib/codemirror.css'
  'index.css'
]

log = (s) -> console.info process.uptime().toFixed(3) + ' ' + s

js = css = ''
do jsPrepare = ->
  js = jsFiles.map((f) -> s = fs.readFileSync f, 'utf8'; if /\.coffee$/.test f then coffee.compile s else s).join '\n'
  log "prepared js: #{js.length} bytes"
do cssPrepare = ->
  css = cssFiles.map((f) -> fs.readFileSync f, 'utf8').join '\n'
  log "prepared css: #{css.length} bytes"
jsFiles.forEach (f) -> fs.watch f, jsPrepare
cssFiles.forEach (f) -> fs.watch f, cssPrepare

b64 = (s) -> Buffer(s).toString 'base64'
b64d = (s) -> '' + Buffer s, 'base64'
getTag = (tagName, xml) -> (///^[^]*<#{tagName}>([^]*)</#{tagName}>[^]*$///.exec xml)?[1]

app = express()
router = express.Router()
router.use express.static __dirname

app.get '/D.js', (req, res) -> res.header('Content-Type', 'application/x-javascript').send js
app.get '/D.css', (req, res) -> res.header('Content-Type', 'text/css').send css

app.use '/', router
server = app.listen 3000, -> log 'HTTP server listening on :3000'

io.listen(server).on 'connection', (socket) ->
  log 'browser connected'
  client = net.connect {host: '127.0.0.1', port: 4502}, -> log 'interpreter connected'

  toInterpreter = (s) ->
    log 'to interpreter: ' + JSON.stringify(s)[..1000]
    console.assert /[\x01-\x7f]*/.test s
    b = Buffer s.length + 8
    b.writeInt32BE b.length, 0
    b.write 'RIDE' + s, 4
    client.write b

  toBrowser = (m...) -> log 'to browser: ' + JSON.stringify(m)[..1000]; socket.emit m...

  q = Buffer 0 # a buffer for data received from the server
  client.on 'data', (data) ->
    q = Buffer.concat [q, data]
    while q.length >= 4 and (n = q.readInt32BE 0) <= q.length
      m = '' + q[8...n]; q = q[n..]
      log 'from interpreter: ' + JSON.stringify(m)[..1000]
      if !/^(?:SupportedProtocols|UsingProtocol)=1$/.test m # ignore these
        switch (/^<(\w+)>/.exec m)?[1] or ''
          when 'ReplyIdentify', 'ReplyConnect', 'ReplyNotAtInputPrompt', 'ReplyEdit', 'ReplySaveChanges' then ; # ignore
          when 'ReplyExecute'       then toBrowser 'add', b64d getTag 'result', m
          when 'ReplyEchoInput'     then toBrowser 'add', b64d(getTag 'input', m) + '\n'
          when 'ReplyGetLog'        then toBrowser 'add', b64d getTag 'Log', m
          when 'ReplyAtInputPrompt' then toBrowser 'prompt'
          when 'ReplyOpenWindow'    then toBrowser 'open', b64d(getTag 'name', m), b64d(getTag 'text', m), +getTag 'token', m
          when 'ReplyFocusWindow'   then toBrowser 'focus', +getTag 'win', m
          when 'ReplyCloseWindow'   then toBrowser 'close', +getTag 'win', m
          else log 'unrecognised'
    return

  onevent = socket.onevent
  socket.onevent = (packet) ->
    log 'from browser: ' + JSON.stringify(packet.data)[..1000]
    onevent.apply socket, [packet]

  socket.on 'exec', (s) ->
    toInterpreter """
      <?xml version="1.0" encoding="utf-8"?>
      <Command>
        <cmd>Execute</cmd>
        <id>0</id>
        <args><Execute><Text>#{b64 s}</Text><Trace>0</Trace></Execute></args>
      </Command>
    """

  socket.on 'edit', (s, p) -> # s:current line  p:cursor position in s
    toInterpreter """
      <?xml version="1.0" encoding="utf-8"?>
      <Command>
        <cmd>Edit</cmd>
        <id>0</id>
        <args>
          <Edit>
            <Text>#{b64 s}</Text>
            <Pos>#{p}</Pos>
            <Win>0</Win>
          </Edit>
        </args>
      </Command>
    """

  socket.on 'save', (win, text) ->
    toInterpreter """
      <?xml version="1.0" encoding="utf-8"?>
      <Command>
        <cmd>SaveChanges</cmd>
        <id>0</id>
        <args>
          <SaveChanges>
            <win>#{win}</win>
            <Text>#{b64 text}</Text>
            <attributes>
              <LineAttribute>
                <attribute>Stop</attribute>
                <values>
                  #{
                    (
                      for i in [0...text.split('\n').length] by 1 then "
                        <LineAttributeValue>
                          <row>#{i}</row>
                          <value>0</value>
                        </LineAttributeValue>
                      "
                    ).join '\n'
                  }
                </values>
              </LineAttribute>
            </attributes>
          </SaveChanges>
        </args>
      </Command>
    """

  socket.on 'close', (win) ->
    toInterpreter """
      <?xml version="1.0" encoding="utf-8"?>
      <Command>
        <cmd>CloseWindow</cmd>
        <id>0</id>
        <args><CloseWindow><win>#{win}</win></CloseWindow></args>
      </Command>
    """

  # Send the first few packets immediately to reduce latency
  toInterpreter 'SupportedProtocols=1'
  toInterpreter 'UsingProtocol=1'
  toInterpreter '<?xml version="1.0" encoding="utf-8"?><Command><cmd>Identify</cmd><id>0</id><args><Identify><Sender><Process>RIDE.EXE</Process><Proxy>0</Proxy></Sender></Identify></args></Command>'
  toInterpreter '<?xml version="1.0" encoding="utf-8"?><Command><cmd>Connect</cmd><id>0</id><args><Connect><Token /></Connect></args></Command>'

  client.on 'end', -> log 'interpreter disconnected'; socket.emit 'end'
  socket.on 'disconnect', -> log 'browser disconnected'; client.end()
