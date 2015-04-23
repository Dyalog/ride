prefs = require './prefs'
{join, delay} = require './util'

tabs = [
  require './prefs-ui-keyboard'
  require './prefs-ui-title'
]

safe = (s) -> s.toLowerCase().replace /[^a-z\-]/g, '-' # make a string suitable for a DOM id

$d = null # dialogue instance, lazily initialized

ok = ->
  for t in tabs when v = t.validate?()
    delay 1, ->
      $.alert v.message, 'Error', if v.element then -> v.element.focus(); return
      return
    return
  for t in tabs then t.save()
  $d.dialog 'close'; false

module.exports = (tabName) ->
  if !$d # the dialogue, lazily initialized
    $d = $ """
      <div id=prefs>
        <ul id=prefs-tabs-nav>
          #{join tabs.map (t) -> "<li><a href=#prefs-tab-#{safe t.name}>#{t.name}</a></li>"}
        </ul>
        #{join tabs.map (t) -> "<div id=prefs-tab-#{safe t.name}></div>"}
      </div>
    """
      .tabs()
      .on 'keydown', 'input', 'return', ok
      .dialog autoOpen: 0, title: 'Preferences', width: 600, height: 450, buttons: [
        {text: 'OK', click: ok}
        {text: 'Cancel', click: -> $d.dialog 'close'; return}
      ]
    for t in tabs then t.init $ "#prefs-tab-#{safe t.name}"
  $d.dialog('option', 'position', at: 'center').dialog 'open'
  if tabName then $d.tabs active: $("#prefs-tabs-nav a[href='#prefs-tab-#{tabName}']").parent().index()
  for t in tabs then t.load?()
  return
