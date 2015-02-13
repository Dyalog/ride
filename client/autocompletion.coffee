keymap = require './keymap.coffee'
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
    c = cm.getCursor(); from = line: c.line, ch: c.ch - skip
    cm.showHint
      completeOnSingleClick: true
      completeSingle: false
      extraKeys: Right: (cm, m) -> m.pick()
      hint: ->
        to = cm.getCursor(); u = cm.getLine(from.line)[from.ch...to.ch].toLowerCase() # u: completion prefix
        {from, to, list: options.filter (o) -> o[...u.length].toLowerCase() == u}
    return
