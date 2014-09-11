DyalogDebugger = (e, opts = {}) ->
  ($e = $ e).html '''
    <div class="toolbar">
      <span class="b-execute      button" title="Execute line"                            ></span>
      <span class="b-trace        button" title="Trace into expression"                   ></span>
      <span class="b-back         button" title="Go back one line"                        ></span>
      <span class="b-skip         button" title="Skip current line"                       ></span>
      <span class="b-cont-trace   button" title="Continue trace"                          ></span>
      <span class="b-cont-exec    button" title="Continue execution"                      ></span>
      <span class="b-restart      button" title="Restart all threads"                     ></span>
      <span class="b-edit-name    button" title="Edit name"                               ></span>
      <span class="b-quit         button" title="Quit this function"                      ></span>
      <span class="b-interrupt    button" title="Interrupt"                               ></span>
      <span class="b-clear-obj    button" title="Clear trace/stop/monitor for this object"></span>
      <span class="b-line-numbers button" title="Toggle line numbers"                     ></span>
      <span class="separator"></span>
      <input class="search">
      <span class="b-next         button" title="Search for next match"    >▶</span>
      <span class="b-prev         button" title="Search for previous match">◀</span>
      <span class="b-hid          button" title="Search for hidden text"   >⊞</span>
      <span class="b-case         button" title="Match case"               >aA</span>
      <span class="separator"></span>
      <select class="stack">
        <option>[1]</option>
        <option>[2]</option>
        <option>[3]</option>
      </select>
    </div>
    <div class="debugger-cm"></div>
  '''

  cm = CodeMirror $e.find('.debugger-cm')[0],
    lineNumbers: true
    firstLineNumber: 0
    lineNumberFormatter: (i) -> "[#{i}]"
    extraKeys:
      'Esc': saveAndCloseDebugger = -> opts.save?(cm.getValue()); opts.close?()
      'Shift-Esc': closeDebugger = -> opts.close?()
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

  $tb = $ '.toolbar', $e
  $('.button', $tb) # todo
    .on('mousedown', (e) -> $(e.target).addClass 'armed'; e.preventDefault(); return)
    .on('mouseup mouseout', (e) -> $(e.target).removeClass 'armed'; e.preventDefault(); return)

  $('.b-line-numbers', $tb).click -> cm.setOption 'lineNumbers', b = !cm.getOption 'lineNumbers'; $(@).toggleClass 'pressed', !b; false
  $('.b-save', $tb).click -> saveAndCloseDebugger(); false

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

  updateSize: -> cm.setSize $e.width(), $e.height()
  open: (name, text) -> cm.setValue text; cm.setCursor 0, cm.getLine(0).length; cm.focus()
  hasFocus: -> cm.hasFocus()
  focus: -> cm.focus()
  insert: (ch) -> c = cm.getCursor(); cm.replaceRange ch, c, c, 'Dyalog'
  getValue: -> cm.getValue()
