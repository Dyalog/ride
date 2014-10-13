Dyalog.Editor = (e, opts = {}) ->
  ($e = $ e).html(
    if opts.debugger
      '''
        <div class="toolbar">
          <span class="b-over         button" title="Execute line"                            ></span>
          <span class="b-into         button" title="Trace into expression"                   ></span>
          <span class="b-back         button" title="Go back one line"                        ></span>
          <span class="b-skip         button" title="Skip current line"                       ></span>
          <span class="b-cont-trace   button" title="Continue trace"                          ></span>
          <span class="b-cont-exec    button" title="Continue execution"                      ></span>
          <span class="b-restart      button" title="Restart all threads"                     ></span>
          <span class="b-edit-name    button" title="Edit name"                               ></span>
          <span class="b-quit         button" title="Quit this function"                      ></span>
          <span class="b-interrupt    button" title="Interrupt"                               ></span>
          <span class="b-cutback      button" title="Clear trace/stop/monitor for this object"></span>
          <span class="b-line-numbers button" title="Toggle line numbers"                     ></span>
          <span class="separator"></span>
          <input class="search">
          <span class="b-next         button" title="Search for next match"    >▶</span>
          <span class="b-prev         button" title="Search for previous match">◀</span>
          <!--<span class="b-hid          button" title="Search for hidden text"   >⊞</span>-->
          <span class="b-case         button" title="Match case"               >aA</span>
          <span class="separator"></span>
          <select class="stack">
            <option>[1]</option>
            <option>[2]</option>
            <option>[3]</option>
          </select>
        </div>
        <div class="cm"></div>
      '''
    else
      '''
        <div class="toolbar">
          <span class="b-line-numbers button pressed" title="Toggle line numbers"      >[⋯]</span>
          <span class="b-comment      button" title="Comment selected text"    >⍝</span>
          <span class="b-uncomment    button" title="Uncomment selected text"  >/⍝</span>
          <span class="b-save         button" title="Save changes and return"  >×</span>
          <span class="separator"></span>
          <input class="search">
          <span class="b-next         button" title="Search for next match"    >▶</span>
          <span class="b-prev         button" title="Search for previous match">◀</span>
          <!--<span class="b-hid          button" title="Search for hidden text"   >⊞</span>-->
          <span class="b-case         button" title="Match case"               >aA</span>
          <span class="separator"></span>
          <span class="b-refac-m      button" title="Refactor text as method"  >+m</span>
          <span class="b-refac-f      button" title="Refactor text as field"   >+f</span>
          <span class="b-refac-p      button" title="Refactor text as property">+p</span>
        </div>
        <div class="cm"></div>
      '''
  )

  cm = CodeMirror $e.find('.cm')[0],
    lineNumbers: true
    firstLineNumber: 0
    lineNumberFormatter: (i) -> "[#{i}]"
    readOnly: !!opts.debugger
    matchBrackets: true
    autoCloseBrackets: true
    gutters: ['breakpoints', 'CodeMirror-linenumbers']
    keyMap: 'dyalog'
    extraKeys:
      Tab: -> c = cm.getCursor(); opts.autocomplete? cm.getLine(c.line), c.ch
      Enter: -> if opts.debugger then opts.over?() else cm.execCommand 'newlineAndIndent'
      Esc: saveAndClose = ->
        bs = []
        for l of breakpoints then bs.push +l; cm.setGutterMarker +l, 'breakpoint', null
        opts.save? cm.getValue(), bs
        opts.close?()
        return
      'Shift-Esc': -> opts.close?()
      'Ctrl-Up': ->
        c = cm.getCursor()
        s = cm.getLine c.line
        r = '[A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ0-9]*' # regex fragment to match identifiers
        name = ((///⎕?#{r}$///.exec(s[...c.ch])?[0] ? '') +
                (///^#{r}///.exec(s[c.ch..])?[0] ? ''))
                  .replace /^\d+/, ''
        if name and name[0] != '⎕'
          h = cm.getLine 0 # header line
          h1 = h.replace ///;#{name}(;|$)///, '$1'
          cm.replaceRange (if h == h1 then h1 += ';' + name else h1),
            {line: 0, ch: 0}, {line: 0, ch: h.length}, 'Dyalog'

  setTimeout (-> cm.setOption 'lineNumbers', !opts.debugger), 1

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
  $('.button', $tb) # todo
    .on('mousedown', (e) -> $(e.target).addClass 'armed'; e.preventDefault(); return)
    .on('mouseup mouseout', (e) -> $(e.target).removeClass 'armed'; e.preventDefault(); return)

  $('.b-over',       $tb).click -> opts.over?()
  $('.b-into',       $tb).click -> opts.into?()
  $('.b-back',       $tb).click -> opts.back?()
  $('.b-skip',       $tb).click -> opts.skip?()
  $('.b-cont-trace', $tb).click -> opts.continueTrace?()
  $('.b-cont-exec',  $tb).click -> opts.continueExec?()
  $('.b-restart',    $tb).click -> opts.restartThreads?()
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
    if q = $('.search', $tb).val()
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

  hll = null # currently highlighted line

  updateSize: -> cm.setSize $e.width(), $e.height()
  open: (name, text, bs) ->
    cm.setValue text
    cm.setCursor 0, cm.getLine(0).length
    cm.focus()
    for l in bs then cm.setGutterMarker l, 'breakpoints', createBreakpointElement()
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
    return
