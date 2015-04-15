prefs = require './prefs'
keymap = require './keymap'
{join, esc, dict, hex, ord, qw} = require './util'

$pk = null
NK = 58 # number of scancodes

layouts = # indexed by scancode; see http://www.abreojosensamblador.net/Productos/AOE/html/Pags_en/ApF.html
  US:
    geometry: 'ansi'
    normal: qw '''
      ☠ ` 1 2 3 4 5 6 7 8 9 0 - = ☠ ☠
      ☠ q w e r t y u i o p [ ] \\
      ☠ a s d f g h j k l ; ' ☠ ☠
      ☠ ☠ z x c v b n m , . / ☠ ☠
    '''
    shifted: qw '''
      ☠ ~ ! @ # $ % ^ & * ( ) _ + ☠ ☠
      ☠ Q W E R T Y U I O P { } |
      ☠ A S D F G H J K L : " ☠ ☠
      ☠ ☠ Z X C V B N M < > ? ☠ ☠
    '''
  GB:
    geometry: 'iso'
    normal: qw '''
      ☠ ` 1 2 3 4 5 6 7 8 9 0 - = ☠ ☠
      ☠ q w e r t y u i o p [ ] ☠
      ☠ a s d f g h j k l ; ' # ☠
      ☠ \\ z x c v b n m , . / ☠ ☠
    '''
    shifted: qw '''
      ☠ ¬ ! " £ $ % ^ & * ( ) _ + ☠ ☠
      ☠ Q W E R T Y U I O P { } ☠
      ☠ A S D F G H J K L : @ ~ ☠
      ☠ | Z X C V B N M < > ? ☠ ☠
    '''

@name = 'Keyboard'

@init = ($e) ->
  specialKeys = 15: '⟵', 16: '↹', 30: 'Caps', 43: '↲', 44: '⇧', 57: '⇧'
  $e.html """
    <label>Prefix key: <input class="text-field pk" size="1"></label>
    <div id="keyboard-layout">#{join(
      for i in [1...NK]
        if s = specialKeys[i]
          "<span id='k#{i}' class='key'>#{esc s}</span>"
        else
          """
            <span id='k#{i}' class='key'>
              <span class='g2'></span><input class='g3'><br>
              <span class='g0'></span><input class='g1'>
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
  layout = layouts.GB
  $('#keyboard-layout').removeClass('geometry-ansi geometry-iso').addClass "geometry-#{layout.geometry}"
  for i in [1...NK]
    if (g0 = layout.normal[i]) != '☠'
      g1 = bq[g0] || ' '; $("#k#{i} .g0").text g0; $("#k#{i} .g1").val(g1).prop 'title', "U+#{hex ord(g1), 4}"
    if (g2 = layout.shifted[i]) != '☠'
      g3 = bq[g2] || ' '; $("#k#{i} .g2").text g2; $("#k#{i} .g3").val(g3).prop 'title', "U+#{hex ord(g3), 4}"
  $pk.val prefs.prefixKey()
  return

@validate = -> if $pk.val().length != 1 then message: 'Invalid prefix key', element: $pk

@save = ->
  prefs.prefixKey $pk.val()
  keymap.setBQMap dict $('#keyboard-layout .key').map ->
    [[$('.g0', @).text(), $('.g1', @).val()], [$('.g2', @).text(), $('.g3', @).val()]]
  return
