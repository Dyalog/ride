prefs = require './prefs'
keymap = require './keymap'
{join, esc, dict, hex, ord} = require './util'

$pk = null

@name = 'Keyboard'

@init = ($e) ->
  # Layouts are arranged by scancode.
  # http://www.abreojosensamblador.net/Productos/AOE/html/Pags_en/ApF.html
  specialKeys = 15: '⟵', 16: '↹', 30: 'Caps', 43: '↲', 44: '⇧', 57: '⇧'
  layout = '''
    ☠ ` 1 2 3 4 5 6 7 8 9 0 - = ☠ ☠
    ☠ q w e r t y u i o p [ ] \\
    ☠ a s d f g h j k l ; ' ☠ ☠
    ☠ ☠ z x c v b n m , . / ☠ ☠
  '''.split /[ \r\n]+/
  shiftLayout = '''
    ☠ ~ ! @ # $ % ^ & * ( ) _ + ☠ ☠
    ☠ Q W E R T Y U I O P { } |
    ☠ A S D F G H J K L : " ☠ ☠
    ☠ ☠ Z X C V B N M < > ? ☠ ☠
  '''.split /[ \r\n]+/
  $e.html """
    <label>Prefix key: <input class="text-field pk" size="1"></label>
    <div id="keyboard-layout">#{join(
      for i in [1..57]
        if s = specialKeys[i]
          "<span id='k#{i}' class='key'>#{esc s}</span>"
        else
          """
            <span id='k#{i}' class='key'>
              <span class='g0'>#{esc layout[i]}</span><input class='g1'><br>
              <span class='g2'>#{esc shiftLayout[i]}</span><input class='g3'/>
            </span>
          """
    )}</div>
  """
  .on 'focus', '.key input', -> setTimeout (=> $(@).select(); return), 1; return
  .on 'blur', '.key input', -> $(@).val $(@).val()[-1..] || ' '; return
  .on 'mouseover mouseout', '.key input', (e) -> $(@).toggleClass 'hover', e.type == 'mouseover'; return
  $pk = $ '.pk', $e
  return

@load = ->
  bq = keymap.getBQMap()
  $('#keyboard-layout .key').each ->
    v = bq[$('.g0', @).text()] || ' '; $('.g1', @).val(v).prop 'title', "U+#{hex ord(v), 4}"
    v = bq[$('.g2', @).text()] || ' '; $('.g3', @).val(v).prop 'title', "U+#{hex ord(v), 4}"
    return
  $pk.val prefs.prefixKey()
  return

@validate = -> if $pk.val().length != 1 then message: 'Invalid prefix key', element: $pk

@save = ->
  prefs.prefixKey $pk.val()
  keymap.setBQMap dict $('#keyboard-layout .key').map ->
    [[$('.g0', @).text(), $('.g1', @).val()], [$('.g2', @).text(), $('.g3', @).val()]]
  return
