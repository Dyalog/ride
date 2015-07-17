fs = require 'fs'
net = require 'net'
os = require 'os'
path = require 'path'
{spawn} = require 'child_process'

log = @log = do ->
  t0 = +new Date # log timestamps will be number of milliseconds since t0
  N = 500; T = 1000 # log no more than N log messages per T milliseconds
  n = t = 0 # at any moment, there have been n messages since time t
  (s) -> # the actual log() function
    if (t1 = +new Date) - t > T then t = t1; n = 1 # if last message was too long ago, start counting afresh
    m = if ++n < N then "#{t1 - t0}: #{s}\n" else if n == N then '... logging temporarily suppressed\n'
    if m then process.stdout?.write? m; for l in log.listeners[..] then l m
    return

log.listeners = []

do -> # If $DYALOG_IDE_LOG is present, log to stdout and to a file, otherwise only to stdout.
  if f = process.env.DYALOG_IDE_LOG
    if h = process.env.HOME || process.env.USERPROFILE then f = path.resolve h, f
    fd = fs.openSync f, 'a'
    log.listeners.push (s) -> b = Buffer m; fs.writeSync fd, b, 0, b.length; return
  return

do -> # store latest log messages in RAM
  if window? # are we running under NW.js as opposed to just NodeJS?
    i = 0; a = Array 1000
    log.get = -> a[i..].concat a[...i]
    log.listeners.push (s) -> a[i++] = s; i %= a.length; return
  return

log new Date().toISOString()

b64 = (s) -> Buffer(s).toString 'base64'
b64d = (s) -> '' + Buffer s, 'base64'
tag = (tagName, xml) -> (///^[^]*<#{tagName}>([^<]*)</#{tagName}>[^]*$///.exec xml)?[1]
extend = (a...) -> r = {}; (for x in a then for k, v of x then r[k] = v); r
addr = (socket) -> socket?.request?.connection?.remoteAddress || 'IDE' # format a socket's remote address

ipAddresses = []
try
  for iface, addrs of os.networkInterfaces()
    for a in addrs when a.family == 'IPv4' && !a.internal
      ipAddresses.push a.address
catch e then log 'cannot determine ip addresses: ' + e

# Constants for entityType:
#                         protocol
#                          v1  v2
#   DefinedFunction    =    1   1
#   SimpleCharArray    =    2   2
#   SimpleNumericArray =    4   3
#   MixedSimpleArray   =    8   4
#   NestedArray        =   16   5
#   QuadORObject       =   32   6
#   NativeFile         =   64   7
#   SimpleCharVector   =  128   8
#   AplNamespace       =  256   9
#   AplClass           =  512  10
#   AplInterface       = 1024  11
#   AplSession         = 2048  12
#   ExternalFunction   = 4096  13
entityTypeTranslation = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096]

parseEditableEntity = (xml) -> # used for OpenWindow and UpdateWindow
  # v1 sample message:
  # <ReplyUpdateWindow>\n<entity><name>bnM=</name><text>Ok5hbWVzcGFjZSBucwogICAg4oiHIGYKICAgICAgMQogICAg4oiHCiAgICDiiIcgZwogICAgICAyCiAgICDiiIcKOkVuZE5hbWVzcGFjZQ==</text><cur_pos>4</cur_pos><token>1</token><bugger>0</bugger><sub_offset>0</sub_offset><sub_size>0</sub_size><type>256</type><ReadOnly>0</ReadOnly><tid>0</tid><tid_name>MA==</tid_name><colours>ra2tra2tra2trQMHBwADAwMDtAMVAAMDAwMDAwUAAwMDA7QAAwMDA7QDFQADAwMDAwMFAAMDAwO0AK6urq6urq6urq6urq4A</colours><attributes>\n</attributes></entity>\n</ReplyUpdateWindow>
  # v2 spec from http://wiki.dyalog.bramley/index.php/Ride_protocol_messages_V2#Extended_types
  #   EditableEntity => [string name, string text, int token,
  #                      byte[] colours, int currentRow, int currentColumn,
  #                      int subOffset, int subSize, bool debugger,
  #                      int tid, bool readonly, string tidName,
  #                      entityType type, lineAttributes attributes]
  #   lineAttributes => lineAttribute[int[] stop, int[] monitor, int[] trace]
  bs = []; xml.replace /<row>(\d+)<\/row><value>1<\/value>/g, (_, l) -> bs.push +l
  token: +tag 'token', xml
  name: b64d tag 'name', xml
  currentRow: +tag('cur_pos', xml) || 0
  debugger: +tag 'bugger', xml
  readOnly: !!+tag 'readonly', xml
  entityType: 1 + entityTypeTranslation.indexOf +tag 'type', xml
  lineAttributes: stop: bs
  text: b64d tag 'text', xml

