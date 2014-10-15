#!/usr/bin/env coffee
fs      = require 'fs'
coffee  = require 'coffee-script'
express = require 'express'
compression = require 'compression'
io      = require 'socket.io'
net     = require 'net'
https   = require 'https'
uglify  = require 'uglify-js'
cleanCSS = new (require 'clean-css')

jsFiles = [
  'node_modules/socket.io/node_modules/socket.io-client/socket.io.js'
  'node_modules/jquery/dist/cdn/jquery-2.1.1.min.js'
  'node_modules/codemirror/lib/codemirror.js'
  'node_modules/codemirror/mode/apl/apl.js'
  'node_modules/codemirror/addon/hint/show-hint.js'
  'node_modules/codemirror/addon/edit/matchbrackets.js'
  'node_modules/codemirror/addon/edit/closebrackets.js'
  'node_modules/jquery-ui/core.js'
  'node_modules/jquery-ui/widget.js'
  'node_modules/jquery-ui/mouse.js'
  'node_modules/jquery-ui/position.js'
  'node_modules/jquery-ui/draggable.js'
  'node_modules/jquery-ui/droppable.js'
  'node_modules/jquery-ui/resizable.js'
  'node_modules/jquery-ui/button.js'
  'node_modules/jquery-ui/dialog.js'
  'node_modules/jquery-ui/effect.js'
  'node_modules/jquery-ui/effect-slide.js'
  'jquery.layout.js'
  'lbar/lbar.js'
  'client/keymap.coffee'
  'client/session.coffee'
  'client/editor.coffee'
  'client/init.coffee'
  'docs/help-urls.coffee'
]
cssFiles = [
  'node_modules/codemirror/lib/codemirror.css'
  'style.css'
]

log = do ->
  N = 20; T = 1000 # log no more than N log messages per T milliseconds
  n = t = 0
  (s) ->
    if (t1 = +new Date) - t > T then t = t1; n = 1
    if ++n < N then console.info process.uptime().toFixed(3) + ' ' + s
    else if n == N then console.info '... logging temporarily suppressed'

