prefs = require './prefs'
keymap = require './keymap'
{join, esc, dict, hex, ord, qw, delay} = require './util'

$pk = $lc = null
NK = 58 # number of scancodes we are concerned with

layouts = # indexed by scancode; see http://www.abreojosensamblador.net/Productos/AOE/html/Pags_en/ApF.html
  US:
    geometry: 'ansi' # geometries (or "mechanical layouts") are specified as CSS classes
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
  UK:
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
  DK:
    geometry: 'iso'
    normal: qw '''
      ☠ ½ 1 2 3 4 5 6 7 8 9 0 + ´ ☠ ☠
      ☠ q w e r t y u i o p å ¨ ☠
      ☠ a s d f g h j k l æ ø ' ☠
      ☠ < z x c v b n m , . - ☠ ☠
    '''
    shifted: qw '''
      ☠ § ! " # ¤ % & / ( ) = ? ` ☠ ☠
      ☠ Q W E R T Y U I O P Å ^ ☠
      ☠ A S D F G H J K L Æ Ø * ☠
      ☠ > Z X C V B N M ; : _ ☠ ☠
    '''

@name = 'Keyboard'

@init = ($e) ->
  specialKeys = 15: '⟵', 16: '↹', 30: 'Caps', 43: '↲', 44: '⇧', 57: '⇧'
  $e.html """
    <label id=keyboard-pk-label>Prefix: <input class="text-field pk" size=1></label>
    <a href=# class=reset>Reset</a>
    <table id=keyboard-legend class=key
           title='Prefix followed by shift+key produces the character in red.\nPrefix followed by an unshifted key produces the character in blue.'>
      <tr><td class=g2>⇧x</td><td class=g3><span class=pk-double>`</span>&nbsp;⇧x</td></tr>
      <tr><td class=g0>x</td><td class=g1><span class=pk-double>`</span>&nbsp;x</td></tr>
    </table>
    <div id=keyboard-layout>#{join(
      for i in [1...NK]
        if s = specialKeys[i]
          "<span id=k#{i} class=key>#{esc s}</span>"
        else
          """
            <span id=k#{i} class=key>
              <span class=g2></span><input class=g3><br>
              <span class=g0></span><input class=g1>
            </span>
          """
    )}</div>
    <select id=keyboard-locale>#{join((for x, _ of layouts then "<option>#{x}").sort())}</select>
  """
  .on 'focus', '.key input', -> delay 1, (=> $(@).select(); return); return
  .on 'blur', '.key input', -> $(@).val(v = $(@).val()[-1..] || ' ').prop 'title', "U+#{hex ord(v), 4}"; return
  .on 'mouseover mouseout', '.key input', (e) -> $(@).toggleClass 'hover', e.type == 'mouseover'; return
  if !prefs.keyboardLocale()
    prefs.keyboardLocale(
      switch navigator.language
        when 'en-GB'       then 'UK'
        when 'da', 'da_DK' then 'DK'
        else                    'US'
    )
  $('.reset', $e).button().click ->
    $pk.val(prefs.prefixKey.getDefault()).change() # fire a "change" event to update the legend
    loadBQMap keymap.getDefaultBQMap()
    false
  $lc = $('#keyboard-locale').val(prefs.keyboardLocale()).change ->
    prefs.keyboardLocale $(@).val()
    load $.extend {}, keymap.getBQMap(), dict $('#keyboard-layout .key').map ->
      [[$('.g0', @).text(), $('.g1', @).val()], [$('.g2', @).text(), $('.g3', @).val()]]
    return
  $pk = $ '.pk', $e
    .on 'change keyup', -> $('#keyboard-legend .pk-double').text $(@).val()[-1..]; return
    .focus -> delay 1, (=> $(@).select(); return); return
  return

@load = load = (bq) -> # bq: current mappings, possibly not yet saved
  $pk.val(prefs.prefixKey()).change() # fire a "change" event to update the legend
  loadBQMap bq || keymap.getBQMap()
  return

loadBQMap = (bq) ->
  layout = layouts[$lc.val()] || layouts.US
  $('#keyboard-layout').removeClass('geometry-ansi geometry-iso').addClass "geometry-#{layout.geometry}"
  for i in [1...NK]
    if (g0 = layout.normal[i]) != '☠'
      g1 = bq[g0] || ' '; $("#k#{i} .g0").text g0; $("#k#{i} .g1").val(g1).prop 'title', "U+#{hex ord(g1), 4}"
    if (g2 = layout.shifted[i]) != '☠'
      g3 = bq[g2] || ' '; $("#k#{i} .g2").text g2; $("#k#{i} .g3").val(g3).prop 'title', "U+#{hex ord(g3), 4}"
  return

@validate = -> if $pk.val().length != 1 then message: 'Invalid prefix key', element: $pk

@save = ->
  prefs.prefixKey $pk.val()
  keymap.setBQMap dict $('#keyboard-layout .key').map ->
    [[$('.g0', @).text(), $('.g1', @).val()], [$('.g2', @).text(), $('.g3', @).val()]]
  return
