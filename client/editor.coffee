require './codemirror-apl-mode'
autocompletion = require './autocompletion'
prefs = require './prefs'
{letter} = require './codemirror-apl-mode'
{onCodeMirrorDoubleClick, delay, spc} = require './util'

@ACB_VALUE = ACB_VALUE = pairs: '()[]{}', explode: '{}' # value for CodeMirror's "autoCloseBrackets" option when on

EDITOR_HTML = do ->
  b = (cssClasses, title) -> "<a href=# class='#{cssClasses} tb-button' title='#{title}'></a>"
  """
    <div class=toolbar>
      #{[
        # The first button is placed on the right-hand side through CSS.  In a floating window it is hidden.
        # CSS classes "first" and "last" indicate button grouping.

        b 'tb-EP  tracer-only first last', 'Quit this function'
        b 'tb-ER  tracer-only first     ', 'Execute line'
        b 'tb-TC  tracer-only',            'Trace into expression'
        b 'tb-BK  tracer-only',            'Go back one line'
        b 'tb-FD  tracer-only',            'Skip current line'
        b 'tb-BH  tracer-only',            'Continue trace'
        b 'tb-RM  tracer-only',            'Continue execution'
        b 'tb-MA  tracer-only',            'Restart all threads'
        b 'tb-ED  tracer-only',            'Edit name'
        b 'tb-WI  tracer-only',            'Interrupt'
        b 'tb-CBP tracer-only',            'Clear trace/stop/monitor for this object'
        b 'tb-LN  tracer-only last',       'Toggle line numbers'

        b 'tb-EP  editor-only first last', 'Save changes and return'
        b 'tb-LN  editor-only first',      'Toggle line numbers'
        b 'tb-AO  editor-only',            'Comment selected text'
        b 'tb-DO  editor-only last',       'Uncomment selected text'

        '<span class=tb-separator></span>'
        '<div class="tb-sc text-field"></div>'
        '<div class="tb-rp text-field editor-only"></div>'
        b 'tb-NX first',      'Search for next match'
        b 'tb-PV',            'Search for previous match'
        b 'tb-case last',     'Match case'
      ].join ''}
    </div>
    <div class=ride-win></div>
  """

