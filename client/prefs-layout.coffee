prefs = require './prefs'
{layouts} = require './keymap'
{join, esc, hex, ord, delay} = require './util'

@name = 'Layout'

$pfx = $lc = null # DOM elements for "Prefix" and "Locale"
NK = 58 # number of scancodes we are concerned with

model = window.model = {} # dictionary: locale→[arrayOfAPLGlyphs, arrayOfShiftedAPLGlyphs]

@init = ($e) ->
  specialKeys = 15: '⟵', 16: '↹', 30: 'Caps', 43: '↲', 44: '⇧', 57: '⇧'
  $e.html """
    <label id=layout-pfx-label>Prefix: <input id=layout-pfx class=text-field size=1></label>
    <a href=# id=layout-reset>Reset</a>
    <table id=layout-legend class=key
           title='Prefix followed by shift+key produces the character in red.\nPrefix followed by an unshifted key produces the character in blue.'>
      <tr><td class=g2>⇧x</td><td class=g3><span class=pfx2>`</span>&nbsp;⇧x</td></tr>
      <tr><td class=g0>x</td><td class=g1><span class=pfx2>`</span>&nbsp;x</td></tr>
    </table>
    <div id=layout-kbd>#{join(
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
    <select id=layout-lc>#{join (for lc of layouts then "<option>#{lc}").sort()}</select>
  """
  .on 'focus', '.key input', -> delay 1, (=> $(@).select(); return); return
  .on 'blur', '.key input', ->
    $(@).val(v = $(@).val()[-1..] || ' ').prop 'title', "U+#{hex ord(v), 4}"
    i = +$(@).hasClass 'g3'; j = +$(@).closest('.key').prop('id').replace /^k/, ''
    model[$lc.val()][i][j] = v
    return
  .on 'mouseover mouseout', '.key input', (e) -> $(@).toggleClass 'hover', e.type == 'mouseover'; return
  if !prefs.kbdLocale()
    prefs.kbdLocale(
      switch navigator.language
        when 'en-GB'       then 'UK'
        when 'de'          then 'DE'
        when 'da', 'da_DK' then D.mac && 'DK-Mac' || 'DK'
        else                    'US'
    )
  $('#layout-reset').button().click ->
    lc = $lc.val()
    $pfx.val(prefs.prefixKey.getDefault()).change() # fire a "change" event to update the legend
    model[lc] = [layouts[lc][2].split(''), layouts[lc][3].split('')]
    updateGlyphs()
    false
  $lc = $('#layout-lc').change updateGlyphs
  $pfx = $ '#layout-pfx'
    .on 'change keyup', -> $('#layout-legend .pfx2').text $(@).val()[-1..]; return
    .focus -> delay 1, (=> $(@).select(); return); return
  return

@load = ->
  $lc.val prefs.kbdLocale()
  $pfx.val(prefs.prefixKey()).change() # fire a "change" event to update the legend
  model = {}
  for lc, l of layouts then model[lc] = [l[2].split(''), l[3].split('')]
  for lc, v of prefs.prefixMaps() then for i in [0...v.length] by 2
    x = v[i]; y = v[i + 1]; for j in [0..1] then ix = layouts[lc][j].indexOf x; ix >= 0 && model[lc][j][ix] = y
  updateGlyphs()
  return

# Every geometry (aka "mechanical layout") has its precise arrangement of keys specified as a CSS class.
geom = US: 'ansi', _: 'iso' # _ is the default

updateGlyphs = -> # apply model values to the DOM
  lc = $lc.val(); l = layouts[lc]; m = model[lc]
  $('#layout-kbd').removeClass('geom-ansi geom-iso').addClass "geom-#{geom[$lc.val()] || geom._}"
  for i in [1...NK]
    g0 = l[0][i]; g2 = l[1][i]
    if g0 != '☠' then $("#k#{i} .g0").text g0; g1 = m[0][i]; $("#k#{i} .g1").val(g1).prop 'title', "U+#{hex ord(g1), 4}"
    if g2 != '☠' then $("#k#{i} .g2").text g2; g3 = m[1][i]; $("#k#{i} .g3").val(g3).prop 'title', "U+#{hex ord(g3), 4}"
  return

@validate = -> if $pfx.val().length != 1 then message: 'Invalid prefix key', element: $pfx

@save = ->
  prefs.prefixKey $pfx.val()
  prefs.kbdLocale $lc.val()
  h = {}
  for lc, m of model
    l = layouts[lc]; s = ''; xs = l[0] + l[1]; ys = m[0].concat(m[1]).join ''; YS = l[2] + l[3] # YS: the defaults
    for x, i in xs then y = ys[i]; Y = YS[i]; if x != '☠' && y != '☠' && y != Y then s += x + y
    s && h[lc] = s
  prefs.prefixMaps h
  return
