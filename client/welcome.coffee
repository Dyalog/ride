jQuery ($) =>
  connect = (s) -> alert 'connecting to ' + s
  $('body')
    .on 'keydown', '.hostPort', (e) -> if e.which == 13 then $('.connect').click()
    .on 'keydown', '.port', (e) -> if e.which == 13 then $('.listen').click()
    .on 'click', '.listen', -> alert 'listen'
    .on 'click', '.favs a', -> connect $(@).text()
    .on 'click', '.connect', ->
      s = $('.hostPort').val()
      if getFavs().indexOf(s) == -1 then localStorage.favs += ' ' + s; renderFavs()
      connect s
  getFavs = -> (localStorage.favs or= '127.0.0.1:4502').split ' '
  renderFavs = -> $('.favs').html 'Favourites:' + getFavs().map((s) -> "<a href='#'>#{s}</a>").join ''
  saveFavs = -> localStorage.favs = $('a', @).map(-> $(@).text()).toArray().join ' '
  @welcomePage = ->
    $('body').html '''
      <h1>Dyalog</h1>
      <fieldset>
        <legend>Connect to interpreter</legend>
        <div class="cemetery" style="visibility:hidden">Drop here to delete</div>
        <p><label>Host:port <input class="hostPort" value=""></label> <input class="connect" type="button" value="Connect">
        <p class="favs">
      </fieldset>
      <fieldset>
        <legend>Listen for connections from interpreter</legend>
        <p><label>Port <input class="port" value="4502" size="5"></label> <input class="listen" type="button" value="Listen">
      </fieldset>
      <style>
      </style>
    '''
    renderFavs()
    $('.favs').sortable connectWith: '.cemetery', cursor: 'move', update: saveFavs, remove: saveFavs
    $('.cemetery').sortable
      connectWith: '.favs'
      activate: -> $(@).css visibility: ''
      deactivate: -> $(@).css visibility: 'hidden'; $('a', @).remove()
      over: -> $(@).addClass 'cemetery-hover'
      out: -> $(@).removeClass 'cemetery-hover'
    $('.hostPort').focus()
  return