class @Editor
  constructor: (@ide, e, opts) ->
    @$e = $(e).html EDITOR_HTML
    {@id, @name, @emit} = @opts = opts; @isTracer = opts.tracer
    @xline = null # the line number of the empty line inserted when cursor is at eof and you press <down>
    @bp = [] # breakpoints, an array of line numbers
    @otext = @obp = '' # remember original text and bp to avoid pointless saving on EP; obp is comma-separated line numbers
    @hll = null # highlighted line -- currently executed line in tracer
    @lastQuery = @lastIC = @overlay = @annotation = null # search-related state
    @focusTimestamp = 0
    @cm = new CodeMirror @$e.find('.ride-win')[0],
      lineNumbers: !!if @isTracer then prefs.lineNumsTracer() else prefs.lineNumsEditor()
      firstLineNumber: 0, lineNumberFormatter: (i) -> "[#{i}]"
      smartIndent: prefs.indent() >= 0, indentUnit: prefs.indent(), scrollButtonHeight: 12, matchBrackets: true
      autoCloseBrackets: !!prefs.autoCloseBrackets() && ACB_VALUE
      foldGutter: true, gutters: ['breakpoints', 'CodeMirror-linenumbers', 'CodeMirror-foldgutter']
      keyMap: 'dyalog', extraKeys: {'Shift-Tab': 'indentLess', Tab: 'tabOrAutocomplete', Down: 'downOrXline'}
      # Some options of @cm can be set from ide.coffee when the corresponding pref changes.
    @cm.dyalogCommands = @
    @cm.on 'cursorActivity', @cursorActivity.bind @
    @cm.on 'gutterClick', (cm, l, gutter, event) =>
      if gutter in ['breakpoints', 'CodeMirror-linenumbers'] then @cm.setCursor line: l, ch: 0; @BP()
      return
    @cm.on 'focus', => @focusTimestamp = +new Date; @ide.focusedWin = @; return
    onCodeMirrorDoubleClick @cm, (e) => @ED(); e.preventDefault(); e.stopPropagation(); return
    @autocomplete = autocompletion.setUp @
    @$tb = $ '.toolbar', @$e
      .on 'click', '.tb-hid,.tb-case', (e) => $(e.target).toggleClass 'pressed'; @highlightSearch(); false
      .on 'mousedown',        '.tb-button', (e) -> $(e.target).addClass    'armed'; e.preventDefault(); return
      .on 'mouseup mouseout', '.tb-button', (e) -> $(e.target).removeClass 'armed'; e.preventDefault(); return
      .on 'click',            '.tb-button', (e) =>
        for c in $(e.target).prop('class').split /\s+/ when m = /^tb-([A-Z]{2,3})$/.exec c then @[m[1]](); break
        return
    @cmSC = new CodeMirror @$tb.find('.tb-sc')[0], placeholder: 'Search', extraKeys:
      Enter: => @NX(); return
      'Shift-Enter': => @PV(); return
      'Ctrl-Enter': => @selectAllSearchResults(); return
      Tab: => (if @isTracer then @cm else @cmRP).focus(); return
      'Shift-Tab': => @cm.focus(); return
    @cmSC.on 'change', => @highlightSearch(); return
    @cmRP = new CodeMirror @$tb.find('.tb-rp')[0], placeholder: 'Replace', extraKeys:
      Enter: => @replace(); return
      'Shift-Enter': => @replace true; return
      Tab: => @cm.focus(); return
      'Shift-Tab': => (if @isTracer then @cm else @cmSC).focus(); return
    for cmx in [@cmSC, @cmRP]
      cmx.setOption 'keyMap', 'dyalog'
      cmx.setOption 'scrollbarStyle', 'null'
      cmx.addKeyMap
        Down: => @NX(); return
        Up: => @PV(); return
        Esc: => @clearSearch(); delay 0, @cm.focus.bind @cm; return
    @setTracer !!@isTracer
    return

  createBreakpointElement: ->
    bp = @$e[0].ownerDocument.createElement 'div'; bp.setAttribute 'class', 'breakpoint'; bp.innerHTML = '●'; bp

  cursorActivity: ->
    if @xline != null
      n = @cm.lineCount(); l = @cm.getCursor().line
      if l != @xline || l != n - 1 || !/^\s*$/.test @cm.getLine n - 1
        if l < @xline && @xline == n - 1 && /^\s*$/.test @cm.getLine n - 1
          @cm.replaceRange '', {line: n - 2, ch: @cm.getLine(n - 2).length}, {line: n - 1, ch: 0}, 'D'
        @xline = null
    return

  scrollCursorIntoProminentView: -> # approximately to 1/3 of editor height; this might not work near the top or bottom
    h = @$e.height(); {left, top} = @cm.cursorCoords true, 'local'
    @cm.scrollIntoView left: left, right: left, top: top - h / 3, bottom: top + 2 * h / 3; return

  # Search-related functions:
  clearSearch: ->
    $('.ride-win .CodeMirror-vscrollbar', @$e).prop 'title', ''
    $('.tb-sc', @$tb).removeClass 'no-matches'
    @cm.removeOverlay @overlay; @annotation?.clear(); @overlay = @annotation = null; return

  highlightSearch: ->
    ic = !$('.tb-case', @$tb).hasClass 'pressed' # ic: ignore case (like in vim)
    q = @cmSC.getValue(); ic && q = q.toLowerCase() # q: the query string
    if @lastQuery != q || @lastIC != ic
      @lastQuery = q; @lastIC = ic; @clearSearch()
      if q
        s = @cm.getValue(); ic && s = s.toLowerCase()
        $('.tb-sc', @$tb).toggleClass 'no-matches', -1 == s.indexOf q
        @annotation = @cm.showMatchesOnScrollbar q, ic
        @cm.addOverlay @overlay = token: (stream) ->
          s = stream.string[stream.pos..]; ic && s = s.toLowerCase()
          i = s.indexOf q
          if !i then         stream.pos += q.length; 'searching'
          else if i > 0 then stream.pos += i;        return
          else               stream.skipToEnd();     return
        $('.CodeMirror-vscrollbar', @$e).prop 'title', 'Lines on scroll bar show match locations'
    [q, ic]

  search: (backwards) ->
    [q, ic] = @highlightSearch()
    if q
      s = @cm.getValue(); ic && s = s.toLowerCase()
      if backwards
        i = @cm.indexFromPos @cm.getCursor 'anchor'
        j = s[...i].lastIndexOf q; if j < 0 then j = s[i..].lastIndexOf q; if j >= 0 then j += i
      else
        i = @cm.indexFromPos @cm.getCursor()
        j = s[i..].indexOf q; if j >= 0 then j += i else j = s[...i].indexOf q
      if j >= 0
        @cm.setSelection @cm.posFromIndex(j), @cm.posFromIndex j + q.length; @scrollCursorIntoProminentView()
    false

  selectAllSearchResults: ->
    ic = !$('.tb-case', @$tb).hasClass 'pressed' # ic: ignore case (like in vim)
    q = @cmSC.getValue(); ic && q = q.toLowerCase() # q: the query string
    if q
      s = @cm.getValue(); ic && s = s.toLowerCase()
      selections = []; i = 0
      while (i = s.indexOf q, i) >= 0 then selections.push anchor: @cm.posFromIndex(i), head: @cm.posFromIndex i + q.length; i++
      if selections.length then @cm.setSelections selections
    @cm.focus()
    return

  replace: (backwards) -> # replace current occurrence and find next
    ic = !$('.tb-case', @$tb).hasClass 'pressed' # ic: ignore case (like in vim)
    q = @cmSC.getValue(); ic && q = q.toLowerCase() # q: the query string
    s = @cm.getSelection(); ic && s = s.toLowerCase()
    if s == q then @cm.replaceSelection @cmRP.getValue(), if backwards then 'start' else 'end'
    @search backwards
    v = @cm.getValue(); ic && v = v.toLowerCase()
    $('.tb-sc', @$tb).toggleClass 'no-matches', -1 == v.indexOf q
    return

  highlight: (l) -> # current line in tracer
    if @hll? then @cm.removeLineClass @hll, 'background', 'highlighted'
    if (@hll = l)? then @cm.addLineClass l, 'background', 'highlighted'; @cm.setCursor l, 0; @scrollCursorIntoProminentView()
    return

  setTracer: (x) ->
    @isTracer = x; @$e.toggleClass 'tracer', x; @highlight null
    ln = !!if @isTracer then prefs.lineNumsTracer() else prefs.lineNumsEditor()
    @cm.setOption 'lineNumbers', ln; @$tb.find('.tb-LN').toggleClass 'pressed', ln
    @cm.setOption 'readOnly', !!x
    return

  setReadOnly: (x) -> @cm.setOption 'readOnly', x; return

  updateSize: -> @cm.setSize @$e.width(), @$e.parent().height() - @$e.position().top - 28; return

  open: (ee) ->
    @cm.setValue @otext = ee.text; @cm.clearHistory(); @cm.focus()
    # Constants for entityType:
    # DefinedFunction     1
    # SimpleCharArray     2
    # SimpleNumericArray  3
    # MixedSimpleArray    4
    # NestedArray         5
    # QuadORObject        6
    # NativeFile          7
    # SimpleCharVector    8
    # AplNamespace        9
    # AplClass           10
    # AplInterface       11
    # AplSession         12
    # ExternalFunction   13
    @cm.setOption 'mode', if ee.entityType in [1, 9, 10, 11, 12, 13] then 'apl' else 'text'
    @cm.setOption 'readOnly', ee.readOnly || ee.debugger
    line = ee.currentRow; col = ee.currentColumn || 0; if line == col == 0 && ee.text.indexOf('\n') < 0 then col = ee.text.length
    @cm.setCursor line, col; @cm.scrollIntoView null, @$e.height() / 2
    @bp = ee.lineAttributes.stop[..]
    for l in @bp then @cm.setGutterMarker l, 'breakpoints', @createBreakpointElement()
    @obp = @bp.join()
    if D.floating then $('title', @$e[0].ownerDocument).text ee.name
    return
  hasFocus: -> window.focused && @cm.hasFocus()
  focus: -> (if !window.focused then window.focus()); @cm.focus(); return
  insert: (ch) -> @cm.getOption('readOnly') || @cm.replaceSelection ch; return
  saved: (err) -> (if err then $.alert 'Cannot save changes' else @emit 'CloseWindow', win: @id); return
  closePopup: -> (if D.floating then window.onbeforeunload = null; D.forceClose = 1; close()); return
  die: -> @cm.setOption 'readOnly', true; return
  getDocument: -> @$e[0].ownerDocument
  refresh: -> @cm.refresh(); return
  cword: -> # APL identifier under cursor
    c = @cm.getCursor(); s = @cm.getLine c.line; r = "[#{letter}0-9]*" # r: regex fragment to match identifiers
    ((///⎕?#{r}$///.exec(s[...c.ch])?[0] or '') + (///^#{r}///.exec(s[c.ch..])?[0] or '')).replace /^\d+/, ''

  # Commands:
  ED: -> @emit 'Edit', win: @id, text: @cm.getValue(), pos: @cm.indexFromPos @cm.getCursor(); return
  QT: -> @emit 'CloseWindow', win: @id; return
  BK: -> (if @isTracer then @emit 'TraceBackward', win: @id else @cm.execCommand 'undo'); return
  FD: -> (if @isTracer then @emit 'TraceForward',  win: @id else @cm.execCommand 'redo'); return
  SC: ->
    v = @cm.getSelection(); if v && '\n' !in v then @cmSC.setValue v
    @cmSC.focus(); @cmSC.execCommand 'selectAll'; return
  RP: ->
    v = @cm.getSelection() || @cword(); if v && '\n' !in v then @cmSC.setValue v; @cmRP.setValue v
    @cmRP.focus(); @cmRP.execCommand 'selectAll'; @highlightSearch(); return
  EP: ->
    v = @cm.getValue()
    if v != @otext || @bp.join() != @obp
      for l in @bp then @cm.setGutterMarker l, 'breakpoints', null
      @emit 'SaveChanges', win: @id, text: @cm.getValue(), attributes: stop: @bp[..].sort (x, y) -> x - y
    else
      @emit 'CloseWindow', win: @id
    return
  TL: -> # Toggle Localisation
    if name = @cword()
      # search backwards for a line that looks like a tradfn header (though in theory it might be a dfns's recursive call)
      l = l0 = @cm.getCursor().line; while l >= 0 && !/^\s*∇\s*\S/.test @cm.getLine l then l--
      if l < 0 and !/\{\s*$/.test @cm.getLine(0).replace /⍝.*/, '' then l = 0
      if l >= 0 && l != l0
        [_, s, comment] = /([^⍝]*)(.*)/.exec @cm.getLine l
        [head, tail...] = s.split ';'; head = head.replace /\s+$/, ''; tail = tail.map (x) -> x.replace /\s+/g, ''
        i = tail.indexOf name; if i < 0 then tail.push name else tail.splice i, 1
        s = [head].concat(tail.sort()).join(';') + if comment then ' ' + comment else ''
        @cm.replaceRange s, {line: l, ch: 0}, {line: l, ch: @cm.getLine(l).length}, 'D'
    return
  LN: -> # Toggle Line Numbers
    v = !!if @isTracer then prefs.lineNumsTracer.toggle() else prefs.lineNumsEditor.toggle()
    @cm.setOption 'lineNumbers', v; @$tb.find('.tb-LN').toggleClass 'pressed', v; return
  PV: -> @search true; return
  NX: -> @search(); return
  TC: -> @emit 'StepInto', win: @id; return
  AC: -> # Align Comments
    o = @cm.listSelections() # original selections
    sels = if @cm.somethingSelected() then o else
      ll = @cm.lastLine(); [anchor: {line: 0, ch: 0}, head: {line: ll, ch: @cm.getLine(ll).length}]
    a = sels.map (sel) => # info about each individual selection
      p = sel.anchor; q = sel.head; if (p.line - q.line || p.ch - q.ch) > 0 then [p, q] = [q, p]
      l = @cm.getRange({line: p.line, ch: 0}, q, '\n').split '\n' # lines
      u = l.map (x) -> x.replace /'[^']*'?/g, (y) -> spc y.length # lines with scrubbed string literals
      c = u.map (x) -> x.indexOf '⍝' # column index of the '⍝'
      {p, q, l, u, c}
    m = Math.max (a.map (sel) -> Math.max sel.c...)...
    a.forEach (sel) =>
      r = sel.l.map (x, i) -> ci = sel.c[i]; if ci < 0 then x else x[...ci] + spc(m - ci) + x[ci..]
      r[0] = r[0][sel.p.ch..]; @cm.replaceRange r.join('\n'), sel.p, sel.q, 'D'; return
    @cm.setSelections o
    return
  AO: -> # Add Comment
    if @cm.somethingSelected()
      a = @cm.listSelections()
      @cm.replaceSelections @cm.getSelections().map (s) -> s.replace(/^/gm, '⍝').replace /\n⍝$/, '\n'
      # correct selection ends for inserted characters:
      for r in a when d = r.head.line - r.anchor.line || r.head.ch - r.anchor.ch
        (if d > 0 then r.head else r.anchor).ch++
      @cm.setSelections a
    else
      l = @cm.getCursor().line; p = line: l, ch: 0; @cm.replaceRange '⍝', p, p, 'D'; @cm.setCursor line: l, ch: 1
    return
  DO: -> # Delete Comment
    if @cm.somethingSelected()
      a = @cm.listSelections(); u = @cm.getSelections()
      @cm.replaceSelections u.map (s) -> s.replace /^⍝/gm, ''
      # correct selection ends for deleted characters:
      for r, i in a when d = r.head.line - r.anchor.line || r.head.ch - r.anchor.ch
        if u[i].split(/^/m)[-1..][0][0] == '⍝' # first character of last line in the selection
          (if d > 0 then r.head else r.anchor).ch--
      @cm.setSelections a
    else
      l = @cm.getCursor().line; s = @cm.getLine l
      @cm.replaceRange s.replace(/^( *)⍝/, '$1'), {line: l, ch: 0}, {line: l, ch: s.length}, 'D'
      @cm.setCursor line: l, ch: 0
    return
  WI: -> @opts.weakInterrupt(); return
  ER: -> (if @isTracer then @emit 'RunCurrentLine', win: @id else @cm.execCommand 'newlineAndIndent'); return
  BH: -> @emit 'ContinueTrace',  win: @id; return
  RM: -> @emit 'Continue',       win: @id; return
  MA: -> @emit 'RestartThreads', win: @id; return
  CBP: -> @emit 'Cutback',       win: @id; return
  BP: -> # Toggle breakpoint
    for sel in @cm.listSelections()
      l0 = sel.anchor.line; l1 = sel.head.line; if l0 > l1 then tmp = l0; l0 = l1; l1 = tmp
      for l in [l0..l1] by 1
        if (i = @bp.indexOf l) >= 0 then @bp.splice i, 1; @cm.setGutterMarker l, 'breakpoints', null
        else @bp.push l; @cm.setGutterMarker l, 'breakpoints', @createBreakpointElement()
    if @isTracer
      @emit 'SetLineAttributes', win: @id, nLines: @cm.lineCount(), lineAttributes: stop: @bp[..].sort (x, y) -> x - y
    return
  FLD: (cm) -> cm.foldCode cm.getCursor(); return # Toggle fold
  tabOrAutocomplete: ->
    if @cm.somethingSelected()
      @cm.execCommand 'indentMore'
    else
      c = @cm.getCursor(); s = @cm.getLine c.line
      if /^ *$/.test s[...c.ch] then @cm.execCommand 'indentMore'
      else @autocompleteWithTab = 1; @emit 'Autocomplete', line: s, pos: c.ch, token: @id
    return
  downOrXline: ->
    l = @cm.getCursor().line
    if l != @cm.lastLine() || /^\s*$/.test @cm.getLine l then @cm.execCommand 'goLineDown'
    else @cm.execCommand 'goDocEnd'; @cm.execCommand 'newlineAndIndent'; @xline = l + 1
    return
  onbeforeunload: -> # called when the user presses [X] on the OS window
    if @ide.dead
      D.forceCloseNWWindow?(); return
    else if @cm.getValue() == @otext && @bp.join() == @obp
      @EP(); return
    else if !@dialog
      window.focus()
      @dialog = $("<p>The object \"#{@name}\" has changed.<br>Do you want to save the changes?</p>").dialog
        width: 400
        close: => @dialog.dialog 'close'; @dialog = null; return
        buttons: [
          {text: 'Yes',    click: => @dialog.dialog 'close'; @dialog = null; @EP(); return}
          {text: 'No',     click: => @dialog.dialog 'close'; @dialog = null; @QT(); return}
          {text: 'Cancel', click: => @dialog.dialog 'close'; @dialog = null; return}
        ]
      # When a string is returned from onbeforeunload:
      #   NW.js prevents the window from closing.
      #   Browsers ask the user "Are you sure you want to close this window?"
      #   In addition, some browsers display the returned string along with the above question.
      ''