WHIES = 'Invalid Descalc QuadInput LineEditor QuoteQuadInput Prompt'.split ' ' # constants used for ReplyAtInputPrompt

fmtLineAttributes = (nLines, stops) ->
  v = for i in [0...nLines] by 1 then "<LineAttributeValue><row>#{i}</row><value>#{+(i in (stops or []))}</value></LineAttributeValue>"
  "<attributes><LineAttribute><attribute>Stop</attribute><values>#{v.join '\n'}</values></LineAttribute></attributes>"

trunc = (s) -> if s.length > 1000 then s[...997] + '...' else s

@Proxy = ->
  client = null # TCP connection to interpreter
  socket = null # socket.io connection to the browser that's currently driving
  child  = null # a ChildProcess object, the result from spawn()
  server = null # used to listen for connections from interpreters

  # This is a hack to avoid flicker when leaning on TC.
  # The interpreter sends an extra ReplyFocusWindow with win=0 (the session) after a StepInto or RunCurrentLine.
  # TODO: Remove it once there's a fix in the interpreter.
  ignoreNextAttemptsToFocusSession = 0

  toInterpreter = (s) ->
    if client
      log 'to interpreter: ' + trunc JSON.stringify s
      b = Buffer s.length + 8; b.writeInt32BE b.length, 0; b.write 'RIDE' + s, 4; client.write b
    return

  cmd = (c, args = '') -> toInterpreter "<Command><cmd>#{c}</cmd><id>0</id><args><#{c}>#{args}</#{c}></args></Command>"; return

  toBrowser = (m...) -> log 'to browser: ' + trunc JSON.stringify m; socket?.emit m...; return

  setUpInterpreterConnection = ->
    client.on 'error', (e) -> toBrowser '*connectError', err: '' + e; client = null; return
    client.on 'end', -> toBrowser '*disconnected'; client = null; return
    queue = Buffer 0 # a buffer for data received from the server
    client.on 'data', (data) ->
      queue = Buffer.concat [queue, data]
      while queue.length >= 4 and (n = queue.readInt32BE 0) <= queue.length
        m = '' + queue[8...n]; queue = queue[n..]
        log 'from interpreter: ' + trunc JSON.stringify m
        if !/^(?:SupportedProtocols|UsingProtocol)=1$/.test m # ignore these
          switch (/^<(\w+)>/.exec m)?[1] or ''
            when 'ReplyConnect', 'ReplyEdit', 'ReplySetLineAttributes', 'ReplyWeakInterrupt', 'ReplyStrongInterrupt', 'ReplyUnknownRIDECommand' then ; # ignore
            when 'ReplySaveChanges'       then toBrowser 'ReplySaveChanges', win: +tag('win', m), err: +tag 'err', m
            when 'ReplyWindowTypeChanged'
              win = +tag 'Win', m
              if win
                toBrowser 'WindowTypeChanged', win: +tag('Win', m), tracer: !!+tag 'bugger', m
              else
                log "WARNING: ignoring ReplyWindowTypeChanged message with win=#{win}"
            when 'ReplyIdentify'
              toBrowser 'UpdateDisplayName', displayName: b64d tag 'Project', m
              toBrowser '*identify',
                version:  tag 'Version',      m
                platform: tag 'Platform',     m
                arch:     tag 'Architecture', m
                pid:      tag 'pid',          m
                date:     tag 'BuildDate',    m
            when 'ReplyUpdateWsid'
              s = b64d tag 'wsid', m
              if s != (s1 = s.replace /\x00/g, '')
                log 'intepreter sent a wsid containing NUL characters, those will be ignored'
                s = s1
              toBrowser 'UpdateDisplayName', displayName: s
            when 'ReplyExecute'       then toBrowser 'AppendSessionOutput', result: b64d tag 'result', m
            when 'ReplyHadError'      then toBrowser 'HadError'
            when 'ReplyEchoInput'     then toBrowser 'EchoInput', input: b64d(tag 'input', m) + '\n'
            when 'ReplyGetLog'        then toBrowser 'AppendSessionOutput', result: b64d tag 'Log', m
            when 'ReplyNotAtInputPrompt' then toBrowser 'NotAtInputPrompt'
            when 'ReplyAtInputPrompt' then toBrowser 'AtInputPrompt', why: WHIES.indexOf tag 'why', m
            when 'ReplyOpenWindow'    then toBrowser 'OpenWindow',   parseEditableEntity m
            when 'ReplyUpdateWindow'  then toBrowser 'UpdateWindow', parseEditableEntity m
            when 'ReplyFocusWindow'
              win = +tag 'win', m
              if !win && ignoreNextAttemptsToFocusSession && !process.env.DYALOG_IDE_DISABLE_FOCUS_WORKAROUND
                ignoreNextAttemptsToFocusSession--
              else
                toBrowser 'FocusWindow', {win}
            when 'ReplyCloseWindow'   then toBrowser 'CloseWindow', win: +tag 'win', m
            when 'ReplyGetAutoComplete'
              o = b64d tag 'options', m
              toBrowser 'autocomplete', +tag('token', m), +tag('skip', m), (if o then o.split '\n' else [])
            when 'ReplyHighlightLine' then toBrowser 'highlight', +tag('win', m), +tag 'line', m
            when 'ReplyDisconnect'    then toBrowser 'Disconnect', message: b64d tag 'msg', m
            when 'ReplySysError'      then toBrowser 'SysError', text: b64d tag 'text', m
            when 'ReplyInternalError' then toBrowser 'InternalError', error: +tag('error', m), dmx: +tag('dmx', m), message: tag 'msg', m
            when 'ReplyNotificationMessage' then toBrowser 'NotificationMessage', message: tag 'msg', m
            when 'ReplyShowHTML'      then toBrowser 'ShowHTML', title: b64d(tag 'title', m), html: b64d(tag 'html', m)
            else log 'unrecognised'; toBrowser 'unrecognised', m
      return
    # Initial batch of commands sent to interpreter:
    toInterpreter 'SupportedProtocols=1'
    toInterpreter 'UsingProtocol=1'
    cmd 'Identify', '<Sender><Process>RIDE.EXE</Process><Proxy>0</Proxy></Sender>'
    cmd 'Connect', '<Token />'
    cmd 'GetWindowLayout', ''
    return

  setUpBrowserConnection = ->
    {onevent} = socket # intercept all browser-to-proxy events and log them:
    socket.onevent = (packet) -> log 'from browser: ' + trunc JSON.stringify packet.data; onevent.apply socket, [packet]
    socket
      .on 'Execute', ({text, trace}) -> cmd 'Execute', "<Text>#{b64 text}</Text><Trace>#{+!!trace}</Trace>"
      .on 'Edit', ({win, pos, text}) -> cmd 'Edit', "<Text>#{b64 text}</Text><Pos>#{pos}</Pos><Win>#{win}</Win>"
      .on 'CloseWindow',    ({win}) -> cmd 'CloseWindow',         "<win>#{win}</win>"
      .on 'RunCurrentLine', ({win}) -> cmd 'DebugRunLine',        "<win>#{win}</win>"; ignoreNextAttemptsToFocusSession++; return
      .on 'StepInto',       ({win}) -> cmd 'DebugStepInto',       "<win>#{win}</win>"; ignoreNextAttemptsToFocusSession++; return
      .on 'TraceBackward',  ({win}) -> cmd 'DebugBackward',       "<win>#{win}</win>"
      .on 'TraceForward',   ({win}) -> cmd 'DebugForward',        "<win>#{win}</win>"
      .on 'ContinueTrace',  ({win}) -> cmd 'DebugContinueTrace',  "<win>#{win}</win>"
      .on 'Continue',       ({win}) -> cmd 'DebugContinue',       "<win>#{win}</win>"
      .on 'RestartThreads', ({win}) -> cmd 'DebugRestartThreads', "<win>#{win}</win>"
      .on 'Cutback',        ({win}) -> cmd 'DebugCutback',        "<win>#{win}</win>"
      .on 'WeakInterrupt',   -> cmd 'WeakInterrupt'
      .on 'StrongInterrupt', -> cmd 'StrongInterrupt'
      .on 'Autocomplete', ({line, pos, token}) -> cmd 'GetAutoComplete', "<line>#{b64 line}</line><pos>#{pos}</pos><token>#{token}</token>"
      .on 'SaveChanges', ({win, text, attributes: {stop, monitor, trace}}) ->
        cmd 'SaveChanges', "<win>#{win}</win><Text>#{b64 text}</Text>#{fmtLineAttributes text.split('\n').length, stop}"; return
      .on 'SetLineAttributes', ({win, nLines, lineAttributes: {stop, monitor, trace}}) ->
        cmd 'SetLineAttributes', "<win>#{win}</win>#{fmtLineAttributes nLines, stop}"; return
      .on 'Exit', ({code}) -> cmd 'Exit', "<code>#{code}</code>"

      # "disconnect" is a built-in socket.io event
      .on 'disconnect', (x) -> log "#{addr @} disconnected"; (if socket == @ then socket = null); return

      # proxy management events that don't reach the interpreter start with a '*'
      .on '*connect', ({host, port}) ->
        client = net.connect {host, port}, -> toBrowser '*connected', {host, port}; return
        setUpInterpreterConnection()
        return
      .on '*spawn', ->
        server = net.createServer (c) ->
          log 'spawned interpreter connected'; a = server.address(); server?.close(); server = null; client = c
          toBrowser '*connected', {host: a.address, port: a.port}; setUpInterpreterConnection(); return
        server.on 'error', (err) ->
          log 'cannot listen for connections from spawned interpreter: ' + err
          server = client = null; toBrowser '*listenError', err: '' + err; return
        server.listen 0, '127.0.0.1', -> # pick a random free port
          a = server.address(); hp = "#{a.address}:#{a.port}"
          log "listening for connections from spawned interpreter on #{hp}"
          exe = process.env.DYALOG_IDE_INTERPRETER_EXE || 'dyalog'
          log "spawning interpreter #{JSON.stringify exe}"
          args = ['+s', '-q']; stdio = ['pipe', 'ignore', 'ignore']
          if /^win/i.test process.platform then args = []; stdio[0] = 'ignore'
          child = spawn exe, args, stdio: stdio, env: extend process.env,
            RIDE_INIT: "CONNECT:#{hp}", RIDE_SPAWNED: '1'
          toBrowser '*spawned', pid: child.pid
          child.on 'error', (err) ->
            server?.close(); server = client = null
            toBrowser '*spawnedError', code: err.code, message:
              if err.code == 'ENOENT' then 'Cannot find dyalog executable on $PATH' else '' + err
            child = null; return
          child.on 'exit', (code, signal) ->
            server?.close(); server = client = null; toBrowser '*spawnedExited', {code, signal}; child = null; return
          return
        return
      .on '*listen', listen = ({port, callback}) ->
        server = net.createServer (c) ->
          host = c?.request?.connection?.remoteAddress; log 'interpreter connected from ' + host
          server?.close(); server = null; client = c; toBrowser '*connected', {host, port}; setUpInterpreterConnection()
          return
        server.on 'error', (err) -> server = null; toBrowser '*listenError', err: '' + err; return
        server.listen port, -> log "listening for connections from interpreter on port #{port}"; callback?(); return
        return
      .on '*listenCancel', -> server?.close(); return
    if child then toBrowser '*spawned', pid: child.pid
    toBrowser '*proxyInfo', {ipAddresses, platform: process.platform}
    return

  (newSocket) -> # this function is the result from calling Proxy()
    log "#{addr newSocket} connected"
    if socket
      log "asking #{addr newSocket} to confirm hijacking of #{addr socket}'s session"
      newSocket.emit '*confirmHijack', addr: addr(socket) || null
      newSocket.on '*hijack', ->
        log "#{addr newSocket} hijacked #{addr socket}'s session"
        socket.emit '*hijacked', addr: addr(newSocket); socket.disconnect(); socket = newSocket; setUpBrowserConnection()
        return
    else
      socket = newSocket; setUpBrowserConnection()
    return
