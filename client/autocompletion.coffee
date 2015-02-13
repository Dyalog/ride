module.exports = (cm, requestAutocompletion) -> # set up autocompletion, common code between session and editor
  tid = null # timeout id
  cm.on 'change', ->
    clearTimeout tid
    tid = setTimeout (-> tid = null; c = cm.getCursor(); requestAutocompletion cm.getLine(c.line), c.ch; return), 500
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
