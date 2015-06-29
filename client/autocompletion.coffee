prefs = require './prefs'
{letter} = require './codemirror-apl-mode'
{delay} = require './util'

@setUp = (win) -> # win: an instance of Editor or Session
  tid = null # timeout id
  {cm} = win
  cm.on 'change', ->
    if cm.getOption('mode') in ['apl', 'aplsession'] && cm.getCursor().line
      clearTimeout tid
      tid = delay 500, ->
        tid = null; c = cm.getCursor(); s = cm.getLine c.line; i = c.ch
        if i && s[i - 1] != ' ' && s[...i].replace(///[#{letter}]*$///, '')[-1..] != prefs.prefixKey() &&
              (win.promptType == null or win.promptType != 4) # don't autocomplete in ⍞ input
          win.autocompleteWithTab = 0
          win.emit 'Autocomplete', line: s, pos: i, token: win.id
        return
    return
  (skip, options) ->
    if options.length && cm.hasFocus() && cm.getWrapperElement().ownerDocument.hasFocus()
      c = cm.getCursor(); from = line: c.line, ch: c.ch - skip; sel = ''
      if options.length == 1 && win.autocompleteWithTab
        cm.replaceRange options[0], from, c, 'D'
      else
        cm.showHint
          completeOnSingleClick: true
          completeSingle: false
          extraKeys:
            Enter:       (cm, m) -> (if sel then m.pick() else cm.execCommand 'ER'); return
            Right:       (cm, m) -> (if !sel then m.moveFocus 1); m.pick(); return
            'Shift-Tab': (cm, m) -> m.moveFocus -1; return
            Tab:         (cm, m) -> m.moveFocus 1; options.length == 1 && m.pick(); return
          hint: ->
            to = cm.getCursor(); u = cm.getLine(from.line)[from.ch...to.ch].toLowerCase() # u: completion prefix
            list = options.filter((o) -> o[...u.length].toLowerCase() == u).sort(); if list.length then list.unshift ''
            data = {from, to, list}
            CodeMirror.on data, 'select', (x) -> sel = x; return
            data
    return