b64 = (s) -> Buffer(s).toString 'base64'
b64d = (s) -> '' + Buffer s, 'base64'
getTag = (tagName, xml) -> (///^[^]*<#{tagName}>([^<]*)</#{tagName}>[^]*$///.exec xml)?[1]

# preload files into memory so we can serve them faster

html = ''
do preloadHTML = ->
  html = fs.readFileSync('index.html', 'utf8')
    .replace /<!--\s*include\s+(\S+)\s*-->/g, (_, f) ->
      fs.readFileSync f, 'utf8'
  log "preloaded html: #{html.length} bytes"
fs.watch 'index.html', preloadHTML

css = ''
do preloadCSS = ->
  css0 = cssFiles.map((f) -> fs.readFileSync f, 'utf8').join '\n'
  css = cleanCSS.minify css0
  log "preloaded css: #{Buffer(css0).length}→#{Buffer(css).length} bytes"
cssFiles.forEach (f) -> fs.watch f, preloadCSS

js = ''
do preloadJS = ->
  js = ''
  for f in jsFiles
    f1 = "cache/#{f.replace /\//g, '_'}.uglified"
    if !fs.existsSync(f1) || fs.statSync(f1).mtime < fs.statSync(f).mtime
      if !fs.existsSync 'cache' then fs.mkdirSync 'cache'
      ib = fs.readFileSync f # input buffer
      sizes = [ib.length]
      s = ib + ''
      if /\.coffee$/.test f
        s = coffee.compile s, bare: 1
        sizes.push Buffer(s).length
      if !/\.min\.js$/.test f
        s1 = uglify.minify(
          s.replace(/^(?:.*require.*;\n)*/, '')
          fromString: true, mangle: true
        ).code
        ob = Buffer s1 # output buffer
        sizes.push ob.length
        try fs.writeFileSync f1, ob catch # ignore errors
        s = s1
      log "  #{f} #{sizes.join '→'} bytes"
    else
      s = fs.readFileSync f1, 'utf8'
    js += s + '\n'
  log "preloaded js: #{js.length} bytes"
jsFiles.forEach (f) -> fs.watch f, preloadJS

ttf = fs.readFileSync 'apl385.ttf'
ico = fs.readFileSync 'favicon.ico'

app = express()
app.use compression()
app.disable 'x-powered-by'
app.get '/',            (req, res) -> res.header('Content-Type', 'text/html'               ).send html
app.get '/D.css',       (req, res) -> res.header('Content-Type', 'text/css'                ).send css
app.get '/D.js',        (req, res) -> res.header('Content-Type', 'application/x-javascript').send js
app.get '/apl385.ttf',  (req, res) -> res.header('Content-Type', 'application/octet-stream').send ttf
app.get '/favicon.ico', (req, res) -> res.header('Content-Type', 'image/x-icon'            ).send ico
app.use '/help',     express.static __dirname + '/docs/help'
app.use '/help.css', express.static __dirname + '/docs/help.css'
app.use '/help.js',  express.static __dirname + '/docs/help.js'

httpsOptions =
  key: fs.readFileSync 'ssl/key.pem'
  cert: fs.readFileSync 'ssl/cert.pem'
server = https.createServer(httpsOptions, app).listen (httpsPort = 8443),
  -> log "https server listening on :#{httpsPort}"

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

cmd = (name, args) -> toInterpreter """<?xml version="1.0" encoding="utf-8"?><Command><cmd>#{name}</cmd><id>0</id><args><#{name}>#{args}</#{name}></args></Command>"""

sockets = [] # list of socket.io connections to browsers

toBrowser = (m...) ->
  log 'to browser: ' + JSON.stringify(m)[..1000]
  for socket in sockets then socket.emit m...
  return

queue = Buffer 0 # a buffer for data received from the server
client.on 'data', (data) ->
  queue = Buffer.concat [queue, data]
  while queue.length >= 4 and (n = queue.readInt32BE 0) <= queue.length
    m = '' + queue[8...n]; queue = queue[n..]
    log 'from interpreter: ' + JSON.stringify(m)[..1000]
    if !/^(?:SupportedProtocols|UsingProtocol)=1$/.test m # ignore these
      switch (/^<(\w+)>/.exec m)?[1] or ''
        when 'ReplyConnect', 'ReplyNotAtInputPrompt', 'ReplyEdit', 'ReplySaveChanges', 'ReplySetLineAttributes' then ; # ignore
        when 'ReplyIdentify'      then toBrowser 'title', b64d getTag 'Project', m
        when 'ReplyUpdateWsid'
          s = b64d getTag 'wsid', m
          if s != (s1 = s.replace /\x00/g, '')
            log 'intepreter sent a wsid containing NUL characters, those will be ignored'
            s = s1
          toBrowser 'title', s
        when 'ReplyExecute'       then toBrowser 'add', b64d getTag 'result', m
        when 'ReplyEchoInput'     then toBrowser 'add', b64d(getTag 'input', m) + '\n'
        when 'ReplyGetLog'        then toBrowser 'set', b64d getTag 'Log', m
        when 'ReplyAtInputPrompt' then toBrowser 'prompt'
        when 'ReplyOpenWindow'
          bs = []; m.replace /<row>(\d+)<\/row><value>1<\/value>/g, (_, l) -> bs.push +l
          toBrowser 'open', b64d(getTag 'name', m), b64d(getTag 'text', m), +getTag('token', m), +getTag('bugger', m), bs
        when 'ReplyUpdateWindow'
          bs = []; m.replace /<row>(\d+)<\/row><value>1<\/value>/g, (_, l) -> bs.push +l
          toBrowser 'update', b64d(getTag 'name', m), b64d(getTag 'text', m), +getTag('token', m), +getTag('bugger', m), bs
        when 'ReplyFocusWindow'   then toBrowser 'focus', +getTag 'win', m
        when 'ReplyCloseWindow'   then toBrowser 'close', +getTag 'win', m
        when 'ReplyGetAutoComplete'
          o = b64d getTag 'options', m
          toBrowser 'autocomplete', +getTag('token', m), +getTag('skip', m), (if o then o.split '\n' else [])
        when 'ReplyHighlightLine' then toBrowser 'highlight', +getTag('win', m), +getTag 'line', m
        else log 'unrecognised'; toBrowser 'unrecognised', m
  return

rm = (a, x) -> i = a.indexOf x; (if i != -1 then a.splice i, 1); return

io.listen(server).on 'connection', (socket) ->
  log 'browser connected'
  sockets.push socket

  onevent = socket.onevent
  socket.onevent = (packet) ->
    log 'from browser: ' + JSON.stringify(packet.data)[..1000]
    onevent.apply socket, [packet]

  socket.on 'exec', (s, trace) -> cmd 'Execute', "<Text>#{b64 s}</Text><Trace>#{+!!trace}</Trace>"
  socket.on 'edit', (text, pos) -> cmd 'Edit', "<Text>#{b64 text}</Text><Pos>#{pos}</Pos><Win>0</Win>"
  socket.on 'save', (win, text, breakpoints) -> cmd 'SaveChanges', """
    <win>#{win}</win>
    <Text>#{b64 text}</Text>
    <attributes>
      <LineAttribute>
        <attribute>Stop</attribute>
        <values>
          #{
            (
              for i in [0...text.split('\n').length] by 1
                "<LineAttributeValue><row>#{i}</row><value>#{+(i in breakpoints)}</value></LineAttributeValue>"
            ).join '\n'
          }
        </values>
      </LineAttribute>
    </attributes>
  """
  socket.on 'close',          (win) -> cmd 'CloseWindow',         "<win>#{win}</win>"
  socket.on 'over',           (win) -> cmd 'DebugRunLine',        "<win>#{win}</win>"
  socket.on 'into',           (win) -> cmd 'DebugStepInto',       "<win>#{win}</win>"
  socket.on 'back',           (win) -> cmd 'DebugBackward',       "<win>#{win}</win>"
  socket.on 'skip',           (win) -> cmd 'DebugForward',        "<win>#{win}</win>"
  socket.on 'continueTrace',  (win) -> cmd 'DebugContinueTrace',  "<win>#{win}</win>"
  socket.on 'continueExec',   (win) -> cmd 'DebugContinue',       "<win>#{win}</win>"
  socket.on 'restartThreads', (win) -> cmd 'DebugRestartThreads', "<win>#{win}</win>"
  socket.on 'cutback',        (win) -> cmd 'DebugCutback',        "<win>#{win}</win>"
  socket.on 'interrupt', -> cmd 'WeakInterrupt'
  socket.on 'autocomplete', (line, pos, token) -> cmd 'GetAutoComplete', "<line>#{b64 line}</line><pos>#{pos}</pos><token>#{token}</token>"

  cmd 'Identify', '<Sender><Process>RIDE.EXE</Process><Proxy>0</Proxy></Sender>'
  cmd 'Connect', '<Token />'
  cmd 'GetWindowLayout', ''

  client.on 'end', -> log 'interpreter disconnected'; socket.emit 'end'; rm sockets, socket; return
  socket.on 'disconnect', -> log 'browser disconnected'; rm sockets, socket; return
