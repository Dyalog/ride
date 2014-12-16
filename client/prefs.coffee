$ ->
  $('body').on 'keydown', (e) -> if e.which == 114 then Dyalog.showPrefs(); false # <F3>

  $d = null # the prefs dialog instance, lazily initialised
  Dyalog.showPrefs = ->
    if !$d
      $d = $ '''
        <div>
          <p><label>Map leader: <input class="prefs-mapLeader" size="1"></label>
          <p style="text-align:center"><input class="prefs-close" type="button" value="Close">
        </div>
      '''
      $('.prefs-mapLeader', $d).val Dyalog.getMapLeader()
        .on 'change', -> Dyalog.setMapLeader $(@).val(); return
        .on 'keydown', (e) -> if e.which == 13 then $d.dialog 'close'; false
      $('.prefs-close', $d).click -> $d.dialog 'close'; false
    $d.dialog modal: true, title: 'Preferences'
    return
