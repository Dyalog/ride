Dyalog.Editor = (e, opts = {}) ->
  b = (name, description) -> "<a href='#' class='b-#{name} toolbar-button' title='#{description}'></a>"
  ($e = $ e).html """
    <div class="toolbar debugger-toolbar">
      #{[
        b 'over',         'Execute line'
        b 'into',         'Trace into expression'
        b 'back',         'Go back one line'
        b 'skip',         'Skip current line'
        b 'cont-trace',   'Continue trace'
        b 'cont-exec',    'Continue execution'
        b 'restart',      'Restart all threads'
        b 'edit-name',    'Edit name'
        b 'quit',         'Quit this function'
        b 'interrupt',    'Interrupt'
        b 'cutback',      'Clear trace/stop/monitor for this object'
        b 'line-numbers', 'Toggle line numbers'
        b 'over',         'Execute line'
        b 'into',         'Trace into expression'
        '<a href="#" class="separator"></a>'
        '<input class="search text-field">'
        b 'next',         'Search for next match'
        b 'prev',         'Search for previous match'
        b 'case',         'Match case'
      ].join ''}
    </div>
    <div class="toolbar editor-toolbar">
      #{[
        b 'line-numbers pressed', 'Toggle line numbers'
        b 'comment', 'Comment selected text'
        b 'uncomment', 'Uncomment selected text'
        b 'save', 'Save changes and return'
        '<a href="#" class="separator"></a>'
        '<input class="search text-field">'
        b 'next', 'Search for next match'
        b 'prev', 'Search for previous match'
        b 'case', 'Match case'
        '<a class="separator"></a>'
        b 'refac-m', 'Refactor text as method'
        b 'refac-f', 'Refactor text as field'
        b 'refac-p', 'Refactor text as property'
      ].join ''}
    </div>
    <div class="cm"></div>
  """
  b = null

  k = # extra keys for CodeMirror
    Tab: -> c = cm.getCursor(); opts.autocomplete? cm.getLine(c.line), c.ch; return
    F4: -> opts.pop?(); return
    Enter: -> (if opts.debugger then opts.over?() else cm.execCommand 'newlineAndIndent'); return
    'Ctrl-Enter': -> (if opts.debugger then opts.over?()); return

  k["'\uf800'"] = k['Shift-Esc'] = -> # QT: Quit (and lose changes)
    opts.close?()

  k["'\uf804'"] = k.Esc = saveAndClose = -> # EP: Exit (and save changes)
    bs = []
    for l of breakpoints then bs.push +l; cm.setGutterMarker +l, 'breakpoint', null
    opts.save? cm.getValue(), bs
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
        cm.replaceRange s, {line: l, ch: 0}, {line: l, ch: cm.getLine(l).length}, 'Dyalog'
    return

  cm = CodeMirror $e.find('.cm')[0],
    lineNumbers: !opts.debugger, fixedGutter: false, firstLineNumber: 0, lineNumberFormatter: (i) -> "[#{i}]"
    keyMap: 'dyalog', matchBrackets: true, autoCloseBrackets: true, gutters: ['breakpoints', 'CodeMirror-linenumbers']
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
    .on 'mousedown',        '.toolbar-button', (e) -> $(e.target).addClass    'armed'; e.preventDefault(); return
    .on 'mouseup mouseout', '.toolbar-button', (e) -> $(e.target).removeClass 'armed'; e.preventDefault(); return
    .on 'click', '.b-over',       -> opts.over?()
    .on 'click', '.b-into',       -> opts.into?()
    .on 'click', '.b-back',       -> opts.back?()
    .on 'click', '.b-skip',       -> opts.skip?()
    .on 'click', '.b-cont-trace', -> opts.continueTrace?()
    .on 'click', '.b-cont-exec',  -> opts.continueExec?()
    .on 'click', '.b-restart',    -> opts.restartThreads?()
    .on 'click', '.b-edit-name',  -> opts.edit? cm.getValue(), 0
    .on 'click', '.b-interrupt',  -> opts.interrupt?()
    .on 'click', '.b-cutback',    -> opts.cutback?()
    .on 'click', '.b-line-numbers', -> cm.setOption 'lineNumbers', b = !cm.getOption 'lineNumbers'; $(@).toggleClass 'pressed', b; false
    .on 'click', '.b-save', -> saveAndClose(); false
    .on 'click', '.b-comment', ->
      if cm.somethingSelected()
        a = cm.listSelections()
        cm.replaceSelections cm.getSelections().map (s) -> s.replace(/^/gm, '⍝').replace /\n⍝$/, '\n'
        cm.setSelections a
      else
        l = cm.getCursor().line; p = line: l, ch: 0; cm.replaceRange '⍝', p, p, 'Dyalog'; cm.setCursor line: l, ch: 1
      false
    .on 'click', '.b-uncomment', ->
      if cm.somethingSelected()
        a = cm.listSelections()
        cm.replaceSelections cm.getSelections().map (s) -> s.replace /^⍝/gm, ''
        cm.setSelections a
      else
        l = cm.getCursor().line; s = cm.getLine l
        cm.replaceRange s.replace(/^( *)⍝/, '$1'), {line: l, ch: 0}, {line: l, ch: s.length}, 'Dyalog'
        cm.setCursor line: l, ch: 0
      false
    .on 'click', '.b-hid, .b-case', -> $(@).toggleClass 'pressed'; false
    .on 'click', '.b-next', -> search(); false
    .on 'click', '.b-prev', -> search true; false
    .on 'keydown', '.search', 'enter', -> search(); false
    .on 'click', '.b-refac-m', ->
      if !/^\s*$/.test s = cm.getLine l = cm.getCursor().line
        cm.replaceRange "∇ #{s}\n\n∇", {line: l, ch: 0}, {line: l, ch: s.length}, 'Dyalog'
        cm.setCursor line: l + 1, ch: 0
    .on 'click', '.b-refac-f', ->
      if !/^\s*$/.test s = cm.getLine l = cm.getCursor().line
        cm.replaceRange ":field public #{s}", {line: l, ch: 0}, {line: l, ch: s.length}, 'Dyalog'
        cm.setCursor line: l + 1, ch: 0
    .on 'click', '.b-refac-p', ->
      if !/^\s*$/.test s = cm.getLine l = cm.getCursor().line
        cm.replaceRange ":Property #{s}\n\n∇r←get\nr←0\n∇\n\n∇set args\n∇\n:EndProperty", {line: l, ch: 0}, {line: l, ch: s.length}, 'Dyalog'
        cm.setCursor line: l + 1, ch: 0

  search = (backwards) ->
    if q = $('.search:visible', $tb).val()
      v = cm.getValue()
      if !$('.b-case', $tb).is '.pressed' then q = q.toLowerCase(); v = v.toLowerCase()
      i = cm.indexFromPos cm.getCursor()
      if backwards
        if (j = v[...i - 1].lastIndexOf q) < 0 then j = v.lastIndexOf q; wrapped = true
      else
        if (j = v[i..].indexOf q) >= 0 then j += i else j = v.indexOf q; wrapped = true
      if j < 0
        $.alert 'No Match', 'Dyalog APL Error'
      else
        if wrapped then $.alert 'Search wrapping', 'Dyalog APL Error'
        cm.setSelections [anchor: cm.posFromIndex(j), head: cm.posFromIndex j + q.length]
    false

  setDebugger = (x) ->
    opts.debugger = x
    $('.debugger-toolbar', $e).toggle x
    $('.editor-toolbar', $e).toggle !x
    cm.setOption 'readOnly', x
    $('.CodeMirror', $e).css backgroundColor: ['', '#dfdfdf'][+x]
  setDebugger !!opts.debugger

  hll = null # currently highlighted line

  updateSize: -> cm.setSize $e.width(), $e.parent().height() - $e.position().top - 28
  open: (ee) ->
    cm.setValue ee.text; cm.focus()
    cm.setCursor ee.currentRow, (ee.currentColumn || 0); cm.scrollIntoView null, $e.height() / 2
    for l in ee.lineAttributes?.stop then cm.setGutterMarker l, 'breakpoints', createBreakpointElement()
    return
  hasFocus: -> cm.hasFocus()
  focus: -> cm.focus()
  insert: (ch) -> c = cm.getCursor(); cm.replaceRange ch, c, c, 'Dyalog'
  getValue: -> cm.getValue()
  getCursorIndex: -> cm.indexFromPos cm.getCursor()
  setValue: (x) -> cm.setValue x
  setCursorIndex: (i) -> cm.setCursor cm.posFromIndex i
  highlight: (l) ->
    if hll? then cm.removeLineClass hll, 'background', 'highlighted'
    cm.addLineClass (hll = l), 'background', 'highlighted'
    cm.setCursor l, 0; x = cm.cursorCoords true, 'local'; x.right = x.left; x.bottom = x.top + $e.height(); cm.scrollIntoView x
    return
  setDebugger: setDebugger
  saved: (err) -> (if err then $.alert 'Cannot save changes' else opts.close?()); return
  getOpts: -> opts
  closePopup: -> (if opener then close()); return
  autocomplete: (skip, options) ->
    c = cm.getCursor(); from = line: c.line, ch: c.ch - skip
    cm.showHint
      completeOnSingleClick: true
      extraKeys: Right: (cm, m) -> m.pick()
      hint: ->
        to = cm.getCursor(); u = cm.getLine(from.line)[from.ch...to.ch].toLowerCase() # u: completion prefix
        {from, to, list: options.filter (o) -> o[...u.length].toLowerCase() == u}
    return
  saveAndClose: saveAndClose
