$ ->
  $('body').on 'keydown', (e) -> if e.which == 114 then Dyalog.showPrefs(); false # <F3>

  $d = null # the prefs dialog instance, lazily initialised
  Dyalog.showPrefs = ->
    if !$d
      $d = $ '''
        <div>
          <p style="text-align:center"><label>Map leader: <input class="prefs-mapLeader text-field" size="1"></label></p>
          <div style="text-align:center"><a href="#" class="prefs-close" class="button">Close</a></div>
        </div>
      '''
      $('.prefs-mapLeader', $d).val Dyalog.getMapLeader()
        .on 'change', -> Dyalog.setMapLeader $(@).val(); return
        .on 'keydown', (e) -> if e.which == 13 then $d.dialog 'close'; false
      $('.prefs-close', $d).button().click -> $d.dialog 'close'; false
    $d.dialog modal: true, title: 'Keyboard Preferences'
    return
