# Preferences UI
prefs = require './prefs'
keymap = require './keymap'
{join, esc, dict, hex, ord} = require './util'

tabImpls = [
  do ->
    $pk = null

    name: 'Keyboard'
    init: ($e) ->
      W = 550; H = 350
      K = [ # keycodes
        49, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22
        23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 51
        66, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 36
        50, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62
      ]
      layout = '''
        ` 1 2 3 4 5 6 7 8 9 0 - = ⟵
        ↹ q w e r t y u i o p [ ] \\ 
        Caps a s d f g h j k l ; ' ↲
        ⇧ z x c v b n m , . / ⇧
      '''.split /[ \r\n]+/
      shiftLayout = '''
        ~ ! @ # $ % ^ & * ( ) _ + --
        -- Q W E R T Y U I O P { } |
        -- A S D F G H J K L : " --
        -- Z X C V B N M < > ? --
      '''.split /[ \r\n]+/
      $e.html """
        <label>Prefix key: <input class="text-field pk" size="1"></label>
        <div id="keyboard-layout">#{
          join K.map (k, i) ->
            if shiftLayout[i] == '--'
              if layout[i] then "<span id='k#{k}' class='key'>#{esc layout[i]}</span>"
            else
              """
                <span id='k#{k}' class='key'>
                <span class='g0'>#{esc layout[i]}</span><input class='g1'><br>
                <span class='g2'>#{esc shiftLayout[i]}</span><input class='g3'/></span>
              """
        }</div>
      """
      .on 'focus', '.key input', -> setTimeout (=> $(@).select(); return), 1; return
      .on 'blur', '.key input', -> $(@).val $(@).val()[-1..] || ' '; return
      .on 'mouseover mouseout', '.key input', (e) -> $(@).toggleClass 'hover', e.type == 'mouseover'; return
      $pk = $ '.pk', $e
      return
    load: ->
      bq = keymap.getBQMap()
      $('#keyboard-layout .key').each ->
        v = bq[$('.g0', @).text()] || ' '; $('.g1', @).val(v).prop 'title', "U+#{hex ord(v), 4}"
        v = bq[$('.g2', @).text()] || ' '; $('.g3', @).val(v).prop 'title', "U+#{hex ord(v), 4}"
        return
      $pk.val prefs.prefixKey()
      return
    validate: -> if $pk.val().length != 1 then message: 'Invalid prefix key', element: $pk
    save: ->
      prefs.prefixKey $pk.val()
      keymap.setBQMap dict $('#keyboard-layout .key').map ->
        [[$('.g0', @).text(), $('.g1', @).val()], [$('.g2', @).text(), $('.g3', @).val()]]
      return
  do ->
    $wt = null
    name: 'Title'
    init: ($e) ->
      $e.html """
        Window title:
        <input class="text-field">
        <pre>
        <a href='#'>{WSID}</a>            workspace name
        <a href='#'>{HOST}</a>:<a href='#'>{PORT}</a>     interpreter's TCP endpoint
        <a href='#'>{PID}</a>             PID of the interpreter process
        <a href='#'>{CHARS}</a>           Unicode or Classic
        <a href='#'>{BITS}</a>            64 or 32
        <a href='#'>{VER}</a>             interpreter version
          <a href='#'>{VER_A}</a>           major
          <a href='#'>{VER_B}</a>           minor
          <a href='#'>{VER_C}</a>           svn revision
        <a href='#'>{RIDE_VER}</a>        RIDE version
          <a href='#'>{RIDE_VER_A}</a>      major
          <a href='#'>{RIDE_VER_B}</a>      minor
          <a href='#'>{RIDE_VER_C}</a>      git commit number
        </pre>
      """
      $e.on 'click', 'pre a', (e) -> $wt.insert $(e.target).text(); return
      $('pre a', $e).attr 'title', 'Insert'; $wt = $ 'input', $e; return
    load: -> $wt.val prefs.windowTitle(); return
    save: -> prefs.windowTitle $wt.val(); return
]

safe = (s) -> s.toLowerCase().replace /[^a-z\-]/g, '-' # make a string suitable for a DOM id

$d = null # dialogue instance, lazily initialized

ok = ->
  for t in tabImpls when v = t.validate?()
    setTimeout(
      ->
        $.alert v.message, 'Error', if v.element then -> v.element.focus(); return
        return
      1
    )
    return
  for t in tabImpls then t.save()
  $d.dialog 'close'; false

module.exports = (tabName) ->
  if !$d # the dialogue, lazily initialized
    $d = $ """
      <div id="prefs">
        <ul id="prefs-tabs-nav">
          #{join tabImpls.map (t) -> "<li><a href='#prefs-tab-#{safe t.name}'>#{t.name}</a></li>"}
        </ul>
        #{join tabImpls.map (t) -> "<div id='prefs-tab-#{safe t.name}'></div>"}
      </div>
    """
      .tabs()
      .on 'keydown', 'input', 'return', ok
      .dialog modal: 1, autoOpen: 0, title: 'Preferences', width: 600, height: 450, buttons: [
        {text: 'OK', click: ok}
        {text: 'Cancel', click: -> $d.dialog 'close'; return}
      ]
    for t in tabImpls then t.init $ "#prefs-tab-#{safe t.name}"
  $d.dialog('option', 'position', at: 'center').dialog 'open'
  if tabName then $d.tabs active: $("#prefs-tabs-nav a[href='#prefs-tab-#{tabName}']").parent().index()
  for t in tabImpls then t.load?()
  return
