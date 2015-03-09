require 'codemirror/addon/dialog/dialog'
require 'codemirror/addon/search/searchcursor'
require 'codemirror/addon/scroll/annotatescrollbar'
require 'codemirror/addon/search/matchesonscrollbar'
require 'codemirror/addon/hint/show-hint'
require 'codemirror/addon/edit/matchbrackets'
require 'codemirror/addon/edit/closebrackets'
connect = require './connect'
Editor = require './editor'
about = require './about'
require '../jquery.layout'
ide = require './ide'

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
    ed0 = wins[win].widget; ed = wins[win].widget = Editor $('.ui-layout-center'), ed0.getOpts()
    ed.setState ed0.getState(); ed.updateSize(); ed.focus(); ed0 = null
    window.onbeforeunload = ->
      fwis = try JSON.parse localStorage.floatingWindowInfos catch then {}
      fwis[win] = x: window.screenX, y: window.screenY, width: $(window).width(), height: $(window).height()
      localStorage.floatingWindowInfos = JSON.stringify fwis
      ed.saveAndClose(); return
    return
else
  D.socket = if D.createSocket then D.createSocket() else io()
  D.quit ?= close
  $ ->
    o = D.opts || {} # handle command line arguments
    setTimeout(
      ->
        if o.listen
          cp = connect(); cp.listen o._[0]
        else if o.connect
          cp = connect(); cp.connect o.connect
        else if o.spawn
          ideInstance = ide()
          D.socket
            .on '*connected', ({host, port}) -> ideInstance.setHostAndPort host, port; return
            .emit '*spawn'
        else
          connect()
        return
      100 # TODO: race condition?
    )

$ ->
  # CSS class to indicate theme
  # https://nodejs.org/api/process.html#process_process_platform
  # https://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
  # The theme can be overridden through localStorage.theme or an environment variable $DYALOG_IDE_THEME
  localStorage.theme ?= D.process?.env?.DYALOG_IDE_THEME || do ->
    p = (D.process ? navigator).platform
    if /^(darwin|mac|ipad|iphone|ipod)/i.test p then 'cupertino'
    else if /^(linux|x11|android)/i.test p then 'freedom'
    else 'redmond'
  $('body').addClass "theme-#{localStorage.theme}"
  $(document).on 'keydown', '*', 'shift+f1', -> about(); false

  # CSS class to indicate platform (NW.js-only)
  if D.process
    if D.process.platform == 'darwin' then $('body').addClass 'platform-mac'
    else if /^win/i.test D.process.platform then $('body').addClass 'platform-windows'

  # CSS class for focused window
  $(window).on 'focus blur', (e) -> $('body').toggleClass 'window-focused', e.type == 'focus'
  return
