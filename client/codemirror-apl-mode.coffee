rLetter = 'A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ'; rName0 = ///[#{rLetter}]///; rName1 = ///[#{rLetter}\d]*///
rNotName = ///[^#{rLetter}\d]+///

CodeMirror.defineMIME 'text/apl', 'apl'
CodeMirror.defineMode 'apl', -> # https://codemirror.net/doc/manual.html#modeapi
  startState: -> isHeader: 1, stack: '', dfnDepth: 0
  token: (stream, state) ->
    if state.isHeader
      delete state.isHeader; stream.skipToEnd(); s = stream.current()
      if /\{\s*$/.test s
        stream.backUp s.length
      else if /^\s*$/.test s
        delete state.vars
      else
        state.vars = s.split rNotName
      'apl-tradfn'
    else if stream.match /^¯?(?:\d*\.)?\d+(?:j¯?(?:\d*\.)?\d+)?/i
      'apl-number'
    else
      c = stream.next()
      if !c then null
      else if /[ \t\r\n]/.test c then stream.eatSpace(); null
      else if c == '⍝' then stream.skipToEnd(); 'apl-comment'
      else if c == '←' then 'apl-assignment'
      else if c == "'" then (if stream.match /^(?:[^'\r\n]|'')*'/ then 'string' else stream.skipToEnd(); 'apl-error')
      else if c == '⍬' then 'apl-zilde'
      else if c == '(' then state.stack += c; 'apl-paren'
      else if c == '[' then state.stack += c; 'apl-bracket'
      else if c == '{' then state.stack += c; "apl-dfn apl-dfn#{++state.dfnDepth}"
      else if c == ')' then (if state.stack[-1..] == '(' then state.stack = state.stack[...-1]; 'apl-paren'   else 'apl-error')
      else if c == ']' then (if state.stack[-1..] == '[' then state.stack = state.stack[...-1]; 'apl-bracket' else 'apl-error')
      else if c == '}' then (if state.stack[-1..] == '{' then state.stack = state.stack[...-1]; "apl-dfn apl-dfn#{state.dfnDepth--}"; else 'apl-error')
      else if c == ';' then 'apl-semicolon'
      else if /[\/⌿\\⍀¨⌸]/.test c then 'apl-monadic-operator'
      else if /[\.∘⍤⍣⍠]/.test c then 'apl-dyadic-operator'
      else if /[\+\−×÷⌈⌊\|⍳\?\⋆⍟○!⌹<≤=>≥≠≡≢∊⍷∪∩∼∨∧⍱⍲⍴,⍪⌽⊖⍉↑↓⊂⊃⌷⍋⍒⊤⊥⍕⍎⊣⊢]/.test c then 'apl-function'
      else if state.dfnDepth && /[⍺⍵∇]/.test c then "apl-dfn apl-dfn#{state.dfnDepth}"
      else if c == '∇' then state.isHeader = 1; 'apl-tradfn'
      else if rName0.test c
        stream.match rName1; x = stream.current()
        if state.dfnDepth || state.vars && x in state.vars then 'apl-name' else 'apl-global-name'
      else 'apl-error'
