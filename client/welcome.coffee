jQuery ($) =>
  connect = (s) -> alert 'connecting to ' + s
  $('body')
    .on 'keydown', (e) -> if e.which == 113 then Dyalog.welcomePage() # F2
    .on 'keydown', '.hostPort', (e) -> if e.which == 13 then $('.connect').click()
    .on 'keydown', '.port', (e) -> if e.which == 13 then $('.listen').click()
    .on 'click', '.listen', -> alert 'listen'
    .on 'click', '.fav-addr', -> connect $(@).text()
    .on 'click', '.fav-del', -> $(@).closest('.fav').animate {width: 0, margin: 0, padding: 0}, -> $(@).remove(); saveFavs()
    .on 'click', '.connect', ->
      s = $('.hostPort').val()
      if getFavs().indexOf(s) == -1 then localStorage.favs = getFavs().concat([s]).join ' '; renderFavs()
      connect s
    .on 'mouseover', '.fav', -> $(@).addClass 'fav-hover'
    .on 'mouseout', '.fav', -> $(@).removeClass 'fav-hover'
  localStorage.favs ?= '127.0.0.1:4502'
  getFavs = -> if s = localStorage.favs then s.split ' ' else []
  renderFavs = ->
    $('.favs').html getFavs().map(
      (s) -> "<span class='fav'><a class='fav-addr' href='#'>#{s}</a><a class='fav-del' href='#'>×</a></span>"
    ).join ''
  saveFavs = -> localStorage.favs = $('.favs .fav-addr').map(-> $(@).text()).toArray().join ' '
  Dyalog.welcomePage = ->
    $('body').html '''
      <h1>Dyalog</h1>
      <fieldset>
        <legend>Connect to interpreter</legend>
        <p><label>Host:port <input class="hostPort" value=""></label> <input class="connect" type="button" value="Connect">
        <p class="favs">
      </fieldset>
      <fieldset>
        <legend>Listen for connections from interpreter</legend>
        <p><label>Port <input class="port" value="4502" size="5"></label> <input class="listen" type="button" value="Listen">
      </fieldset>
    '''
    renderFavs()
    $('.favs').sortable cursor: 'move', revert: true, tolerance: 'pointer', update: saveFavs
    $('.hostPort').focus()
  return
