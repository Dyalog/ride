prefs = require './prefs'
{rLetter} = require './codemirror-apl-mode'
{delay} = require './util'
module.exports = (cm, requestAutocompletion) -> # set up autocompletion, common code between session and editor
  tid = null # timeout id
  cm.on 'change', ->
    if cm.getOption('mode') in ['apl', 'aplsession'] && cm.getCursor().line
      clearTimeout tid
      tid = delay 500, ->
        tid = null; c = cm.getCursor(); s = cm.getLine c.line; i = c.ch
        if i && s[i - 1] != ' ' && s[...i].replace(///[#{rLetter}]*$///, '')[-1..] != prefs.prefixKey() then requestAutocompletion s, i
        return
    return
  (skip, options) ->
    if options.length && cm.hasFocus() && cm.getWrapperElement().ownerDocument.hasFocus()
      c = cm.getCursor(); from = line: c.line, ch: c.ch - skip; sel = ''
      cm.showHint
        completeOnSingleClick: true
        completeSingle: false
        extraKeys:
          Enter:       (cm, m) -> (if sel then m.pick() else cm.execCommand 'ER'); return
          Right:       (cm, m) -> (if !sel then m.moveFocus 1); m.pick(); return
          Tab:         (cm, m) -> m.moveFocus 1; return
          'Shift-Tab': (cm, m) -> m.moveFocus -1; return
        hint: ->
          to = cm.getCursor(); u = cm.getLine(from.line)[from.ch...to.ch].toLowerCase() # u: completion prefix
          list = options.filter((o) -> o[...u.length].toLowerCase() == u).sort(); if list.length then list.unshift ''
          data = {from, to, list}
          CodeMirror.on data, 'select', (x) -> sel = x; return
          data
    return
