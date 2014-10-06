do ->
  CodeMirror.keyMap.dyalog =
    fallthrough: 'default'
    "'`'": (cm) -> cm.setOption 'keyMap', 'dyalogBackquote'
    F1: (cm) ->
      c = cm.getCursor(); s = cm.getLine c.line
      x = s[s[...c.ch].replace(/.[áa-z]*$/i, '').length..].replace(/^(\)[a-z]+|⎕[áa-z]*|.).*$/i, '$1').toLowerCase()
      if u = helpURLs[x]
        w = screen.width; h = screen.height
        open "help/#{u}.html", 'help',
          "width=#{w / 2},height=#{h / 2},left=#{w / 4},top=#{h / 4}," +
          "scrollbars=1,location=1,toolbar=0,menubar=0,resizable=1"
      return

  window.onhelp = -> false # prevent IE from being silly

  CodeMirror.keyMap.dyalogBackquote = bq =
    auto: 'dyalog', nofallthrough: true, disableInput: true

  ks = ''' `1234567890-=  ~!@#$%^&*()_+
           qwertyuiop[]   QWERTYUIOP{}
           asdfghjkl;\'\\ ASDFGHJKL:"|
           zxcvbnm,./     ZXCVBNM<>?    '''.split /\ */g

  vs = ''' `¨¯<≤=≥>≠∨∧×÷  ⋄⌶⍫⍒⍋⌽⍉⊖⍟⍱⍲!⌹
           ?⍵∊⍴~↑↓⍳○*←→   ?⍵⍷⍴⍨↑↓⍸⍥⍣⍞⍬
           ⍺⌈⌊_∇∆∘\'⎕⍎⍕⊢  ⍺⌈⌊_∇∆⍤⌸⌷≡≢⊣
           ⊂⊃∩∪⊥⊤|⍝⍀⌿     ⊂⊃∩∪⊥⊤|⍪⍙⍠    '''.split /\ */g

  for i in [0...ks.length] by 1
    bq["'#{ks[i]}'"] = do (v = vs[i]) -> (cm) -> cm.replaceSelection v, 'end'

  return
