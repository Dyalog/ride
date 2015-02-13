connect = require './connect.coffee'

D.urlParams = {}
for kv in (location + '').replace(/^[^\?]*($|\?)/, '').split '&'
  [_, k, v] = /^([^=]*)=?(.*)$/.exec kv; D.urlParams[unescape(k or '')] = unescape(v or '')
if opener && (win = D.urlParams.win)? # are we running in a floating editor window?
  $ ->
    wins = opener.D.wins
    $('body').addClass('floating-window').html('<div class="ui-layout-center"></div>').layout
      defaults: enableCursorHotkey: 0
      center: onresize: -> ed?.updateSize(); return
      fxName: ''
    $('title').text wins[win].name
    ed0 = wins[win].widget; ed = wins[win].widget = D.Editor $('.ui-layout-center'), ed0.getOpts()
    ed.setValue ed0.getValue(); ed.setCursorIndex ed0.getCursorIndex(); ed.updateSize(); ed.highlight ed0.getHighlightedLine()
    ed.focus(); ed0 = null
    window.onbeforeunload = -> ed.saveAndClose(); return
    return
else
  D.socket = if D.createSocket then D.createSocket() else io()
  D.quit ?= close
  $ -> connect(); return

# CSS class to indicate theme
$ ->
  # https://nodejs.org/api/process.html#process_process_platform
  # https://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
  # The theme can be overridden through localStorage.theme or an environment variable $DYALOG_IDE_THEME
  localStorage.theme ?= D.process?.env?.DYALOG_IDE_THEME || do ->
    p = (D.process ? navigator).platform
    if /^(darwin|mac|ipad|iphone|ipod)/i.test p then 'cupertino'
    else if /^(linux|x11|android)/i.test p then 'freedom'
    else 'redmond'
  $('body').addClass "theme-#{localStorage.theme}"
  return

# CSS class for focused window
$(window).on 'focus blur', (e) -> $('body').toggleClass 'window-focused', e.type == 'focus'
