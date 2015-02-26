autocompletion = require './autocompletion'
module.exports = (e, opts = {}) ->
  b = (cssClasses, description) -> "<a href='#' class='#{cssClasses} tb-button' title='#{description}'></a>"
  ($e = $ e).html """
    <div class="toolbar debugger-toolbar">
      #{[ # the first two buttons are placed on the right-hand side through CSS; in a floating window they are hidden
        b 'tb-EP  last',    'Quit this function'
        b 'tb-pop first',     'Edit in a floating window'
        b 'tb-ER  first',    'Execute line'
        b 'tb-TC',           'Trace into expression'
        b 'tb-BK',           'Go back one line'
        b 'tb-FD',           'Skip current line'
        b 'tb-BH',           'Continue trace'
        b 'tb-RM',           'Continue execution'
        b 'tb-MA',           'Restart all threads'
        b 'tb-ED',           'Edit name'
        b 'tb-WI',           'Interrupt'
        b 'tb-CBP',          'Clear trace/stop/monitor for this object'
        b 'tb-LN  last',     'Toggle line numbers'
        '<span class="tb-separator"></span>'
        '<input class="tb-search text-field">'
        b 'tb-NX first',     'Search for next match'
        b 'tb-PV',           'Search for previous match'
        b 'tb-case last',    'Match case'
      ].join ''}
    </div>
    <div class="toolbar editor-toolbar">
      #{[
        b 'tb-EP  last',    'Save changes and return'
        b 'tb-pop first',     'Edit in a floating window'
        b 'tb-LN  first',    'Toggle line numbers'
        b 'tb-AO',           'Comment selected text'
        b 'tb-DO  last',     'Uncomment selected text'
        '<span class="tb-separator"></span>'
        '<input class="tb-search text-field">'
        b 'tb-NX  first',    'Search for next match'
        b 'tb-PV',           'Search for previous match'
        b 'tb-case last',    'Match case'
        '<span class="tb-separator"></span>'
        b 'tb-refac-m first','Refactor text as method'
        b 'tb-refac-f',      'Refactor text as field'
        b 'tb-refac-p last', 'Refactor text as property'
      ].join ''}
    </div>
    <div class="cm"></div>
  """
  b = null

  cm = CodeMirror $e.find('.cm')[0],
    fixedGutter: false, firstLineNumber: 0, lineNumberFormatter: (i) -> "[#{i}]"
    keyMap: 'dyalog', matchBrackets: true, autoCloseBrackets: {pairs: '()[]{}', explode: '{}'}
    gutters: ['breakpoints', 'CodeMirror-linenumbers']
    extraKeys:
      Tab: -> c = cm.getCursor(); opts.autocomplete? cm.getLine(c.line), c.ch; return
      Down: ->
        l = cm.getCursor().line
        if l == cm.lineCount() - 1 && cm.getLine l
          cm.execCommand 'goDocEnd'; cm.execCommand 'newlineAndIndent'
        else
          cm.execCommand 'goLineDown'
        return
  cm.dyalogCommands =
    ED: -> opts.edit? cm.getValue(), cm.indexFromPos cm.getCursor(); return # Edit
    QT: -> opts.close?(); return # Quit (and lose changes)
    BK: opts.back # Backward or Undo
    FD: opts.skip # Forward or Redo
    SC: -> $tb.find('.tb-search:visible').focus(); return # Search
    EP: -> # Exit (and save changes)
      if (v = cm.getValue()) != originalValue
        bs = []; for l of breakpoints then bs.push +l; cm.setGutterMarker +l, 'breakpoint', null
        opts.save? cm.getValue(), bs
      else
        opts.close?()
      return
    TL: -> # Toggle Localisation
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
    LN: -> # Toggle Line Numbers
      p = if opts.debugger then 'lineNumbersInDebugger' else 'lineNumbersInEditor'
      localStorage[p] = 1 - (localStorage[p] || 0); flag = !!+localStorage[p]
      cm.setOption 'lineNumbers', flag; $tb.find('.tb-LN:visible').toggleClass 'pressed', flag; return
    PV: -> search true; return # Previous
    NX: -> search(); return # Next
    TC: opts.into # Trace
    AC: -> # Align Comments (currently inaccessible)
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
    AO: -> # Add Comment
      if cm.somethingSelected()
        a = cm.listSelections()
        cm.replaceSelections cm.getSelections().map (s) -> s.replace(/^/gm, '⍝').replace /\n⍝$/, '\n'
        cm.setSelections a
      else
        l = cm.getCursor().line; p = line: l, ch: 0; cm.replaceRange '⍝', p, p, 'D'; cm.setCursor line: l, ch: 1
      return
    DO: -> # Delete Comment
      if cm.somethingSelected()
        a = cm.listSelections()
        cm.replaceSelections cm.getSelections().map (s) -> s.replace /^⍝/gm, ''
        cm.setSelections a
      else
        l = cm.getCursor().line; s = cm.getLine l
        cm.replaceRange s.replace(/^( *)⍝/, '$1'), {line: l, ch: 0}, {line: l, ch: s.length}, 'D'
        cm.setCursor line: l, ch: 0
      return
    WI: opts.weakInterrupt
    ER: -> (if opts.debugger then opts.over?() else cm.execCommand 'newlineAndIndent'); return
    BH: opts.continueTrace # Run to exit (in tracer)
    RM: opts.continueExec # Resume execution (in tracer)
    MA: opts.restartThreads # Resume all threads (in tracer)
    CBP: opts.cutback
  ###
      F6 = -> opts.openInExternalEditor? cm.getValue(), cm.getCursor().line, (err, text) ->
        if err then $.alert '' + err, 'Error' else c = cm.getCursor().line; cm.setValue text; cm.setCursor c
        return
  ###

  createBreakpointElement = -> $('<div class="breakpoint">●</div>')[0]
  breakpoints = {}
  cm.on 'gutterClick', (cm, l) ->
    if breakpoints[l] then delete breakpoints[l]; cm.setGutterMarker l, 'breakpoints', null
    else breakpoints[l] = 1; cm.setGutterMarker l, 'breakpoints', createBreakpointElement()
    return

  $tb = $ '.toolbar', $e
    .on 'mousedown',        '.tb-button', (e) -> $(e.target).addClass    'armed'; e.preventDefault(); return
    .on 'mouseup mouseout', '.tb-button', (e) -> $(e.target).removeClass 'armed'; e.preventDefault(); return
    .on 'click',            '.tb-button', (e) ->
      for c in $(e.target).prop('class').split /\s+/ when m = /^tb-([A-Z]{2})$/.exec c then cm.execCommand m[1]; break
      return
    .on 'click', '.tb-pop', -> opts.pop?(); false
    .on 'click', '.tb-hid, .tb-case', -> $(@).toggleClass 'pressed'; highlightSearch(); false
    .on 'keydown', '.tb-search', 'return',       -> cm.execCommand 'NX'; false
    .on 'keydown', '.tb-search', 'shift+return', -> cm.execCommand 'PV'; false
    .on 'keydown', '.tb-search', 'esc', -> clearSearch(); cm.focus(); false
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

  lastQuery = lastIC = overlay = annotation = null
  clearSearch = -> cm.removeOverlay overlay; overlay = null; annotation?.clear(); annotation = null; return
  highlightSearch = ->
    window.cm = cm
    ic = !$('.tb-case:visible', $tb).hasClass 'pressed' # ic: ignore case (like in vim)
    q = $('.tb-search:visible', $tb).val(); if ic then q = q.toLowerCase() # q: the query string
    if lastQuery != q || lastIC != ic
      lastQuery = q; lastIC = ic; clearSearch()
      if q
        annotation = cm.showMatchesOnScrollbar q, ic
        cm.addOverlay overlay = token: (stream) ->
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
        cm.setSelection cm.posFromIndex(j), cm.posFromIndex j + q.length; scrollCursorIntoProminentView()
    false

  setDebugger = (x) ->
    opts.debugger = x; $('.debugger-toolbar', $e).toggle x; $('.editor-toolbar', $e).toggle !x
    cm.setOption 'readOnly', x; $('.CodeMirror', $e).toggleClass 'debugger', x
    p = if x then 'lineNumbersInDebugger' else 'lineNumbersInEditor'
    localStorage[p] ?= +!x; cm.setOption 'lineNumbers', !!+localStorage[p]
    $tb.find('.tb-LN:visible').toggleClass 'pressed', !!+localStorage[p]
    return
  setDebugger !!opts.debugger

  scrollCursorIntoProminentView = -> # approximately to 1/3 of editor height; this might not work near the top or bottom
    h = $e.height(); {left, top} = cm.cursorCoords true, 'local'
    cm.scrollIntoView left: left, right: left, top: top - h / 3, bottom: top + 2 * h / 3
    return

  originalValue = null # remember it so that on <esc> we can detect if anything changed
  hll = null # currently highlighted line

  updateSize: -> cm.setSize $e.width(), $e.parent().height() - $e.position().top - 28
  open: (ee) ->
    originalValue = ee.text; cm.setValue ee.text; cm.focus()
    line = ee.currentRow; col = ee.currentColumn || 0
    if line == col == 0 && ee.text.indexOf('\n') < 0 then col = ee.text.length
    cm.setCursor line, col; cm.scrollIntoView null, $e.height() / 2
    for l in ee.lineAttributes?.stop then cm.setGutterMarker l, 'breakpoints', createBreakpointElement()
    if opener then $('title').text ee.name
    return
  hasFocus: -> cm.hasFocus()
  focus: -> cm.focus()
  insert: (ch) -> (if !cm.getOption 'readOnly' then c = cm.getCursor(); cm.replaceRange ch, c, c); return
  getValue: -> cm.getValue()
  getCursorIndex: -> cm.indexFromPos cm.getCursor()
  setValue: (x) -> cm.setValue x
  setCursorIndex: (i) -> cm.setCursor cm.posFromIndex i
  highlight: (l) ->
    if hll? then cm.removeLineClass hll, 'background', 'highlighted'
    if (hll = l)? then cm.addLineClass l, 'background', 'highlighted'; cm.setCursor l, 0; scrollCursorIntoProminentView()
    return
  getHighlightedLine: -> hll
  setDebugger: setDebugger
  saved: (err) -> (if err then $.alert 'Cannot save changes' else opts.close?()); return
  getOpts: -> opts
  closePopup: -> (if opener then close()); return
  autocomplete: autocompletion cm, opts.autocomplete
  saveAndClose: -> cm.execCommand 'EP'; return
  die: -> cm.setOption 'readOnly', true; return
