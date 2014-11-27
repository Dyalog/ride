jQuery ($) =>
  DEFAULT_PORT = 4502
  connect = (x) -> console.info 'connecting to ', x
  localStorage.favs ?= JSON.stringify [host: '127.0.0.1', port: DEFAULT_PORT]
  $('body')
    .on 'keydown', (e) -> if e.which == 113 then Dyalog.welcomePage() # F2
    .on 'keydown', '.connect-host, .connect-port', (e) -> if e.which == 13 then $('.connect').click()
    .on 'keydown', '.listen-port', (e) -> if e.which == 13 then $('.listen').click()
    .on 'click', '.listen', -> alert 'listen'
    .on 'click', '.fav-addr', -> connect $(@).text()
    .on 'click', '.fav-del', -> $(@).closest('.fav').animate {width: 0, margin: 0, padding: 0}, -> $(@).remove(); saveFavs()
    .on 'click', '.connect', ->
      x = host: $('.connect-host').val(), port: $('.connect-port').val(), name: $('.connect-name').val()
      $('.connect-error').html ''
      if !x.host then return
      if !/^[a-z0-9\.\-:]+$/i.test x.host then $('.connect-error').html 'Invalid host'; $('.connect-host').focus(); return
      if !/^\d{1,5}$/.test(x.port) || +x.port > 0xffff then $('.connect-error').html 'Invalid port'; $('.connect-port').focus(); return
      if x.port == DEFAULT_PORT then delete x.port
      if !x.name then delete x.name
      if $('.connect-add').is(':checked') && getFavs().map(fmtFav).indexOf(fmtFav x) < 0
        localStorage.favs = JSON.stringify getFavs().concat([x]); renderFavs()
      connect x
    .on 'click', '.connect-add', -> $('.connect-name').closest('label').focus().toggle $(@).is ':checked'
    .on 'mouseover', '.fav', -> $(@).addClass 'fav-hover'
    .on 'mouseout', '.fav', -> $(@).removeClass 'fav-hover'
  getFavs = -> try JSON.parse localStorage.favs catch then []
  fmtFav = (x) ->
    s = if !x.port? || x.port == DEFAULT_PORT then x.host else if x.host.indexOf(':') < 0 then "#{x.host}:#{x.port}" else "[#{x.host}]:#{x.port}"
    if x.name then "#{x.name} (#{s})" else s
  renderFavs = ->
    $('.favs').html getFavs().map(fmtFav).map(
      (s) -> "<span class='fav'><a class='fav-addr' href='#'>#{s}</a><a class='fav-del' href='#'>×</a></span>"
    ).join ''
  saveFavs = -> localStorage.favs = JSON.stringify $('.favs .fav-addr').map(-> parseFav $(@).text()).toArray()
  parseFav = window.parseFav = (s) ->
    x = {}
    if m = /^(.*) \((.*)\)$/.exec s then [_, x.name, s] = m
    if m = /^\[(.*)\]:(.*)$/.exec s then [_, x.host, x.port] = m else [x.host, x.port] = s.split ':'
    x.port = +(x.port or DEFAULT_PORT)
    x

  Dyalog.welcomePage = ->
    $('body').html """
      <h1>Dyalog</h1>
      <fieldset>
        <legend>Connect to interpreter</legend>
        <div class="favs"></div>
        <div style="clear:both">
          <label>Host and port <input class="connect-host" value="">:<input class="connect-port" size="5" value="#{DEFAULT_PORT}">
          <input class="connect" type="button" value="Connect">
          <span class="connect-error"></span>
          <br>
          <label><input type="checkbox" checked class="connect-add">Add to favourites<label>
          <label>as <input class="connect-name"></label>
        </div>
      </fieldset>
      <fieldset>
        <legend>Listen for connections from interpreter</legend>
        <p><label>Port <input class="listen-port" value="#{DEFAULT_PORT}" size="5"></label> <input class="listen" type="button" value="Listen">
      </fieldset>
    """
    renderFavs()
    $('.favs').sortable cursor: 'move', revert: true, tolerance: 'pointer', update: saveFavs
    $('.connect-host').focus()
  return
