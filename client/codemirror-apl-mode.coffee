rLetter = 'A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ'; rName0 = ///[#{rLetter}]///; rName1 = ///[#{rLetter}\d]*///
rNotName = ///[^#{rLetter}\d]+///
keywords = '''
  andif access case caselist class continue else elseif end endclass endfor
  endhold endif endinterface endnamespace endproperty endrepeat endsection
  endselect endtrap endwhile endwith field for in goto hold include if
  implements interface leave namespace orif property repeat return section
  select trap until while with
'''.split /[ \r\n]+/
quadNames = [''].concat '''
  á a af ai an arbin arbout arg at av avu base class clear cmd cr cs ct cy d
  dct df div dl dm dmx dq dr ea ec ed em en env es et ex exception export
  fappend favail fc fchk fcopy fcreate fdrop ferase fhold fix flib fmt fnames
  fnums fprops fr frdac frdci fread frename freplace fresize fsize fstac fstie
  ftie funtie fx inp instances io kl l lc load lock lx map ml monitor na
  nappend nc ncreate nerase new nl nlock nnames nnums nq nr nread nrename
  nreplace nresize ns nsi nsize ntie null nuntie nxlate off or opt path pfkey
  pp pr profile ps pt pw refs r rl rsi rtl s save sd se sh shadow si signal
  size sm sr src stack state stop svc sve svo svq svr svs syl tc tcnums tf tget
  this tid tkill tname tnums tpool tput treq trace trap ts tsync tz ucs ul
  using vfi vr wa wc wg wn ws wsid wx x xml xsi xt
'''.split /[ \r\n]+/

CodeMirror.defineMIME 'text/apl', 'apl'
CodeMirror.defineMode 'apl', -> # https://codemirror.net/doc/manual.html#modeapi
  startState: -> isHeader: 1, stack: '', dfnDepth: 0
  token: (stream, state) ->
    if state.isHeader
      delete state.isHeader; stream.skipToEnd(); s = stream.current()
      if /\{\s*(⍝.*)?$/.test s
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
      else if /[\+\-×÷⌈⌊\|⍳\?\⋆⍟○!⌹<≤=>≥≠≡≢∊⍷∪∩∼∨∧⍱⍲⍴,⍪⌽⊖⍉↑↓⊂⊃⌷⍋⍒⊤⊥⍕⍎⊣⊢]/.test c then 'apl-function'
      else if state.dfnDepth && /[⍺⍵∇:]/.test c then "apl-dfn apl-dfn#{state.dfnDepth}"
      else if c == '∇' then state.isHeader = 1; 'apl-tradfn'
      else if c == ':' then (if stream.match(/\w*/)?[0]?.toLowerCase() in keywords then 'apl-keyword' else 'apl-error')
      else if c == '⎕' then (if stream.match(/[áa-z0-9]*/i)?[0].toLowerCase() in quadNames then 'apl-quad-name' else 'apl-error')
      else if c == '⍞' then 'apl-quad-name'
      else if rName0.test c
        stream.match rName1; x = stream.current()
        if state.dfnDepth || state.vars && x in state.vars then 'apl-name' else 'apl-global-name'
      else 'apl-error'
