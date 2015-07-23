{IDE} = require './ide'
about = require './about'
prefs = require './prefs'

DEFAULT_PORT = prefs.favs.getDefault()[0].port; if typeof DEFAULT_PORT != 'number' then throw Error 'cannot determine DEFAULT_PORT'
fmtFav = (x) ->
  s = if !x.port? || +x.port == DEFAULT_PORT then x.host else if /:/.test x.host then "[#{x.host}]:#{x.port}" else "#{x.host}:#{x.port}"
  if x.name then "#{x.name} (#{s})" else s
storeFavs = ->
  prefs.favs $('#fav-list option').map(->
    x = parseFav $(@).text(); (if $(@).is ':selected' then x.sel = true); x
  ).toArray()
parseFav = (s) ->
  x = {}
  if m = /^(.*) \((.*)\)$/.exec s then [_, x.name, s] = m
  if m = /^\[(.*)\]:(.*)$/.exec s then [_, x.host, x.port] = m # IPv6 [host]:port
  else if /:.*:/.test s then x.host = s # IPv6 host without port
  else [x.host, x.port] = s.split ':' # IPv4 host:port or just host
  x.port = +(x.port or DEFAULT_PORT)
  x

proxyInfo = {} # the proxy sends information about itself when the front-end connects to it
ipAddresses = [] # of the proxy.  Used in the "Waiting for connections" dialog.

