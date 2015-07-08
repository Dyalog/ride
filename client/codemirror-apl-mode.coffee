{qw, last} = require './util'
prefs = require './prefs'

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

sw = 4; swm = 2 # default indent unit and indent unit for methods; keep these in sync with prefs
do update = -> sw = prefs.indent(); swm = prefs.indentMethods(); swm < 0 && swm = sw; return
prefs.indent update; prefs.indentMethods update

dfnDepth = (a) -> r = 0; (for x in a when x.t == '{' then r++); r

CodeMirror.defineMIME 'text/apl', 'apl'
CodeMirror.defineMode 'apl', (config) ->
  startState: ->
    hdr: 1  # are we at a location where a tradfn header can be expected?
    a: [    # stack of objects with the following properties
      t: '' #   t:  the opening token -- a keyword (without the colon) or '{', '[', '(', '∇'
      oi: 0 #   oi: outer indent -- the indent of the opening token's line
      ii: 0 #   ii: inner indent -- the indent of the block's body; it can be adjusted later
    ]
    # vars: # local names in a tradfn

  token: (stream, h) -> # h:state
    {a} = h; la = last a; n = stream.indentation()
    if stream.sol() && !stream.match /^\s*(:|∇|$)/, false then a[a.length - 1] = $.extend {ii: n}, la
    if h.hdr
      delete h.hdr; stream.match /[^⍝\n\r]*/; s = stream.current()
      if /^\s*:/.test(s) || dfnHeader.test s
        stream.backUp s.length
      else if /^\s*$/.test s
        delete h.vars
      else
        h.vars = s.split notName
      'apl-trad'
    else if stream.match idiomsRE then 'apl-idm'
    else if stream.match /^¯?(?:\d*\.)?\d+(?:e¯?\d+)?(?:j¯?(?:\d*\.)?\d+(?:e¯?\d+)?)?/i then 'apl-num'
    else if !(c = stream.next()) then null
    else
      switch c
        when ' ' then stream.eatSpace(); null
        when '⍝' then stream.skipToEnd(); 'apl-com'
        when '←' then 'apl-asgn'
        when "'" then (if stream.match /^(?:[^'\r\n]|'')*'/ then 'apl-str' else stream.skipToEnd(); 'apl-err')
        when '⍬' then 'apl-zld'
        when '(' then a.push t: c, oi: la.oi, ii: la.ii; 'apl-par'
        when '[' then a.push t: c, oi: la.oi, ii: la.ii; 'apl-sqbr'
        when '{' then a.push t: c, oi: n, ii: n + sw; "apl-dfn#{dfnDepth a} apl-dfn"
        when ')' then (if la.t == '(' then a.pop(); 'apl-par'  else 'apl-err')
        when ']' then (if la.t == '[' then a.pop(); 'apl-sqbr' else 'apl-err')
        when '}' then (if la.t == '{' then a.pop(); "apl-dfn apl-dfn#{1 + dfnDepth a}" else 'apl-err')
        when ';' then la.t == '[' && 'apl-semi' || 'apl-err'
        when '⋄' then la.t !in ['(', '['] && 'apl-diam' || 'apl-err'
        when '⎕' then stream.match(/[áa-z0-9]*/i)?[0].toLowerCase() in quadNames && 'apl-quad' || 'apl-err'
        when '⍞' then 'apl-quad'
        when '#' then 'apl-ns'
        when '⍺','⍵','∇',':'
          if dd = dfnDepth a
            "apl-dfn apl-dfn#{dd}"
          else if c == '∇'
            i = a.length - 1; while i && a[i].t != '∇' then i--
            if i then a.splice i else a.push t: '∇', oi: n, ii: n + swm
            h.hdr = 1; 'apl-trad'
          else if c == ':'
            ok = 0
            switch kw = stream.match(/\w*/)?[0]?.toLowerCase()
              # see https://github.com/jashkenas/coffeescript/issues/2014 for the "multiline when" syntax
              when 'class', 'disposable', 'for', 'hold', 'if', 'interface', 'namespace'
              ,    'property', 'repeat', 'section', 'select', 'trap', 'while', 'with'
                a.push t: kw, oi: n, ii: n + sw; ok = 1
              when 'end' then ok = a.length > 1 && la.t != '∇'; ok && a.pop()
              when 'endclass', 'enddisposable', 'endfor', 'endhold', 'endif', 'endinterface', 'endnamespace'
              ,    'endproperty', 'endrepeat', 'endsection', 'endselect', 'endtrap', 'endwhile', 'endwith'
              ,    'until'
                kw0 = if kw == 'until' then 'repeat' else kw[3..] # corresponding opening keyword
                ok = la.t == kw0
                if ok
                  a.pop()
                else
                  i = a.length - 1; while i && a[i].t != kw0 then i--
                  if i then a.splice i
              when 'else'                    then ok = la.t in ['if', 'select', 'trap']
              when 'elseif', 'andif', 'orif' then ok = la.t == 'if'
              when 'in', 'ineach'            then ok = la.t == 'for'
              when 'case', 'caselist'        then ok = la.t in ['select', 'trap']
              when 'leave', 'continue'       then ok = la.t in ['for', 'while', 'continue']
              when 'access'                  then ok = la.t in ['class', '∇']; stream.match /(?:\s+\w+)+/; ok = 1
              when 'base', 'field', 'goto', 'include', 'return', 'using' then ok = 1
              when 'implements'
                if x = stream.match(/\s+(\w+)/)?[1]
                  x = x.toLowerCase()
                  for y in ['constructor', 'destructor', 'method', 'trigger'] when x == y[...x.length] then ok = 1; break
                else
                  ok = 1
            ok && 'apl-kw' || 'apl-err'
        else
          if name0.test c
            stream.match name1; x = stream.current(); dd = dfnDepth a
            if !dd && stream.match /:/ then 'apl-lbl' else if dd || h.vars && x in h.vars then 'apl-var' else 'apl-glb'
          else if /[\+\-×÷⌈⌊\|⍳\?\*⍟○!⌹<≤=≥>≠≡≢∊⍷∪∩~∧∨⍲⍱⍴,⍪⌽⊖⍉↑↓⊂⊃⌷⍋⍒⊤⊥⍕⍎⊣⊢→]/.test c then 'apl-fn'
          else if /[\/\\⌿⍀¨⍨⌸⌶]/.test c then 'apl-op1'
          else if /[\.∘⍤⍣⍠]/.test c then 'apl-op2'
          else 'apl-err'

  # when the user enters one of these, a re-indent is triggered
  electricInput: /(?::end|:else|:andif|:orif|:case|:until|:access|\}|∇)$/

  indent: (h, s) -> # h:state, s:textAfter
    {a} = h; la = last a
    if dfnDepth a
      if /^\s*\}/.test s then la.oi else la.ii
    else if /^\s*∇/.test s
      i = a.length - 1; while i && a[i].t != '∇' then i--
      if i then a[i].oi else la.ii
    else if /^\s*:access/i.test s
      if la.t == 'class' then la.oi else la.ii
    else
      if /^\s*:(?:end|else|andif|orif|case|until)/i.test s then la.oi else la.ii

  fold: 'indent'
