autocompletion = require './autocompletion.coffee'
module.exports = (e, opts = {}) ->
  b = (cssClasses, description) -> "<a href='#' class='#{cssClasses} tb-button' title='#{description}'></a>"
  ($e = $ e).html """
    <div class="toolbar debugger-toolbar">
      #{[ # when in a floating window, the first two buttons in each toolbar are hidden through css
        b 'tb-quit tb-rhs',  'Quit this function'
        b 'tb-pop tb-rhs',   'Edit in a floating window'
        b 'tb-over',         'Execute line'
        b 'tb-into',         'Trace into expression'
        b 'tb-back',         'Go back one line'
        b 'tb-skip',         'Skip current line'
        b 'tb-cont-trace',   'Continue trace'
        b 'tb-cont-exec',    'Continue execution'
        b 'tb-restart',      'Restart all threads'
        b 'tb-edit-name',    'Edit name'
        b 'tb-interrupt',    'Interrupt'
        b 'tb-cutback',      'Clear trace/stop/monitor for this object'
        b 'tb-line-numbers', 'Toggle line numbers'
        '<span class="tb-separator"></span>'
        '<input class="tb-search text-field">'
        b 'tb-next',         'Search for next match'
        b 'tb-prev',         'Search for previous match'
        b 'tb-case',         'Match case'
      ].join ''}
    </div>
    <div class="toolbar editor-toolbar">
      #{[
        b 'tb-save tb-rhs',  'Save changes and return'
        b 'tb-pop tb-rhs',   'Edit in a floating window'
        b 'tb-line-numbers pressed', 'Toggle line numbers'
        b 'tb-comment',      'Comment selected text'
        b 'tb-uncomment',    'Uncomment selected text'
        '<span class="tb-separator"></span>'
        '<input class="tb-search text-field">'
        b 'tb-next',         'Search for next match'
        b 'tb-prev',         'Search for previous match'
        b 'tb-case',         'Match case'
        '<span class="tb-separator"></span>'
        b 'tb-refac-m',      'Refactor text as method'
        b 'tb-refac-f',      'Refactor text as field'
        b 'tb-refac-p',      'Refactor text as property'
      ].join ''}
    </div>
    <div class="cm"></div>
  """
  b = null

  k = # extra keys for CodeMirror
    Tab: -> c = cm.getCursor(); opts.autocomplete? cm.getLine(c.line), c.ch; return
    Enter: -> (if opts.debugger then opts.over?() else cm.execCommand 'newlineAndIndent'); return
    'Ctrl-Enter': -> (if opts.debugger then opts.into?()); return
  ###
    F6: -> opts.openInExternalEditor? cm.getValue(), cm.getCursor().line, (err, text) ->
      if err then $.alert '' + err, 'Error' else c = cm.getCursor().line; cm.setValue text; cm.setCursor c
      return
    F7: -> # align comments
      if cm.somethingSelected()
        spc = (n) -> Array(n + 1).join ' '
        o = cm.listSelections() # original selections
        sels = o.map (sel) ->
          p = sel.anchor; q = sel.head
          if p.line > q.line || p.line == q.line && p.ch > q.ch then h = p; p = q; q = h
          l = cm.getRange({line: p.line, ch: 0}, q, '\n').split '\n' # lines
          u = l.map (x) -> x.replace /'[^']*'?/g, (y) -> spc y.length # lines with scrubbed string literals
          c = u.map (x) -> x.indexOf '⍝' # column index of the '⍝'
          {p, q, l, u, c}
        m = Math.max (sels.map (sel) -> Math.max sel.c...)...
        sels.forEach (sel) ->
          r = sel.l.map (x, i) -> ci = sel.c[i]; if ci < 0 then x else x[...ci] + spc(m - ci) + x[ci..]
          r[0] = r[0][sel.p.ch..]; cm.replaceRange r.join('\n'), sel.p, sel.q, 'D'; return
        cm.setSelections o
      return
  ###

  k["'\uf800'"] = k['Shift-Esc'] = QT = -> # QT: Quit (and lose changes)
    opts.close?()

  k["'\uf804'"] = k.Esc = EP = -> # EP: Exit (and save changes)
    if (v = cm.getValue()) != originalValue
      bs = []; for l of breakpoints then bs.push +l; cm.setGutterMarker +l, 'breakpoint', null
      opts.save? cm.getValue(), bs
    else
      opts.close?()
    return

  k["'\uf828'"] = k['Shift-Enter'] = -> # ED: Edit
    opts.edit? cm.getValue(), cm.indexFromPos cm.getCursor()

  k["'\uf859'"] = k['Ctrl-Up'] = -> # TL: Toggle Localisation
    c = cm.getCursor(); s = cm.getLine c.line
    r = '[A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ0-9]*' # regex fragment to match identifiers
    name = ((///⎕?#{r}$///.exec(s[...c.ch])?[0] or '') + (///^#{r}///.exec(s[c.ch..])?[0] or '')).replace /^\d+/, ''
    if name
      # search backwards for a line that looks like a tradfn header (though in theory it might be a dfns's recursive call)
      l = c.line; while l >= 0 && !/^\s*∇\s*\S/.test cm.getLine l then l--
      if l < 0 and !/\{\s*$/.test cm.getLine(0).replace /⍝.*/, '' then l = 0
      if l >= 0 && l != c.line
        [_, s, comment] = /([^⍝]*)(.*)/.exec cm.getLine l
        [head, tail...] = s.split ';'; head = head.replace /\s+$/, ''; tail = tail.map (x) -> x.replace /\s+/g, ''
        i = tail.indexOf name; if i < 0 then tail.push name else tail.splice i, 1
        s = [head].concat(tail.sort()).join(';') + if comment then ' ' + comment else ''
        cm.replaceRange s, {line: l, ch: 0}, {line: l, ch: cm.getLine(l).length}, 'D'
    return

  k["'\uf820'"] = k['Shift-Ctrl-Backspace'] = BK = opts.back # BK: Backward or Undo
  k["'\uf81f'"] = k['Shift-Ctrl-Enter']     = FD = opts.skip # FD: Forward or Redo

  cm = CodeMirror $e.find('.cm')[0],
    fixedGutter: false, firstLineNumber: 0, lineNumberFormatter: (i) -> "[#{i}]"
    keyMap: 'dyalog', matchBrackets: true, autoCloseBrackets: {triples: ''}, gutters: ['breakpoints', 'CodeMirror-linenumbers']
    extraKeys: k

  createBreakpointElement = -> $('<div class="breakpoint">●</div>')[0]
  breakpoints = {}
  cm.on 'gutterClick', (cm, l) ->
    if breakpoints[l]
      delete breakpoints[l]
      cm.setGutterMarker l, 'breakpoints', null
    else
      breakpoints[l] = 1
      cm.setGutterMarker l, 'breakpoints', createBreakpointElement()
    return

  $tb = $ '.toolbar', $e
    .on 'mousedown',        '.tb-button', (e) -> $(e.target).addClass    'armed'; e.preventDefault(); return
    .on 'mouseup mouseout', '.tb-button', (e) -> $(e.target).removeClass 'armed'; e.preventDefault(); return
    .on 'click', '.tb-pop',        -> opts.pop?()                 ; false
    .on 'click', '.tb-quit',       -> QT()                        ; false
    .on 'click', '.tb-over',       -> opts.over?()                ; false
    .on 'click', '.tb-into',       -> opts.into?()                ; false
    .on 'click', '.tb-back',       -> BK()                        ; false
    .on 'click', '.tb-skip',       -> FD()                        ; false
    .on 'click', '.tb-cont-trace', -> opts.continueTrace?()       ; false
    .on 'click', '.tb-cont-exec',  -> opts.continueExec?()        ; false
    .on 'click', '.tb-restart',    -> opts.restartThreads?()      ; false
    .on 'click', '.tb-edit-name',  -> opts.edit? cm.getValue(), 0 ; false
    .on 'click', '.tb-interrupt',  -> opts.interrupt?()           ; false
    .on 'click', '.tb-cutback',    -> opts.cutback?()             ; false
    .on 'click', '.tb-line-numbers', ->
      p = if opts.debugger then 'lineNumbersInDebugger' else 'lineNumbersInEditor'
      localStorage[p] = b = 1 - localStorage[p]
      cm.setOption 'lineNumbers', !!b
      $(@).toggleClass 'pressed', b
      false
    .on 'click', '.tb-save', -> EP(); false
    .on 'click', '.tb-comment', ->
      if cm.somethingSelected()
        a = cm.listSelections()
        cm.replaceSelections cm.getSelections().map (s) -> s.replace(/^/gm, '⍝').replace /\n⍝$/, '\n'
        cm.setSelections a
      else
        l = cm.getCursor().line; p = line: l, ch: 0; cm.replaceRange '⍝', p, p, 'D'; cm.setCursor line: l, ch: 1
      false
    .on 'click', '.tb-uncomment', ->
      if cm.somethingSelected()
        a = cm.listSelections()
        cm.replaceSelections cm.getSelections().map (s) -> s.replace /^⍝/gm, ''
        cm.setSelections a
      else
        l = cm.getCursor().line; s = cm.getLine l
        cm.replaceRange s.replace(/^( *)⍝/, '$1'), {line: l, ch: 0}, {line: l, ch: s.length}, 'D'
        cm.setCursor line: l, ch: 0
      false
    .on 'click', '.tb-hid, .tb-case', -> $(@).toggleClass 'pressed'; highlightSearch(); false
    .on 'click', '.tb-next',                     -> search();    false
    .on 'click', '.tb-prev',                     -> search true; false
    .on 'keydown', '.tb-search', 'return',       -> search();    false
    .on 'keydown', '.tb-search', 'shift+return', -> search true; false
    .on 'keydown', '.tb-search', 'esc', -> clearSearch(); false
    .on 'click', '.tb-refac-m', ->
      if !/^\s*$/.test s = cm.getLine l = cm.getCursor().line
        cm.replaceRange "∇ #{s}\n\n∇", {line: l, ch: 0}, {line: l, ch: s.length}, 'D'
        cm.setCursor line: l + 1, ch: 0
    .on 'click', '.tb-refac-f', ->
      if !/^\s*$/.test s = cm.getLine l = cm.getCursor().line
        cm.replaceRange ":field public #{s}", {line: l, ch: 0}, {line: l, ch: s.length}, 'D'
        cm.setCursor line: l + 1, ch: 0
    .on 'click', '.tb-refac-p', ->
      if !/^\s*$/.test s = cm.getLine l = cm.getCursor().line
        cm.replaceRange ":Property #{s}\n\n∇r←get\nr←0\n∇\n\n∇set args\n∇\n:EndProperty", {line: l, ch: 0}, {line: l, ch: s.length}, 'D'
        cm.setCursor line: l + 1, ch: 0

  lastQuery = ''; lastIC = null; overlay = null
  clearSearch = -> cm.removeOverlay overlay; cm.focus(); return
  highlightSearch = ->
    ic = !$('.tb-case:visible', $tb).hasClass 'pressed' # ic: ignore case (like in vim)
    q = $('.tb-search:visible', $tb).val(); if ic then q = q.toLowerCase() # q: the query string
    if lastQuery != q || lastIC != ic
      lastQuery = q; lastIC = ic
      cm.removeOverlay overlay
      if q then cm.addOverlay overlay = token: (stream) ->
        s = stream.string[stream.pos..]; if ic then s = s.toLowerCase()
        i = s.indexOf q
        if !i then         stream.pos += q.length; 'searching'
        else if i > 0 then stream.pos += i;        undefined
        else               stream.skipToEnd();     undefined
    [q, ic]
  search = (backwards) ->
    [q, ic] = highlightSearch()
    if q then do ->
      s = cm.getValue(); if ic then s = s.toLowerCase()
      if backwards
        i = cm.indexFromPos cm.getCursor 'anchor'
        j = s[...i].lastIndexOf q; if j < 0 then j = s[i..].lastIndexOf q; if j >= 0 then j += i
      else
        i = cm.indexFromPos cm.getCursor()
        j = s[i..].indexOf q; if j > 0 then j += i else j = s[...i].indexOf q
      if j >= 0
        cm.setSelection cm.posFromIndex(j), cm.posFromIndex j + q.length
        # Try to scroll the current match to 1/3 of editor height, though this might not work near the top or bottom:
        h = $e.height(); {left, top} = cm.cursorCoords true, 'local'
        cm.scrollIntoView left: left, right: left, top: top - h / 3, bottom: top + 2 * h / 3
    false

  setDebugger = (x) ->
    opts.debugger = x
    $('.debugger-toolbar', $e).toggle x
    $('.editor-toolbar', $e).toggle !x
    cm.setOption 'readOnly', x
    $('.CodeMirror', $e).toggleClass 'debugger', x
    p = if x then 'lineNumbersInDebugger' else 'lineNumbersInEditor'
    localStorage[p] ?= +!x
    cm.setOption 'lineNumbers', !!+localStorage[p]
    $tb.find('.tb-line-numbers:visible').toggleClass 'pressed', !!+localStorage[p]
    return
  setDebugger !!opts.debugger

  originalValue = null # remember it so that on <esc> we can detect if anything changed
  hll = null # currently highlighted line

  updateSize: -> cm.setSize $e.width(), $e.parent().height() - $e.position().top - 28
  open: (ee) ->
    originalValue = ee.text; cm.setValue ee.text; cm.focus()
    line = ee.currentRow; col = ee.currentColumn || 0
    cm.setCursor line, if line || col then col else cm.getLine(0).length
    cm.scrollIntoView null, $e.height() / 2
    for l in ee.lineAttributes?.stop then cm.setGutterMarker l, 'breakpoints', createBreakpointElement()
    return
  hasFocus: -> cm.hasFocus()
  focus: -> cm.focus()
  insert: (ch) -> (if !cm.getOption 'readOnly' then c = cm.getCursor(); cm.replaceRange ch, c, c, 'D'); return
  getValue: -> cm.getValue()
  getCursorIndex: -> cm.indexFromPos cm.getCursor()
  setValue: (x) -> cm.setValue x
  setCursorIndex: (i) -> cm.setCursor cm.posFromIndex i
  highlight: (l) ->
    if hll? then cm.removeLineClass hll, 'background', 'highlighted'
    if (hll = l)?
      cm.addLineClass (hll = l), 'background', 'highlighted'
      cm.setCursor l, 0; x = cm.cursorCoords true, 'local'; x.right = x.left; x.bottom = x.top + $e.height(); cm.scrollIntoView x
    return
  getHighlightedLine: -> hll
  setDebugger: setDebugger
  saved: (err) -> (if err then $.alert 'Cannot save changes' else opts.close?()); return
  getOpts: -> opts
  closePopup: -> (if opener then close()); return
  autocomplete: autocompletion cm, opts.autocomplete
  saveAndClose: EP
  die: -> cm.setOption 'readOnly', true; return
