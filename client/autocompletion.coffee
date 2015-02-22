keymap = require './keymap'
module.exports = (cm, requestAutocompletion) -> # set up autocompletion, common code between session and editor
  tid = null # timeout id
  cm.on 'change', ->
    clearTimeout tid
    tid = setTimeout(
      ->
        tid = null; c = cm.getCursor(); s = cm.getLine c.line; i = c.ch
        if s[i - 1] !in [' ', keymap.getPrefixKey()] then requestAutocompletion s, i
        return
      500
    )
    return
  (skip, options) ->
    if options.length
      c = cm.getCursor(); from = line: c.line, ch: c.ch - skip; sel = ''
      cm.showHint
        completeOnSingleClick: true
        completeSingle: false
        extraKeys:
          Enter:       (cm, m) -> (if sel then m.pick() else cm.execCommand 'ER'); return
          Right:       (cm, m) -> m.pick(); return
          Tab:         (cm, m) -> m.moveFocus 1; return
          'Shift-Tab': (cm, m) -> m.moveFocus -1; return
        hint: ->
          to = cm.getCursor(); u = cm.getLine(from.line)[from.ch...to.ch].toLowerCase() # u: completion prefix
          data = {from, to, list: [''].concat options.filter((o) -> o[...u.length].toLowerCase() == u).sort()}
          CodeMirror.on data, 'select', (x) -> sel = x; return
          data
    return
