{qw, last} = require './util'

# https://codemirror.net/doc/manual.html#modeapi

letter = @letter = 'A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ'
name0 = ///[#{letter}]///
name1 = ///[#{letter}\d]*///
name = "(?:[#{letter}][#{letter}0-9]*)"
notName = ///[^#{letter}0-9]+///
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

INDENT_UNIT = 4 # todo: make it configurable
INDENT_UNIT_FOR_METHODS = 2

CodeMirror.defineMIME 'text/apl', 'apl'
CodeMirror.defineMode 'apl', (config) ->
  startState: ->
    hdr: 1      # are we at a location where a tradfn header can be expected?
    br: ''      # a stack of brackets (as a string) consisting of '{', '[', and '('
    dfnDepth: 0 # how many surrounding {} have we got?
    kw: ['']    # a stack of keywords, e.g. ['if', 'for']
    oi: [0]     # "outer indents" -- a stack of the indents of { :if :for etc
    ii: [0]     # "inner indents" -- a stack of the indents within the bodies of { :if :for etc

  token: (stream, h) -> # h:state
    if stream.sol() && !stream.match /^\s*(:|$)/, false then h.ii[h.ii.length - 1] = stream.indentation()
    if h.hdr
      delete h.hdr; stream.match /[^⍝\n\r]*/; s = stream.current()
      if /^\s*:/.test(s) || dfnHeader.test s
        stream.backUp s.length # re-tokenize without hdr
      else if /^\s*$/.test s
        delete h.vars
      else
        h.vars = s.split notName
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
      else if c == '(' then h.br += c; 'apl-par'
      else if c == '[' then h.br += c; 'apl-sqbr'
      else if c == '{'
        h.br += c; n = stream.indentation(); h.oi.push n; h.ii.push n + INDENT_UNIT
        "apl-dfn#{++h.dfnDepth} apl-dfn"
      else if c == ')' then (if '(' == last h.br then h.br = h.br[...-1]; 'apl-par'  else 'apl-err')
      else if c == ']' then (if '[' == last h.br then h.br = h.br[...-1]; 'apl-sqbr' else 'apl-err')
      else if c == '}'
        if '{' == last h.br
          h.br = h.br[...-1]; h.oi.pop(); h.ii.pop(); "apl-dfn apl-dfn#{h.dfnDepth--}"
        else
          'apl-err'
      else if c == ';' then 'apl-semi'
      else if c == '⋄' then 'apl-diam'
      else if /[\/⌿\\⍀¨⌸⍨⌶]/.test c then 'apl-op1'
      else if /[\.∘⍤⍣⍠]/.test c then 'apl-op2'
      else if /[\+\-×÷⌈⌊\|⍳\?\*⍟○!⌹<≤=>≥≠≡≢∊⍷∪∩~∨∧⍱⍲⍴,⍪⌽⊖⍉↑↓⊂⊃⌷⍋⍒⊤⊥⍕⍎⊣⊢→]/.test c then 'apl-fn'
      else if h.dfnDepth && /[⍺⍵∇:]/.test c then "apl-dfn apl-dfn#{h.dfnDepth}"
      else if c == '∇'
        if (i = h.kw.lastIndexOf '∇') >= 0
          h.kw.splice i; h.ii.splice i; h.oi.splice i
        else
          n = stream.indentation()
          h.kw.push '∇'; h.oi.push n; h.ii.push n + INDENT_UNIT_FOR_METHODS
        h.hdr = 1; 'apl-trad'
      else if c == ':'
        ok = 0
        switch kw = stream.match(/\w*/)?[0]?.toLowerCase()
          # see https://github.com/jashkenas/coffeescript/issues/2014 for the "multiline when" syntax
          when 'class', 'disposable', 'for', 'hold', 'if', 'interface', 'namespace'
          ,    'property', 'repeat', 'section', 'select', 'trap', 'while', 'with'
            h.kw.push kw; n = stream.indentation(); h.oi.push n; h.ii.push n + INDENT_UNIT; ok = 1
          when 'end'
            ok = h.kw.length > 1 && last(h.kw) != '∇'; (if ok then h.kw.pop(); h.oi.pop(); h.ii.pop()); ok
          when 'endclass', 'enddisposable', 'endfor', 'endhold', 'endif', 'endinterface', 'endnamespace'
          ,    'endproperty', 'endrepeat', 'endsection', 'endselect', 'endtrap', 'endwhile', 'endwith'
          ,    'until'
            kw0 = if kw == 'until' then 'repeat' else kw[3..] # corresponding opening keyword
            i = h.kw.lastIndexOf kw0; ok = i == h.kw.length - 1 >= 0
            (if ok then h.kw.splice i; h.oi.splice i; h.ii.splice i); ok
          when 'else'                    then ok = last(h.kw) in ['if', 'select', 'trap']
          when 'elseif', 'andif', 'orif' then ok = last(h.kw) == 'if'
          when 'in', 'ineach'            then ok = last(h.kw) == 'for'
          when 'case', 'caselist'        then ok = last(h.kw) in ['select', 'trap']
          when 'leave', 'continue'       then ok = last(h.kw) in ['for', 'while', 'continue']
          when 'access', 'base', 'field', 'goto', 'include', 'return', 'using' then ok = 1
          when 'implements'
            if x = stream.match(/\s+(\w+)/)?[1]
              x = x.toLowerCase()
              for y in ['constructor', 'destructor', 'method', 'trigger'] when x == y[...x.length] then ok = 1; break
            else
              ok = 1
        ok && 'apl-kw' || 'apl-err'
      else if c == '⎕' then (if stream.match(/[áa-z0-9]*/i)?[0].toLowerCase() in quadNames then 'apl-quad' else 'apl-err')
      else if c == '⍞' then 'apl-quad'
      else if c == '#' then 'apl-ns'
      else if name0.test c
        stream.match name1; x = stream.current()
        if !h.dfnDepth && stream.match /:/ then 'apl-lbl'
        else if h.dfnDepth || h.vars && x in h.vars then 'apl-var'
        else 'apl-glb'
      else 'apl-err'

  # when the user enters one of these, a re-indent is triggered
  electricInput: /(?::end|:else|:andif|:orif|:case|:until|\}|∇)$/

  indent: (h, s) -> # h:state, s:textAfter
    if /^\s*∇/.test s
      if (i = h.kw.lastIndexOf '∇') >= 0 then h.oi[i] else last h.ii
    else
      re = if h.dfnDepth then /^\s*\}/ else /^\s*:(?:end|else|andif|orif|case|until)/i
      last if re.test s then h.oi else h.ii

  fold: 'indent'
