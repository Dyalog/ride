$ ->
  DEFAULT_PORT = 4502
  localStorage.favs ?= JSON.stringify [host: '127.0.0.1', port: DEFAULT_PORT]
  fmtFav = (x) ->
    s = if !x.port? || +x.port == DEFAULT_PORT then x.host else if /:/.test x.host then "[#{x.host}]:#{x.port}" else "#{x.host}:#{x.port}"
    if x.name then "#{x.name} (#{s})" else s
  storeFavs = ->
    localStorage.favs = JSON.stringify $('.fav').map(->
      x = parseFav $(@).text(); (if $(@).is '.sel' then x.sel = true); x
    ).toArray()
  parseFav = (s) ->
    x = {}
    if m = /^(.*) \((.*)\)$/.exec s then [_, x.name, s] = m
    if m = /^\[(.*)\]:(.*)$/.exec s then [_, x.host, x.port] = m # IPv6 [host]:port
    else if /:.*:/.test s then x.host = s # IPv6 host without port
    else [x.host, x.port] = s.split ':' # IPv4 host:port or just host
    x.port = +(x.port or DEFAULT_PORT)
    x

  Dyalog.connectPage = ->
    if (u = Dyalog.urlParams).host?
      Dyalog.socket.emit '*connect', host: u.host, port: +(u.port or DEFAULT_PORT)
      Dyalog.idePage()
      return
    $('body').html """
      <fieldset>
        <legend>Connect to an interpreter</legend>
        <div id="fav-buttons">
          <a href="#" id="fav-connect" accessKey="o">C<u>o</u>nnect</a>
          <a href="#" id="fav-new" accessKey="n"><u>N</u>ew</a>
          <a href="#" id="fav-delete">Delete</a>
        </div>
        <div id="fav-list"></div>
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
      <fieldset>
        <legend>Spawn an interpreter</legend>
        <p>
          <label>Port <input id="spawn-port" class="text-field" value="#{DEFAULT_PORT}" size="5"></label>
          <a href="#" id="spawn" accessKey="w">Spa<u>w</u>n</a>
          <span id="spawn-status"></span>
        </p>
      </fieldset>
      <fieldset>
        <legend>Listen for connections from interpreter (not yet implemented)</legend>
        <p>
          <label>Port <input disabled id="listen-port" class="text-field" value="#{DEFAULT_PORT}" size="5"></label>
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

    $connect.add($new).add($delete).add($save).add($cancel).add($spawn).add($listen).button()
    $listen.button 'disable'
    $list
      .on 'click', '.fav', -> false
      .on 'dblclick', '.fav', (e) -> $connect.click(); false
      .on 'mousedown', '.fav', (e) ->
        if e.ctrlKey
          $(@).toggleClass 'sel'
        else if e.shiftKey
          if (i = $('.fav:focus').index()) >= 0
            j = $(@).focus().index(); if i > j then h = i; i = j; j = h
            $('.fav').removeClass('sel').slice(i, j + 1).addClass 'sel'; $list.trigger 'sel'
        else
          $('.fav').removeClass 'sel'; $(@).addClass 'sel'
        $(@).focus()
        $list.trigger 'sel'
        return
      .on 'keydown', '.fav', 'ctrl+a', -> $('.fav').addClass 'sel'; $list.trigger 'sel'; false
      .on 'keydown', '.fav', 'space ctrl+space', -> $(@).toggleClass 'sel'; $list.trigger 'sel'; false
      .on 'keydown', '.fav', 'return', -> $connect.click(); false
      .on 'keydown', '.fav', 'insert', -> $new.click(); false
      .on 'keydown', '.fav', 'del', -> $delete.click(); false
      .on 'keydown', '.fav', (e) ->
        $t = $ @
        if e.which in [38, 40, 36, 35, 33, 34] # <Up><Down><Home><End><PgUp><PgDown> <C-...> <S-...> <A-...>
          switch e.which
            when 38 then $x = $t.prev()         # <Up>
            when 40 then $x = $t.next()         # <Down>
            when 36 then $x = $('.fav').first() # <Home>
            when 35 then $x = $('.fav').last()  # <End>
            when 33 then $x = $('.fav').eq Math.max 0, $t.index() - Math.floor $list.height() / $t.height() # <PgUp>
            when 34 then $x = $('.fav').eq Math.max $('.fav').length - 1, $t.index() - Math.floor $list.height() / $t.height() # <PgDown>
          if $x.length
            if e.shiftKey
              i = $t.index(); j = $x.index(); if i > j then h = i; i = j; j = h
              $('.fav').slice(i, j + 1).addClass 'sel'; $x.focus(); $list.trigger 'sel'
            else if e.ctrlKey then $x.focus()
            else if e.altKey
              if e.which in [38, 36, 33] then $t.insertBefore $x else $t.insertAfter $x # <Up> <Home> <PgUp>: before, otherwise: after
              $('.fav').removeClass 'sel'; $t.focus().addClass 'sel'; $list.trigger 'sel'
            else
              $('.fav').removeClass 'sel'; $x.focus().addClass 'sel'; $list.trigger 'sel'
          false
    $connect.click ->
      x = parseFav $('.fav.sel').text()
      if !x.host then return
      if !/^[a-z0-9\.\-:]+$/i.test x.host then $.alert 'Invalid host', 'Error', -> $host.focus()
      if !/^\d{1,5}$/.test(x.port) || +x.port > 0xffff then $.alert 'Invalid port', 'Error', -> $port.focus()
      x.port = +x.port
      if x.port == DEFAULT_PORT then delete x.port
      if !x.name then delete x.name
      Dyalog.socket.emit '*connect', host: x.host, port: x.port or DEFAULT_PORT
      false
    $new.click ->
      $('.fav').removeClass 'sel'
      $list.append('<a class="fav sel" href="#">127.0.0.1</a>').trigger 'sel'
      $('.fav.sel').focus(); $host.select(); storeFavs(); false
    $delete.click -> $('.fav.sel').remove(); $list.trigger 'sel'; storeFavs(); false
    $list.on 'sel', -> # triggered after selection changes
      storeFavs(); $s = $ '.fav.sel'; n = $s.length
      $name.add($host).add($port).attr 'disabled', n != 1
      $connect.add($save).add($cancel).button 'option', 'disabled', n != 1
      $delete.button 'option', 'disabled', !n
      $save.add($cancel).button if n == 1 then 'enable' else 'disable'
      if n == 1 then x = parseFav $s.text(); $name.val x.name; $host.val x.host; $port.val x.port
      else $name.add($host).add($port).val ''
      return
    $host.add($port).add($name)
      .on 'keydown', null, 'return', -> $save.click(); false
      .on 'keyup change', ->
        s0 = $('.fav.sel').text(); s1 = fmtFav host: $host.val(), port: $port.val(), name: $name.val()
        $save.add($cancel).button if s0 == s1 then 'disable' else 'enable'
        return
    $save.click ->
      $('.fav.sel').focus().text fmtFav host: $host.val(), port: $port.val(), name: $name.val(); storeFavs()
      $save.add($cancel).button 'disable'; false
    $cancel.click ->
      x = parseFav $('.fav.sel').text(); $host.val x.host; $port.val x.port; $name.val x.name
      $save.add($cancel).button 'disable'; false
    $spawn.click ->
      port = +$spawnPort.val()
      if 0 < port < 0x10000
        $spawnStatus.text 'Spawning...'; $spawn.button 'disable'; $spawnPort.attr 'disabled', true
        Dyalog.socket.emit '*spawn', {port}
      else
        $spawnStatus.text 'Invalid port'; $spawnPort.focus()
      false
    $spawnPort.on 'keydown', null, 'return', -> $spawn.click(); false
    $listen.click -> $.alert 'Not yet implemented'
    $listenPort.on 'keydown', null, 'return', -> $listen.click(); false
    $list.sortable cursor: 'move', revert: true, tolerance: 'pointer', containment: 'parent', axis: 'y', update: storeFavs

    favs = try JSON.parse localStorage.favs catch then []
    $list.html favs.map((x) -> "<a href='#' class='#{if x.sel then 'sel ' else ''}fav'>#{fmtFav x}</a>").join ''
    if $('.fav.sel').length then $('.fav.sel').eq(0).focus() else $('.fav').eq(0).focus().addClass 'sel'
    $list.trigger 'sel'

    Dyalog.socket
      .on '*confirmHijack', ({addr}) ->
        $("<p>#{addr || 'An IDE '} is already using this proxy.  Would you like to take it over?</p>").dialog
          title: 'Confirmation', modal: 1, buttons: [
            {text: 'Yes', click: -> Dyalog.socket.emit '*hijack'; $(@).dialog 'close'; false}
            {text: 'No', click: -> $(@).dialog 'close'; $('body').html '<p>Disconnected</p>'; false}
          ]
        return
      .on '*hijacked', ({addr}) -> $.alert "#{addr} has taken over usage of this proxy.", 'Disconnected'; return
      .on '*connected', -> Dyalog.idePage(); return
      .on '*disconnected', -> $.alert 'Interpreter disconnected'; return
      .on '*connectError', ({err}) -> $.alert err, 'Cannot connect'; return
      .on '*spawned', ({pid}) -> $spawnStatus.text "PID: #{pid}"; return
      .on '*spawnedError', ({message, code}) ->
        $spawnStatus.text if code == 'ENOENT' then 'Cannot find dyalog executable on $PATH' else message
        $spawn.button 'enable'; $spawnPort.attr 'disabled', false; return
      .on '*spawnedExited', ({code, signal}) ->
        $spawnStatus.text(if code? then "exited with code #{code}" else "received #{signal}")
        $spawn.button 'enable'; $spawnPort.attr 'disabled', false; return
    return
  return
