$ ->
  DEFAULT_PORT = 4502
  localStorage.favs ?= JSON.stringify [host: '127.0.0.1', port: DEFAULT_PORT]
  fmtFav = (x) ->
    s = if !x.port? || +x.port == DEFAULT_PORT then x.host else if /:/.test x.host then "[#{x.host}]:#{x.port}" else "#{x.host}:#{x.port}"
    if x.name then "#{x.name} (#{s})" else s
  storeFavs = ->
    localStorage.favs = JSON.stringify $('#fav-list option').map(->
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
  ipAddresses = [] # of the proxy.  Used in the "Waiting for connections" dialogue.

  D.connectPage = ->
    if (u = D.urlParams).host?
      D.socket.emit '*connect', host: u.host, port: +(u.port or DEFAULT_PORT)
      D.idePage()
      return
    $('body').html """
      <fieldset>
        <legend>Connect to an interpreter</legend>
        <div id="fav-buttons">
          <a href="#" id="fav-connect" accessKey="o">C<u>o</u>nnect</a>
          <a href="#" id="fav-new" accessKey="n"><u>N</u>ew</a>
          <a href="#" id="fav-delete">Delete</a>
        </div>
        <select multiple id="fav-list"></select>
        <table>
          <tr>
            <td><u>A</u>ddress:</td>
            <td>
              <input accessKey="a" id="fav-host" class="text-field" value=""> :
              <input id="fav-port" class="text-field" size="5" value="#{DEFAULT_PORT}">
            </td>
          </tr>
          <tr><td>Na<u>m</u>e:</td><td><input accessKey="m" id="fav-name" class="text-field"></td></tr>
          <tr>
            <td></td>
            <td>
              <a href="#" id="fav-save" accessKey="s"><u>S</u>ave</a>
              <a href="#" id="fav-cancel" accessKey="c"><u>C</u>ancel</a>
            </td>
          </tr>
        </table>
      </fieldset>
      <fieldset id="spawnSection" style="display:none">
        <legend>Spawn an interpreter</legend>
        <p><i>Requires a <tt>dyalog</tt> executable on your <tt>$PATH</tt>.</i></p>
        <p>
          <label>Port <input id="spawn-port" class="text-field" value="#{DEFAULT_PORT}" size="5"></label>
          <a href="#" id="spawn" accessKey="w">Spa<u>w</u>n</a><br>
          <label>Connect on spawn <input type="checkbox" id="spawn-connect" checked></label>
          <span id="spawn-status"></span>
        </p>
      </fieldset>
      <fieldset>
        <legend>Listen for connections from interpreter </legend>
        <p>
          <label>Port <input id="listen-port" class="text-field" value="#{DEFAULT_PORT}" size="5"></label>
          <a href="#" id="listen" accessKey="l"><u>L</u>isten</a>
        </p>
      </fieldset>
    """
    $connect     = $ '#fav-connect'  ; $host        = $ '#fav-host'
    $new         = $ '#fav-new'      ; $port        = $ '#fav-port'
    $delete      = $ '#fav-delete'   ; $name        = $ '#fav-name'
    $list        = $ '#fav-list'     ; $save        = $ '#fav-save'
    $spawn       = $ '#spawn'        ; $cancel      = $ '#fav-cancel'
    $spawnPort   = $ '#spawn-port'   ; $listen      = $ '#listen'
    $spawnStatus = $ '#spawn-status' ; $listenPort  = $ '#listen-port'
    $spawnConn   = $ '#spawn-connect'
    $listenDialog = null

    $connect.add($new).add($delete).add($save).add($cancel).add($spawn).add($listen).button()
    $list
      .on 'dblclick', 'option', (e) -> $connect.click(); false
      .on 'keydown', null, 'return', -> $connect.click(); false
      .on 'keydown', null, 'insert', -> $new.click(); false
      .on 'keydown', null, 'del', -> $delete.click(); false
    $connect.click ->
      x = parseFav $list.find(':selected').text()
      if !x.host then return
      if !/^[a-z0-9\.\-:]+$/i.test x.host then $.alert 'Invalid host', 'Error', -> $host.focus()
      if !/^\d{1,5}$/.test(x.port) || +x.port > 0xffff then $.alert 'Invalid port', 'Error', -> $port.focus()
      x.port = +x.port
      if x.port == DEFAULT_PORT then delete x.port
      if !x.name then delete x.name
      D.socket.emit '*connect', host: x.host, port: x.port or DEFAULT_PORT
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
      .on 'keydown', null, 'return', -> $save.click(); false
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
    $spawn.click ->
      port = +$spawnPort.val()
      if !(0 < port < 0x10000)
        $.alert 'Invalid port', 'Error', -> $spawnPort.focus(); return
      else
        $spawnStatus.text 'Spawning...'; $spawn.button 'disable'; $spawnPort.attr 'disabled', true
        D.socket.emit '*spawn', {port}
        if $spawnConn.is ':checked'
          setTimeout (-> D.socket.emit '*connect', {host: '127.0.0.1', port}), 1000
      false
    $spawnPort.on 'keydown', null, 'return', -> $spawn.click(); false
    $listen.click ->
      port = +$listenPort.val()
      if !(0 < port < 0x10000)
        $.alert 'Invalid port', 'Error', -> $listenPort.focus(); return false
      else
        D.socket.emit '*listen', {port}
        $listenDialog = $ """
          <div class='listen'>
            <div class="visual-distraction"></div>
            Please start the remote interpreter with<br>
            #{
              (
                for host in (if proxyInfo.ipAddresses?.length then proxyInfo.ipAddresses else ['host'])
                  "<div class='tt'>RIDE_CONNECT=#{host}:#{port}</div>"
              ).join 'or'
            }
            in its environment, so it connects here.
          </div>
        """
          .dialog
            modal: 1, width: 400, title: 'Waiting for connection...'
            close: -> D.socket.emit '*listenCancel'; return
            buttons: Cancel: -> $(@).dialog 'close'; false
      false
    $listenPort.on 'keydown', null, 'return', -> $listen.click(); false
    $list.sortable cursor: 'move', revert: true, tolerance: 'pointer', containment: 'parent', axis: 'y', update: storeFavs

    favs = try JSON.parse localStorage.favs catch then []
    $list.html favs.map((x) -> "<option '#{if x.sel then 'selected' else ''}>#{fmtFav x}</option>").join ''
    if !$list.find(':selected').length then $list.focus().find('option').eq(0).attr 'selected', true; $list.change()

    D.socket
      .on '*proxyInfo', (x) -> proxyInfo = x; $('#spawnSection').toggle !/^win/i.test x.platform; return
      .on '*confirmHijack', ({addr}) ->
        $("<p>#{addr || 'An IDE '} is already using this proxy.  Would you like to take it over?</p>").dialog
          title: 'Confirmation', modal: 1, buttons: [
            {text: 'Yes', click: -> D.socket.emit '*hijack'; $(@).dialog 'close'; false}
            {text: 'No', click: -> $(@).dialog 'close'; $('body').html '<p>Disconnected</p>'; false}
          ]
        return
      .on '*hijacked', ({addr}) -> $.alert "#{addr} has taken over usage of this proxy.", 'Disconnected'; return
      .on '*connected', -> $listenDialog?.dialog 'close'; D.idePage(); return
      .on '*disconnected', -> $.alert 'Interpreter disconnected'; return
      .on '*connectError', ({err}) -> $.alert err, 'Error'; return
      .on '*spawned', ({pid}) ->
        $spawnStatus.text "PID: #{pid}"
        $spawnPort.attr 'disabled', true; $spawn.button 'disable'; return
      .on '*spawnedError', ({message, code}) ->
        $spawnStatus.text if code == 'ENOENT' then 'Cannot find dyalog executable on $PATH' else message
        $('#spawn').button 'enable' # use selector instead of $spawn to prevent errors in $().button() plugin
        $spawnPort.attr 'disabled', false; return
      .on '*spawnedExited', ({code, signal}) ->
        $spawnStatus.text(if code? then "exited with code #{code}" else "received #{signal}")
        $('#spawn').button 'enable' # use selector instead of $spawn to prevent errors in $().button() plugin
        $spawnPort.attr 'disabled', false; return
      .on '*listenError', ({err}) -> $listenDialog?.dialog 'close'; $.alert err, 'Error'; return
    return
  return
