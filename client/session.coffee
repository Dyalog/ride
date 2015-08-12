autocompletion = require './autocompletion'
prefs = require './prefs'
{onCodeMirrorDoubleClick} = require './util'
{delay} = require './util'

class @Session
  constructor: (@ide, e, @opts) ->
    {@emit} = @opts
    @dirty = {} # modified: line number -> original content; inserted: line number -> 0
    @hist = ['']; @histIndex = 0
    @$e = $(e).addClass 'ride-win'
    @cm = new CodeMirror @$e[0],
      autofocus: true, mode: 'aplsession', matchBrackets: !!prefs.matchBrackets(), readOnly: true, keyMap: 'dyalog'
      lineWrapping: !!prefs.wrap(), indentUnit: 4, autoCloseBrackets: {pairs: '()[]{}', explode: ''}
      dragDrop: 0, extraKeys: {'Shift-Tab': 'indentLess', Tab: 'tabOrAutocomplete'}
    @cm.dyalogCommands = @
    onCodeMirrorDoubleClick @cm, (e) => @ED(); e.stopPropagation(); e.preventDefault(); return
    @focusTimestamp = 0
    @cm.on 'focus', => @focusTimestamp = +new Date; @ide.focusedWin = @; return
    @cm.on 'beforeChange', (_, c) =>
      if c.origin != 'D'
        l0 = c.from.line; l1 = c.to.line; m = l1 - l0 + 1; n = c.text.length
        if n < m
          if c.update
            c.update c.from, c.to, c.text.concat(for [0...m - n] then ''); n = m # pad shrinking changes with empty lines
          else
            c.cancel(); return # the change is probably the result of Undo
        else if m < n
          h = @dirty; @dirty = {}; for x, y of h then @dirty[x + (n - m) * (x > l1)] = y
        l = l0
        while l <= l1    then @dirty[l] ?= @cm.getLine l; l++
        while l < l0 + n then @dirty[l] = 0;              l++
      return
    @cm.on 'change', (_, c) =>
      if c.origin != 'D'
        l0 = c.from.line; l1 = c.to.line; m = l1 - l0 + 1; n = c.text.length
        for l of @dirty then @cm.addLineClass +l, 'background', 'modified'
      return
    @promptType = 0 # 0=Invalid 1=Descalc 2=QuadInput 3=LineEditor 4=QuoteQuadInput 5=Prompt
    @autocomplete = autocompletion.setUp @
    prefs.wrap (x) => @cm.setOption 'lineWrapping', !!x; @scrollCursorIntoView(); return
    return

  histAdd: (lines) -> @hist[0] = ''; @hist[1...1] = lines; @histIndex = 0; return
  histMove: (d) ->
    i = @histIndex + d
    if i < 0 then $.alert 'There is no next line', 'Dyalog APL Error'
    else if i >= @hist.length then $.alert 'There is no previous line', 'Dyalog APL Error'
    else
      l = @cm.getCursor().line; if !@histIndex then @hist[0] = @cm.getLine l
      if @hist[i]?
        @cm.replaceRange @hist[i], {line: l, ch: 0}, {line: l, ch: @cm.getLine(l).length}, 'D'
        @cm.setCursor line: l, ch: @hist[i].replace(/[^ ].*$/, '').length; @histIndex = i
    return

  add: (s) ->
    l = @cm.lastLine(); s0 = @cm.getLine l
    @cm.replaceRange (if @cm.getOption 'readOnly' then s0 + s else s), {line: l, ch: 0}, {line: l, ch: s0.length}, 'D'
    @cm.setCursor @cm.lastLine(), 0; return

  prompt: (why) -> # why: 0=NoPrompt 1=Descalc 2=QuadInput 3=LineEditor 4=QuoteQuadInput 5=Prompt
    @promptType = why; @cm.setOption 'readOnly', !why; @cm.setOption 'cursorHeight', +!!why; l = @cm.lastLine()
    if (why == 1 && !@dirty[l]?) || why !in [0, 1, 3, 4]
      @cm.replaceRange '      ', {line: l, ch: 0}, {line: l, ch: @cm.getLine(l).length}, 'D'
    else if '      ' == @cm.getLine l
      @cm.replaceRange '', {line: l, ch: 0}, {line: l, ch: 6}, 'D'
    else
      @cm.setCursor l, @cm.getLine(l).length
    why && @cm.clearHistory(); return

  updateSize: ->
    i = @cm.getScrollInfo()
    b = 5 > Math.abs i.top + i.clientHeight - i.height # are we near the bottom edge?
    @cm.setSize @$e.width(), @$e.height()
    b && @scrollCursorIntoView()
    return

  hasFocus: -> window.focused && @cm.hasFocus()
  focus: -> (if !window.focused then window.focus()); @cm.focus(); return
  insert: (ch) -> @cm.getOption('readOnly') || @cm.replaceSelection ch; return
  scrollCursorIntoView: -> delay 1, (=> @cm.scrollIntoView @cm.getCursor(); return); return
  die: -> @cm.setOption 'readOnly', true; return
  getDocument: -> @$e[0].ownerDocument
  refresh: -> @cm.refresh(); return
  loadLine: (s) ->
    l = @cm.lastLine(); @cm.replaceRange s, {line: l, ch: 0}, {line: l, ch: @cm.getLine(l).length}; return

  exec: (trace) ->
    if @promptType
      ls = []; for l of @dirty then ls.push +l
      if ls.length
        ls.sort (x, y) -> x - y
        es = ls.map (l) => @cm.getLine l # strings to execute
        ls.reverse().forEach (l) =>
          @cm.removeLineClass l, 'background', 'modified'
          if @dirty[l] == 0
            @cm.replaceRange '', {line: l, ch: 0}, {line: l + 1, ch: 0}, 'D'
          else
            @cm.replaceRange @dirty[l], {line: l, ch: 0}, {line: l, ch: @cm.getLine(l)?.length || 0}, 'D'
          return
      else
        es = [@cm.getLine @cm.getCursor().line]
      @opts.exec es, trace; @dirty = {}; @histAdd es.filter ((x) -> !/^\s*$/.test x); @cm.clearHistory()
    return

  # Commands:
  ED: -> c = @cm.getCursor(); @emit 'Edit', win: 0, pos: c.ch, text: @cm.getLine c.line; return
  BK: -> @histMove 1; return
  FD: -> @histMove -1; return
  QT: ->
    c = @cm.getCursor(); l = c.line
    if @dirty[l] == 0
      if l == @cm.lastLine()
        @cm.replaceRange '', {line: l - 1, ch: @cm.getLine(l - 1).length}, {line: l, ch: @cm.getLine(l).length}, 'D'
      else
        @cm.replaceRange '', {line: l, ch: 0}, {line: l + 1, ch: 0}, 'D'
      delete @dirty[l]; h = @dirty; @dirty = {}; for x, y of h then @dirty[x - (x > l)] = y
    else if @dirty[l]?
      @cm.replaceRange @dirty[l], {line: l, ch: 0}, {line: l, ch: @cm.getLine(l).length}, 'D'
      delete @dirty[l]; @cm.removeLineClass l, 'background', 'modified'; @cm.setCursor l + 1, c.ch
    return
  EP: -> @ide.focusMRUWin(); return
  ER: -> @exec 0; return
  TC: -> @exec 1; return
  tabOrAutocomplete: ->
    if @cm.somethingSelected()
      @cm.execCommand 'indentMore'
    else if @promptType != 4 # don't autocomplete in ⍞ input
      c = @cm.getCursor(); s = @cm.getLine c.line
      if /^ *$/.test s[...c.ch] then @cm.execCommand 'indentMore'
      else @autocompleteWithTab = 1; @emit 'Autocomplete', line: s, pos: c.ch, token: 0
    return