module.exports = (opts) ->
  document.title = 'RIDE - Connect'
  $('body').html """
    <fieldset id=connect-fieldset>
      <legend>Connect to an interpreter</legend>
      <div id=fav-buttons>
        <a id=about href=#>About</a>
        <a href=# id=fav-new accessKey=n><u>N</u>ew</a>
        <a href=# id=fav-delete>Delete</a>
      </div>
      <select multiple id=fav-list></select>
      <table id=fav-details>
        <tr>
          <td><u>A</u>ddress:</td>
          <td>
            <input accessKey=a id=fav-host class=text-field value=""> :
            <input id=fav-port class=text-field size=5 value=#{DEFAULT_PORT}>
          </td>
        </tr>
        <tr><td>Na<u>m</u>e:</td><td><input accessKey=m id=fav-name class=text-field></td></tr>
        <tr>
          <td></td>
          <td>
            <a href=# id=fav-connect accessKey=o>C<u>o</u>nnect</a>
            <a href=# id=fav-save    accessKey=s><u>S</u>ave</a>
            <a href=# id=fav-cancel  accessKey=c><u>C</u>ancel</a>
          </td>
        </tr>
      </table>
    </fieldset>
    <fieldset id=spawnSection>
      <legend>Spawn an interpreter</legend>
      <p>
        <a href=# id=spawn accessKey=w>Spa<u>w</u>n</a><br>
        <span id=spawn-status></span>
      </p>
    </fieldset>
    <fieldset>
      <legend>Listen for connections from interpreter </legend>
      <p>Address: <input id=listen-host class=text-field value="::"> :
         <input id=listen-port class=text-field value=#{DEFAULT_PORT} size=5>
      <p><a href=# id=listen accessKey=l><u>L</u>isten</a>
    </fieldset>
  """
  $connect     = $ '#fav-connect'  ; $host        = $ '#fav-host'
  $new         = $ '#fav-new'      ; $port        = $ '#fav-port'
  $delete      = $ '#fav-delete'   ; $name        = $ '#fav-name'
  $list        = $ '#fav-list'     ; $save        = $ '#fav-save'
  $spawn       = $ '#spawn'        ; $cancel      = $ '#fav-cancel'
  $spawnStatus = $ '#spawn-status' ; $listen      = $ '#listen'
  $about       = $ '#about'        ; $listenHost  = $ '#listen-host'; $listenPort  = $ '#listen-port'
  $listenDialog = $connectDialog = null

  enableSpawnAndListen = (b) ->
    $('#spawn, #listen').button if b then 'enable' else 'disable'
    $('#listen-host,#listen-port').attr 'disabled', !b
    return

  $connect.add($about).add($new).add($delete).add($save).add($cancel).add($spawn).add($listen).button()
  $list
    .on 'dblclick', 'option', (e) -> $connect.click(); false
    .keydown (e) ->
      if !e.shiftKey && !e.ctrlKey && !e.altKey
        switch CodeMirror.keyNames[e.which]
          when 'Enter'  then $connect.click(); false
          when 'Insert' then $new.click(); false
          when 'Delete' then $delete.click(); false
  $connect.click ->
    host = $host.val(); port = +$port.val()
    if !/^[a-z0-9\.\-:]+$/i.test host then $.alert 'Invalid host', 'Error', -> $host.focus(); return
    else if !(0 < port < 0xffff) then $.alert 'Invalid port', 'Error', -> $port.focus(); return
    else
      $connectDialog = $ '<div class=connect-dialog><div class=visual-distraction></div></div>'
        .dialog modal: 1, width: 350, title: 'Connecting...', buttons: Cancel: -> $(@).dialog 'close'; false
      D.socket.emit '*connect', {host, port}
    false
  $new.click ->
    $list.find('option').attr 'selected', false
    $list.append '<option selected>127.0.0.1</option>'
    $host.select(); storeFavs(); $list.change(); false
  $delete.click -> $list.find(':selected').remove(); storeFavs(); $list.change(); false
  $list.on 'change', -> # triggered after selection changes
    storeFavs(); $s = $list.find ':selected'; n = $s.length
    $name.add($host).add($port).attr 'disabled', n != 1
    $connect.add($save).add($cancel).button 'option', 'disabled', n != 1
    $delete.button 'option', 'disabled', !n
    $save.add($cancel).button 'disable'
    if n == 1 then x = parseFav $s.text(); $name.val x.name; $host.val x.host; $port.val x.port
    else $name.add($host).add($port).val ''
    return
  $host.add($port).add($name)
    .keydown (e) -> if e.which == 13 && !e.shiftKey && !e.ctrlKey && !e.altKey then $save.click(); false
    .on 'keyup change', ->
      s0 = $list.find(':selected').text(); s1 = fmtFav host: $host.val(), port: $port.val(), name: $name.val()
      $save.add($cancel).button if s0 == s1 then 'disable' else 'enable'
      return
  $save.click ->
    $list.focus().find(':selected').text fmtFav host: $host.val(), port: $port.val(), name: $name.val(); storeFavs()
    $save.add($cancel).button 'disable'; false
  $cancel.click ->
    x = parseFav $list.find(':selected').text(); $host.val x.host; $port.val x.port; $name.val x.name
    $save.add($cancel).button 'disable'; false
  $spawn.click -> enableSpawnAndListen false; $spawnStatus.text 'Spawning...'; D.socket.emit '*spawn'; false
  $listen.click ->
    host = $listenHost.val()
    port = +$listenPort.val()
    if !(0 < port < 0x10000)
      $.alert 'Invalid port', 'Error', -> $listenPort.focus(); return false
    else
      D.socket.emit '*listen', {host, port}
      $listenDialog = $ """
        <div class=listen>
          <div class=visual-distraction></div>
          Please start the remote interpreter with<br>
          #{
            (
              for host in (if proxyInfo.ipAddresses?.length then proxyInfo.ipAddresses else ['host'])
                "<div class=tt>RIDE_INIT='CONNECT:#{host}:#{port}'</div>"
            ).join 'or'
          }
          in its environment, so it connects here.
        </div>
      """
        .dialog
          modal: 1, width: 450, title: 'Waiting for connection...'
          close: -> D.socket.emit '*listenCancel'; return
          buttons: Cancel: -> $(@).dialog 'close'; false
    false
  $list.sortable cursor: 'move', revert: true, tolerance: 'pointer', containment: 'parent', axis: 'y', update: storeFavs
  $about.click -> about.showDialog(); false

  $list.html prefs.favs().map((x) -> "<option '#{if x.sel then 'selected' else ''}>#{fmtFav x}</option>").join ''
  if !$list.find(':selected').length then $list.focus().find('option').eq(0).attr 'selected', true; $list.change()

  D.socket
    .on '*proxyInfo', (x) -> proxyInfo = x; return
    .on '*confirmHijack', ({addr}) ->
      $("<p>#{addr || 'An IDE '} is already using this proxy.  Would you like to take it over?</p>").dialog
        title: 'Confirmation', modal: 1, buttons: [
          {text: 'Yes', click: -> D.socket.emit '*hijack'; $(@).dialog 'close'; false}
          {text: 'No', click: -> $(@).dialog 'close'; $('body').html '<p>Disconnected</p>'; false}
        ]
      return
    .on '*hijacked', ({addr}) -> $.alert "#{addr} has taken over usage of this proxy.", 'Disconnected'; return
    .on '*connected', ({host, port}) ->
      if $listenDialog  then $listenDialog.dialog  'close'; $listenDialog  = null
      if $connectDialog then $connectDialog.dialog 'close'; $connectDialog = null
      ide = new IDE; ide.setHostAndPort host, port; return
    .on '*connectError', ({err}) ->
      if $connectDialog then $connectDialog.dialog 'close'; $connectDialog = null
      $.alert err, 'Error'; return
    .on '*spawned', ({pid}) -> $spawnStatus.text "PID: #{pid}"; enableSpawnAndListen false; return
    .on '*spawnedError', ({message}) -> $spawnStatus.text message; enableSpawnAndListen true; return
    .on '*spawnedExited', ({code, signal}) ->
      $spawnStatus.text(if code? then "exited with code #{code}" else "received #{signal}")
      enableSpawnAndListen true; return
    .on '*listenError', ({err}) ->
      if $listenDialog then $listenDialog.dialog 'close'; $listenDialog = null
      $.alert err, 'Error'; enableSpawnAndListen true; return

  $('#fav-list').resizable handles: 's,e'

  listen: (port) -> $listenHost.val '::'; port && $listenPort.val port; $listen.click(); return
  connect: (s) -> hp = parseFav s; D.socket.emit '*connect', host: hp.host, port: hp.port or DEFAULT_PORT; return
