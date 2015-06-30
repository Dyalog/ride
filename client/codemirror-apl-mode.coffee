{qw} = require './util'

letter = @letter = 'A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ'
name0 = ///[#{letter}]///
name1 = ///[#{letter}\d]*///
name = "(?:[#{letter}][#{letter}\d]*)"
notName = ///[^#{letter}\d]+///
end = '(?:⍝|$)'
dfnHeader = ///
  ^ \s* #{name} \s* ← \s* \{ \s* (?:
    #{end} |
    [^#{letter}⍝\s] |
    #{name} \s* (?:
      \} \s* #{end} |
      #{end} |
      [^#{letter}\d\}⍝\s] |
      \s [^\}⍝\s]
    )
  )
///

keywords = qw '''
  andif access case caselist class continue else elseif end endclass endfor endhold endif endinterface endnamespace
  endproperty endrepeat endsection endselect endtrap endwhile endwith field for in goto hold include if implements
  interface leave namespace orif property repeat return section select trap until while with
'''
quadNames = [''].concat qw '''
  á a af ai an arbin arbout arg at av avu base class clear cmd cr cs ct cy d dct df div dl dm dmx dq dr ea ec ed em en
  env es et ex exception export fappend favail fc fchk fcopy fcreate fdrop ferase fhold fix flib fmt fnames fnums fprops
  fr frdac frdci fread frename freplace fresize fsize fstac fstie ftie funtie fx inp instances io kl l lc load lock lx
  map ml monitor na nappend nc ncreate nerase new nl nlock nnames nnums nq nr nread nrename nreplace nresize ns nsi
  nsize ntie null nuntie nxlate off or opt path pfkey pp pr profile ps pt pw refs r rl rsi rtl s save sd se sh shadow si
  signal size sm sr src stack state stop svc sve svo svq svr svs syl tc tcnums tf tget this tid tkill tname tnums tpool
  tput treq trace trap ts tsync tz ucs ul using vfi vr wa wc wg wn ws wsid wx x xml xsi xt
'''

# « and » prevent tolerance for extra whitespace
# _ stands for «' '» (space as an APL character literal)
idioms = qw '''
  ⍴⍴ /⍳ /⍳⍴ ⊃¨⊂ {} {⍺} {⍵} {⍺⍵} {0} {0}¨ ,/ ⍪/ ⊃⌽ ↑⌽ ⊃⌽, ↑⌽, 0=⍴ 0=⍴⍴ 0=≡ {(↓⍺)⍳↓⍵} ↓⍉↑ ↓⍉⊃ ∧\\_= +/∧\\_= +/∧\\
  {(∨\\_≠⍵)/⍵} {(+/∧\\_=⍵)↓⍵} ~∘_¨↓ {(+/∨\\_≠⌽⍵)↑¨↓⍵} ⊃∘⍴¨ ↑∘⍴¨ ,← ⍪← {⍵[⍋⍵]} {⍵[⍒⍵]} {⍵[⍋⍵;]} {⍵[⍒⍵;]} 1=≡ 1=≡, 0∊⍴
  ~0∊⍴ ⊣⌿ ⊣/ ⊢⌿ ⊢/ *○ 0=⊃⍴ 0≠⊃⍴ ⌊«0.5»+ «⎕AV»⍳
'''
escRE = (s) -> s.replace /[\(\)\[\]\{\}\.\?\+\*\/\\\^\$\|]/g, (x) -> "\\#{x}"
escIdiom = (s) -> s.replace(/«(.*?)»|(.)/g, (_, g, g2) -> g ||= g2; ' *' + if g == '_' then "' '" else escRE g)[2..]
idiomsRE = ///^(?:#{idioms.sort((x, y) -> y.length - x.length).map(escIdiom).join '|'})///i

CodeMirror.defineMIME 'text/apl', 'apl'
CodeMirror.defineMode 'apl', (config) -> # https://codemirror.net/doc/manual.html#modeapi
  startState: -> isHeader: 1, stack: '', dfnDepth: 0
  token: (stream, state) ->
    if state.isHeader
      delete state.isHeader; stream.match /[^⍝\n\r]*/; s = stream.current()
      if dfnHeader.test s
        stream.backUp s.length # re-tokenize without isHeader
      else if /^\s*$/.test s
        delete state.vars
      else
        state.vars = s.split notName
      'apl-trad'
    else if stream.match idiomsRE
      'apl-idm'
    else if stream.match /^¯?(?:\d*\.)?\d+(?:e¯?\d+)?(?:j¯?(?:\d*\.)?\d+(?:e¯?\d+)?)?/i
      'apl-num'
    else
      c = stream.next()
      if !c then null
      else if /\s/.test c then stream.eatSpace(); null
      else if c == '⍝' then stream.skipToEnd(); 'apl-com'
      else if c == '←' then 'apl-asgn'
      else if c == "'" then (if stream.match /^(?:[^'\r\n]|'')*'/ then 'apl-str' else stream.skipToEnd(); 'apl-err')
      else if c == '⍬' then 'apl-zld'
      else if c == '(' then state.stack += c; 'apl-par'
      else if c == '[' then state.stack += c; 'apl-brkt'
      else if c == '{' then state.stack += c; "apl-dfn#{++state.dfnDepth} apl-dfn"
      else if c == ')' then (if state.stack[-1..] == '(' then state.stack = state.stack[...-1]; 'apl-par'  else 'apl-err')
      else if c == ']' then (if state.stack[-1..] == '[' then state.stack = state.stack[...-1]; 'apl-brkt' else 'apl-err')
      else if c == '}' then (if state.stack[-1..] == '{' then state.stack = state.stack[...-1]; "apl-dfn apl-dfn#{state.dfnDepth--}"; else 'apl-err')
      else if c == ';' then 'apl-semi'
      else if c == '⋄' then 'apl-diam'
      else if /[\/⌿\\⍀¨⌸⍨⌶]/.test c then 'apl-op1'
      else if /[\.∘⍤⍣⍠]/.test c then 'apl-op2'
      else if /[\+\-×÷⌈⌊\|⍳\?\*⍟○!⌹<≤=>≥≠≡≢∊⍷∪∩~∨∧⍱⍲⍴,⍪⌽⊖⍉↑↓⊂⊃⌷⍋⍒⊤⊥⍕⍎⊣⊢→]/.test c then 'apl-fn'
      else if state.dfnDepth && /[⍺⍵∇:]/.test c then "apl-dfn apl-dfn#{state.dfnDepth}"
      else if c == '∇' then state.isHeader = 1; 'apl-trad'
      else if c == ':' then (if stream.match(/\w*/)?[0]?.toLowerCase() in keywords then 'apl-kw' else 'apl-err')
      else if c == '⎕' then (if stream.match(/[áa-z0-9]*/i)?[0].toLowerCase() in quadNames then 'apl-quad' else 'apl-err')
      else if c == '⍞' then 'apl-quad'
      else if c == '#' then 'apl-ns'
      else if name0.test c
        stream.match name1; x = stream.current()
        if !state.dfnDepth && stream.match /:/ then 'apl-lbl'
        else if state.dfnDepth || state.vars && x in state.vars then 'apl-var'
        else 'apl-glb'
      else 'apl-err'

  indent: (state, textAfter) -> config.indentUnit * (state.dfnDepth - /^\s*\}/.test textAfter)
