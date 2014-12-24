Dyalog.Editor = (e, opts = {}) ->
  ($e = $ e).html '''
    <div class="toolbar debugger-toolbar">
      <a href="#" class="b-over         toolbar-button" title="Execute line"             ></a>
      <a href="#" class="b-into         toolbar-button" title="Trace into expression"    ></a>
      <a href="#" class="b-back         toolbar-button" title="Go back one line"         ></a>
      <a href="#" class="b-skip         toolbar-button" title="Skip current line"        ></a>
      <a href="#" class="b-cont-trace   toolbar-button" title="Continue trace"           ></a>
      <a href="#" class="b-cont-exec    toolbar-button" title="Continue execution"       ></a>
      <a href="#" class="b-restart      toolbar-button" title="Restart all threads"      ></a>
      <a href="#" class="b-edit-name    toolbar-button" title="Edit name"                ></a>
      <a href="#" class="b-quit         toolbar-button" title="Quit this function"       ></a>
      <a href="#" class="b-interrupt    toolbar-button" title="Interrupt"                ></a>
      <a href="#" class="b-cutback      toolbar-button" title="Clear trace/stop/monitor for this object"></a>
      <a href="#" class="b-line-numbers toolbar-button" title="Toggle line numbers"      ></a>
      <a href="#" class="separator"></a>
      <input class="search text-field">
      <a href="#" class="b-next         toolbar-button" title="Search for next match"    >▶</a>
      <a href="#" class="b-prev         toolbar-button" title="Search for previous match">◀</a>
      <a href="#" class="b-case         toolbar-button" title="Match case"               >aA</a>
    </div>
    <div class="toolbar editor-toolbar">
      <a href="#" class="b-line-numbers toolbar-button pressed" title="Toggle line numbers">[⋯]</a>
      <a href="#" class="b-comment      toolbar-button" title="Comment selected text"    >⍝</a>
      <a href="#" class="b-uncomment    toolbar-button" title="Uncomment selected text"  >/⍝</a>
      <a href="#" class="b-save         toolbar-button" title="Save changes and return"  >×</a>
      <a href="#" class="separator"></a>
      <input class="search text-field">
      <a href="#" class="b-next         toolbar-button" title="Search for next match"    >▶</a>
      <a href="#" class="b-prev         toolbar-button" title="Search for previous match">◀</a>
      <a href="#" class="b-case         toolbar-button" title="Match case"               >aA</a>
      <a class="separator"></a>
      <a href="#" class="b-refac-m      toolbar-button" title="Refactor text as method"  >+m</a>
      <a href="#" class="b-refac-f      toolbar-button" title="Refactor text as field"   >+f</a>
      <a href="#" class="b-refac-p      toolbar-button" title="Refactor text as property">+p</a>
    </div>
    <div class="cm"></div>
  '''

  cm = CodeMirror $e.find('.cm')[0],
    lineNumbers: !opts.debugger, fixedGutter: false, firstLineNumber: 0, lineNumberFormatter: (i) -> "[#{i}]"
    keyMap: 'dyalog', matchBrackets: true, autoCloseBrackets: true, gutters: ['breakpoints', 'CodeMirror-linenumbers']
    extraKeys:
      Tab: -> c = cm.getCursor(); opts.autocomplete? cm.getLine(c.line), c.ch
      Enter: -> if opts.debugger then opts.over?() else cm.execCommand 'newlineAndIndent'
      Esc: saveAndClose = ->
        bs = []
        for l of breakpoints then bs.push +l; cm.setGutterMarker +l, 'breakpoint', null
        opts.save? cm.getValue(), bs
        return
      'Shift-Esc': -> opts.close?()
      'Shift-Enter': -> opts.edit? cm.getValue(), cm.indexFromPos cm.getCursor()
      'Ctrl-Up': ->
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
  $('.toolbar-button', $tb) # todo
    .on 'mousedown', (e) -> $(e.target).addClass 'armed'; e.preventDefault(); return
    .on 'mouseup mouseout', (e) -> $(e.target).removeClass 'armed'; e.preventDefault(); return

  $('.b-over',       $tb).click -> opts.over?()
  $('.b-into',       $tb).click -> opts.into?()
  $('.b-back',       $tb).click -> opts.back?()
  $('.b-skip',       $tb).click -> opts.skip?()
  $('.b-cont-trace', $tb).click -> opts.continueTrace?()
  $('.b-cont-exec',  $tb).click -> opts.continueExec?()
  $('.b-restart',    $tb).click -> opts.restartThreads?()
  $('.b-edit-name',  $tb).click -> opts.edit? cm.getValue(), 0
  $('.b-interrupt',  $tb).click -> opts.interrupt?()
  $('.b-cutback',    $tb).click -> opts.cutback?()

  $('.b-line-numbers', $tb).click -> cm.setOption 'lineNumbers', b = !cm.getOption 'lineNumbers'; $(@).toggleClass 'pressed', b; false
  $('.b-save', $tb).click -> saveAndClose(); false

  $('.b-comment', $tb).click ->
    a = cm.listSelections()
    cm.replaceSelections cm.getSelections().map (s) -> s.replace(/^/gm, '⍝').replace /\n⍝$/, '\n'
    cm.setSelections a
    false

  $('.b-uncomment', $tb).click ->
    a = cm.listSelections()
    cm.replaceSelections cm.getSelections().map (s) -> s.replace /^⍝/gm, ''
    cm.setSelections a
    false

  $('.b-hid, .b-case', $tb).click -> $(@).toggleClass 'pressed'; false
  $('.b-next', $tb).click -> search(); false
  $('.b-prev', $tb).click -> search true; false
  $('.search', $tb).keydown (e) -> if e.which == 13 then search(); false
  search = (backwards) ->
    if q = $('.search:visible', $tb).val()
      v = cm.getValue()
      if !$('.b-case', $tb).hasClass 'pressed' then q = q.toLowerCase(); v = v.toLowerCase()
      i = cm.indexFromPos cm.getCursor()
      if backwards
        if (j = v[...i - 1].lastIndexOf q) < 0 then j = v.lastIndexOf q; wrapped = true
      else
        if (j = v[i..].indexOf q) >= 0 then j += i else j = v.indexOf q; wrapped = true
      if j < 0
        alert 'No Match'
      else
        if wrapped then alert 'Search wrapping'
        cm.setSelections [anchor: cm.posFromIndex(j), head: cm.posFromIndex j + q.length]
    false

  $('.b-refac-m', $tb).click ->
    if !/^\s*$/.test s = cm.getLine l = cm.getCursor().line
      cm.replaceRange "∇ #{s}\n\n∇", {line: l, ch: 0}, {line: l, ch: s.length}, 'Dyalog'
      cm.setCursor line: l + 1, ch: 0

  $('.b-refac-f', $tb).click ->
    if !/^\s*$/.test s = cm.getLine l = cm.getCursor().line
      cm.replaceRange ":field public #{s}", {line: l, ch: 0}, {line: l, ch: s.length}, 'Dyalog'
      cm.setCursor line: l + 1, ch: 0

  $('.b-refac-p', $tb).click ->
    if !/^\s*$/.test s = cm.getLine l = cm.getCursor().line
      cm.replaceRange ":Property #{s}\n\n∇r←get\nr←0\n∇\n\n∇set args\n∇\n:EndProperty", {line: l, ch: 0}, {line: l, ch: s.length}, 'Dyalog'
      cm.setCursor line: l + 1, ch: 0

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
  autocomplete: (skip, options) ->
    c = cm.getCursor()
    cm.showHint completeOnSingleClick: true, hint: ->
      list: options, from: {line: c.line, ch: c.ch - skip}, to: c
  getValue: -> cm.getValue()
  highlight: (l) ->
    if hll? then cm.removeLineClass hll, 'background', 'highlighted'
    cm.addLineClass (hll = l), 'background', 'highlighted'
    cm.setCursor l, 0; x = cm.cursorCoords true, 'local'; x.right = x.left; x.bottom = x.top + $e.height(); cm.scrollIntoView x
    return
  getContainer: -> $e
  setDebugger: setDebugger
  saved: (err) -> (if err then alert 'Cannot save changes' else opts.close?()); return
