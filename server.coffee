#!/usr/bin/env coffee
fs = require 'fs'
coffee = require 'coffee-script'
express = require 'express'
io = require 'socket.io'
net = require 'net'
https = require 'https'

jsFiles = [
  'node_modules/socket.io/node_modules/socket.io-client/socket.io.js'
  'node_modules/jquery/dist/cdn/jquery-2.1.1.min.js'
  'node_modules/codemirror/lib/codemirror.js'
  'node_modules/codemirror/mode/apl/apl.js'
  'node_modules/codemirror/addon/hint/show-hint.js'
  'jquery-ui.min.js'
  'jquery.layout.js'
  'lbar.js'
  'session.coffee'
  'editor.coffee'
  'index.coffee'
]
cssFiles = [
  'node_modules/codemirror/lib/codemirror.css'
  'index.css'
]

log = (s) -> console.info process.uptime().toFixed(3) + ' ' + s
b64 = (s) -> Buffer(s).toString 'base64'
b64d = (s) -> '' + Buffer s, 'base64'
getTag = (tagName, xml) -> (///^[^]*<#{tagName}>([^<]*)</#{tagName}>[^]*$///.exec xml)?[1]

# preload files into memory so we can serve them faster
html = css = js = ''
do prepareHTML = ->
  html = fs.readFileSync 'index.html', 'utf8'
  log "prepared html: #{html.length} bytes"
do prepareJS = ->
  js = jsFiles.map((f) -> s = fs.readFileSync f, 'utf8'; if /\.coffee$/.test f then coffee.compile s, bare: 1 else s).join '\n'
  log "prepared js: #{js.length} bytes"
do prepareCSS = ->
  css = cssFiles.map((f) -> fs.readFileSync f, 'utf8').join '\n'
  log "prepared css: #{css.length} bytes"
fs.watch 'index.html', prepareHTML
jsFiles.forEach (f) -> fs.watch f, prepareJS
cssFiles.forEach (f) -> fs.watch f, prepareCSS
ttf = fs.readFileSync 'apl385.ttf'

app = express()
app.get '/',           (req, res) -> res.header('Content-Type', 'text/html'               ).send html
app.get '/D.css',      (req, res) -> res.header('Content-Type', 'text/css'                ).send css
app.get '/D.js',       (req, res) -> res.header('Content-Type', 'application/x-javascript').send js
app.get '/apl385.ttf', (req, res) -> res.header('Content-Type', 'application/octet-stream').send ttf

httpsOptions =
  key: fs.readFileSync 'ssl/key.pem'
  cert: fs.readFileSync 'ssl/cert.pem'
server = https.createServer(httpsOptions, app).listen (httpsPort = 8443),
  -> log "HTTPS server listening on :#{httpsPort}"

client = net.connect {host: '127.0.0.1', port: 4502}, -> log 'interpreter connected'

toInterpreter = (s) ->
  log 'to interpreter: ' + JSON.stringify(s)[..1000]
  console.assert /[\x01-\x7f]*/.test s
  b = Buffer s.length + 8
  b.writeInt32BE b.length, 0
  b.write 'RIDE' + s, 4
  client.write b

toInterpreter 'SupportedProtocols=1'
toInterpreter 'UsingProtocol=1'

io.listen(server).on 'connection', (socket) ->
  log 'browser connected'

  toBrowser = (m...) -> log 'to browser: ' + JSON.stringify(m)[..1000]; socket.emit m...

  q = Buffer 0 # a buffer for data received from the server
  client.on 'data', (data) ->
    q = Buffer.concat [q, data]
    while q.length >= 4 and (n = q.readInt32BE 0) <= q.length
      m = '' + q[8...n]; q = q[n..]
      log 'from interpreter: ' + JSON.stringify(m)[..1000]
      if !/^(?:SupportedProtocols|UsingProtocol)=1$/.test m # ignore these
        switch (/^<(\w+)>/.exec m)?[1] or ''
          when 'ReplyConnect', 'ReplyNotAtInputPrompt', 'ReplyEdit', 'ReplySaveChanges' then ; # ignore
          when 'ReplyIdentify'      then toBrowser 'title', b64d getTag 'Project', m
          when 'ReplyExecute'       then toBrowser 'add', b64d getTag 'result', m
          when 'ReplyEchoInput'     then toBrowser 'add', b64d(getTag 'input', m) + '\n'
          when 'ReplyGetLog'        then toBrowser 'add', b64d getTag 'Log', m
          when 'ReplyAtInputPrompt' then toBrowser 'prompt'
          when 'ReplyOpenWindow'    then toBrowser 'open', b64d(getTag 'name', m), b64d(getTag 'text', m), +getTag('token', m), +getTag 'bugger', m
          when 'ReplyFocusWindow'   then toBrowser 'focus', +getTag 'win', m
          when 'ReplyCloseWindow'   then toBrowser 'close', +getTag 'win', m
          when 'ReplyGetAutoComplete'
            o = b64d getTag 'options', m
            toBrowser 'autocomplete', +getTag('token', m), +getTag('skip', m), (if o then o.split '\n' else [])
          when 'ReplyHighlightLine' then toBrowser 'highlight', +getTag('win', m), +getTag 'line', m
          else log 'unrecognised'
    return

  onevent = socket.onevent
  socket.onevent = (packet) ->
    log 'from browser: ' + JSON.stringify(packet.data)[..1000]
    onevent.apply socket, [packet]

  X = '<?xml version="1.0" encoding="utf-8"?>'

  socket.on 'exec', (s, trace) ->
    toInterpreter X + """
      <Command>
        <cmd>Execute</cmd>
        <id>0</id>
        <args><Execute><Text>#{b64 s}</Text><Trace>#{+!!trace}</Trace></Execute></args>
      </Command>
    """

  socket.on 'edit', (s, p) -> # s:current line  p:cursor position in s
    toInterpreter X + """
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
    toInterpreter X + """
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
    toInterpreter X + """
      <Command>
        <cmd>CloseWindow</cmd>
        <id>0</id>
        <args><CloseWindow><win>#{win}</win></CloseWindow></args>
      </Command>
    """

  socket.on 'autocomplete', (line, pos, token) ->
    toInterpreter X + """
      <Command>
        <cmd>GetAutoComplete</cmd>
        <id>0</id>
        <args>
          <GetAutoComplete>
            <line>#{b64 line}</line>
            <pos>#{pos}</pos>
            <token>#{token}</token>
          </GetAutoComplete>
        </args>
      </Command>
    """

  socket.on 'over', (win) ->
    toInterpreter X + """
      <Command><cmd>DebugRunLine</cmd><id>0</id><args><DebugRunLine><win>#{win}</win></DebugRunLine></args></Command>
    """

  socket.on 'into', (win) ->
    toInterpreter X + """
      <Command><cmd>DebugStepInto</cmd><id>0</id><args><DebugStepInto><win>#{win}</win></DebugStepInto></args></Command>
    """

  socket.on 'back', (win) ->
    toInterpreter X + """
      <Command><cmd>DebugBackward</cmd><id>0</id><args><DebugBackward><win>#{win}</win></DebugBackward></args></Command>
    """

  socket.on 'skip', (win) ->
    toInterpreter X + """
      <Command><cmd>DebugForward</cmd><id>0</id><args><DebugForward><win>#{win}</win></DebugForward></args></Command>
    """

  socket.on 'continueTrace', (win) ->
    toInterpreter X + """
      <Command><cmd>DebugContinueTrace</cmd><id>0</id><args><DebugContinueTrace><win>#{win}</win></DebugContinueTrace></args></Command>
    """

  socket.on 'continueExec', (win) ->
    toInterpreter X + """
      <Command><cmd>DebugContinue</cmd><id>0</id><args><DebugContinue><win>#{win}</win></DebugContinue></args></Command>
    """

  socket.on 'restartThreads', (win) ->
    toInterpreter X + """
      <Command><cmd>DebugRestartThreads</cmd><id>0</id><args><DebugRestartThreads><win>#{win}</win></DebugRestartThreads></args></Command>
    """

  socket.on 'interrupt', ->
    toInterpreter X + """
      <Command><cmd>WeakInterrupt</cmd><id>0</id><args><WeakInterrupt /></args></Command>
    """

  socket.on 'cutback', (win) ->
    toInterpreter X + """
      <Command><cmd>DebugCutback</cmd><id>0</id><args><DebugCutback><win>#{win}</win></DebugCutback></args></Command>
    """

  toInterpreter X + '<Command><cmd>Identify</cmd><id>0</id><args><Identify><Sender><Process>RIDE.EXE</Process><Proxy>0</Proxy></Sender></Identify></args></Command>'
  toInterpreter X + '<Command><cmd>Connect</cmd><id>0</id><args><Connect><Token /></Connect></args></Command>'
  toInterpreter X + '<Command><cmd>GetWindowLayout</cmd><id>0</id><args><GetWindowLayout /></args></Command>'

  client.on 'end', -> log 'interpreter disconnected'; socket.emit 'end'
  socket.on 'disconnect', -> log 'browser disconnected'
