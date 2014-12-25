$ ->
  $('body').on 'keydown', (e) -> if e.which == 114 then Dyalog.showPrefs(); false # <F3>

  $d = $pk = null # the prefs dialog instance, lazily initialised
  Dyalog.showPrefs = ->
    if !$d
      $d = $ '''
        <div>
          <p style="text-align:center"><label>Prefix key: <input class="prefs-pk text-field" size="1"></label></p>
          <div style="text-align:center">
            <a href="#" class="prefs-ok" class="button">OK</a>
            <a href="#" class="prefs-cancel" class="button">Cancel</a>
          </div>
        </div>
      '''
      $pk = $ '.prefs-pk', $d
      $ok = $ '.prefs-ok', $d
      $cancel = $ '.prefs-cancel', $d
      $pk.on 'keydown', (e) -> if e.which == 13 then $ok.click(); false
      $cancel.button().click -> $d.dialog 'close'; false
      $ok.button().click ->
        pk = $pk.val(); if pk.length != 1 then alert 'Invalid prefix key'; $pk.focus(); return false
        Dyalog.setPrefixKey pk; $d.dialog 'close'; false
    $pk.val Dyalog.getPrefixKey()
    $d.dialog modal: true, title: 'Keyboard Preferences'
    return
