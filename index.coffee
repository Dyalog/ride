jQuery ($) ->
  socket = io()
  send = (a...) -> console.info 'send:', a...; socket.emit a...
  recv = (x, f) -> socket.on x, (a...) -> console.info 'recv:', x, a...; f a...

  recv 'add', (s) ->
    cm.replaceRange s, line: cm.lineCount() - 1, ch: 0

  recv 'prompt', ->
    cm.replaceRange '      ', line: cm.lineCount() - 1, ch: 0
    cm.setCursor cm.lineCount() - 1, 6

  cm = CodeMirror document.getElementById('session'),
    autofocus: true
    extraKeys:
      'Enter': ->
        l = cm.lineCount() - 1
        s = cm.getLine l
        cm.replaceRange '', {line: l, ch: 0}, {line: l, ch: s.length}
        send 'exec', s + '\n'
  cm.setCursor 0, 6

  # language bar
  $('#lbar').html(
    '← +-×÷*⍟⌹○!? |⌈⌊⊥⊤⊣⊢ =≠≤<>≥≡≢ ∨∧⍱⍲ ↑↓⊂⊃⌷⍋⍒ ⍳⍷∪∩∊~ /\\⌿⍀ ,⍪⍴⌽⊖⍉ ¨⍨⍣.∘⍤ ⍞⎕⍠⌸⍎⍕ ⋄⍝→⍵⍺∇& ¯⍬'
      .replace /\S+/g, (g) ->
        """<span class="group">#{g.replace /(.)/g, '<span class="glyph">$1</span>'}</span>"""
  )
  $('#lbar').on 'mousedown', -> false
  $('.glyph', '#lbar').on 'mousedown', (e) -> cm.replaceRange $(e.target).text(), cm.getCursor(); false

  # tooltips
  help =
    '←': ['Left Arrow', '''
      Dyadic function:  Assignment

            X←3 5⍴'ABCDEFG'
            X
      ABCDE
      FGABC
      DEFGA

            X,←3 4 5
            X
      ABCDE 3
      FGABC 4
      DEFGA 5
    ''']
  ttid = null # tooltip timeout id
  $('.glyph', '#lbar').on 'mouseover focus', (e) ->
    clearTimeout ttid
    ttid = setTimeout(
      ->
        ttid = null
        $t = $ e.target; p = $t.position(); x = $t.text()
        h = help[x] or [x, 'Help for ' + x]
        $('#tip-title').text h[0]
        $('#tip-description').text h[1]
        $('#tip').css(left: p.left - 22, top: p.top + $t.height() - 2).show()
      500
    )
  $('.glyph', '#lbar').on 'mouseout blur', ->
    clearTimeout ttid; ttid = null; $('#tip').hide()

  $(window).resize(-> cm.setSize null, $(window).height() - 4 - $('#lbar').height()).resize()

  window.socket = socket
  window.cm = cm
