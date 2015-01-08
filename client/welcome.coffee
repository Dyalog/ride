jQuery ($) =>
  DEFAULT_PORT = 4502
  localStorage.favs ?= JSON.stringify [host: '127.0.0.1', port: DEFAULT_PORT]
  $ 'body'
    .on 'keydown', (e) ->
      if e.which == 113 then Dyalog.welcomePage(); return false # <F2>
      if 49 <= e.which <= 57 && e.ctrlKey && !e.altKey && !e.shiftKey # <C-1> ... <C-9>
        $('.fav-addr').eq(e.which - 49).click(); return false
      return
    .on 'keydown', '.connect-host, .connect-port, .connect-name', (e) -> if e.which == 13 then $('.connect').click()
    .on 'keydown', '.listen-port', (e) -> if e.which == 13 then $('.listen').click()
    .on 'click', '.fav-addr', (event) ->
      x = parseFav $(@).text()
      Dyalog.socket.emit '*connect', host: x.host, port: x.port; Dyalog.idePage()
      event.preventDefault(); event.stopPropagation(); false
    .on 'click', '.fav-del', -> $(@).closest('.fav').animate {width: 0, margin: 0, padding: 0}, -> $(@).remove(); saveFavs()
    .on 'click', '.connect', ->
      x = host: $('.connect-host').val(), port: $('.connect-port').val(), name: $('.connect-name').val()
      $('.connect-error').html ''
      if !x.host then return
      if !/^[a-z0-9\.\-:]+$/i.test x.host then $('.connect-error').html 'Invalid host'; $('.connect-host').focus(); return
      if !/^\d{1,5}$/.test(x.port) || +x.port > 0xffff then $('.connect-error').html 'Invalid port'; $('.connect-port').focus(); return
      x.port = +x.port
      if x.port == DEFAULT_PORT then delete x.port
      if !x.name then delete x.name
      if $('.connect-add').is(':checked') && getFavs().map(fmtFav).indexOf(fmtFav x) < 0
        localStorage.favs = JSON.stringify getFavs().concat([x]); renderFavs()
      $('.connect-name').val ''
      Dyalog.socket.emit '*connect', host: x.host, port: x.port or DEFAULT_PORT
      renderFavs()
      $f = $('.fav-addr').filter(-> $(@).text() == fmtFav x).closest '.fav'
      w = $f.width()
      $f.css(width: 0).animate {width: w}, -> Dyalog.idePage()
      return
    .on 'click', '.connect-add', -> $('.connect-name').closest('label').focus().toggle $(@).is ':checked'
    .on 'mouseover', '.fav', -> $(@).addClass    'fav-hover'
    .on 'mouseout',  '.fav', -> $(@).removeClass 'fav-hover'
    .on 'mousedown', '.fav-addr', -> $(@).closest('.fav').addClass    'fav-active'
    .on 'mouseup',   '.fav-addr', -> $(@).closest('.fav').removeClass 'fav-active'
    .on 'click', '.spawn', ->
      port = +$('.spawn-port').val()
      if 0 < port < 65536
        Dyalog.socket.emit '*spawn', {port}
        $('.spawn-status').text 'Spawning...'; $('.spawn, .spawn-port').attr 'disabled', true
      else
        $('.spawn-status').text 'Invalid port'; $('.spawn-port').focus()
      return

  getFavs = -> try JSON.parse localStorage.favs catch then []
  fmtFav = (x) ->
    s = if !x.port? || x.port == DEFAULT_PORT then x.host else if x.host.indexOf(':') < 0 then "#{x.host}:#{x.port}" else "[#{x.host}]:#{x.port}"
    if x.name then "#{x.name} (#{s})" else s
  renderFavs = ->
    $('.favs').html getFavs().map((x) ->
      "<span class='fav'><a class='fav-addr' href='?host=#{escape x.host}&port=#{escape(x.port or '')}'>#{fmtFav x}</a><a class='fav-del' href='#'>×</a></span>"
    ).join ''

  saveFavs = -> localStorage.favs = JSON.stringify $('.favs .fav-addr').map(-> parseFav $(@).text()).toArray()
  parseFav = window.parseFav = (s) ->
    x = {}
    if m = /^(.*) \((.*)\)$/.exec s then [_, x.name, s] = m
    if m = /^\[(.*)\]:(.*)$/.exec s then [_, x.host, x.port] = m # IPv6 [host]:port
    else if /:.*:/.test s then x.host = s # IPv6 host without port
    else [x.host, x.port] = s.split ':' # IPv4 host:port or just host
    x.port = +(x.port or DEFAULT_PORT)
    x

  Dyalog.welcomePage = ->
    $('title').html 'Dyalog IDE'
    if (u = Dyalog.urlParams).host?
      Dyalog.socket.emit '*connect', host: u.host, port: +(u.port or DEFAULT_PORT)
      Dyalog.idePage()
    else
      $('body').html """
        <h1 class="dyalog-logo">Dyalog</h1>
        <fieldset>
          <legend>Connect to interpreter</legend>
          <div class="favs"></div>
          <div style="clear:both">
            <label>Host and port <input class="connect-host" value="">:<input class="connect-port" size="5" value="#{DEFAULT_PORT}">
            <input class="connect" type="button" value="Connect">
            <span class="connect-error"></span>
            <br>
            <label><input type="checkbox" checked class="connect-add">Add to favourites</label>
            <label>as <input class="connect-name"></label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Spawn an interpreter</legend>
          <p class="spawn-status">
          <p><label>Port <input class="spawn-port" value="#{DEFAULT_PORT}" size="5"></label> <input class="spawn" type="button" value="Spawn">
        </fieldset>
        <fieldset>
          <legend>Listen for connections from interpreter</legend>
          <p><label>Port <input disabled class="listen-port" value="#{DEFAULT_PORT}" size="5"></label> <input disabled class="listen" type="button" value="Listen">
        </fieldset>
      """
      renderFavs()
      $('.favs').sortable cursor: 'move', revert: true, tolerance: 'pointer', cancel: '.fav-del', update: saveFavs
      $('.connect-host').focus()
      Dyalog.socket.on '*spawned', ({pid}) ->
        $('.spawn-status').text "PID: #{pid}"; return
      Dyalog.socket.on '*spawnedError', ({err}) ->
        $('.spawn-status').text err; $('.spawn, .spawn-port').attr 'disabled', false; return
      Dyalog.socket.on '*spawnedExited', ({code, signal}) ->
        $('.spawn-status').text(if code? then "exited with code #{code}" else "received #{signal}")
        $('.spawn, .spawn-port').attr 'disabled', false; return
    return
  return
