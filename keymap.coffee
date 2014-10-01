do ->
  CodeMirror.keyMap.dyalog =
    fallthrough: 'default'
    "'`'": (cm) -> cm.setOption 'keyMap', 'dyalogBackquote'

  CodeMirror.keyMap.dyalogBackquote = h =
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
    h["'#{ks[i]}'"] = do (v = vs[i]) -> (cm) -> cm.replaceSelection v, 'end'
  return
