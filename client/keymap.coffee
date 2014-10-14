do ->
  ks = '''
                      `1234567890-=  ~!@#$%^&*()_+
                      qwertyuiop[]   QWERTYUIOP{}
                      asdfghjkl;'\\  ASDFGHJKL:"|
                      zxcvbnm,./     ZXCVBNM<>?
  '''.split /\s*/g
  vs = '''
                      `¨¯<≤=≥>≠∨∧×÷  ⋄⌶⍫⍒⍋⌽⍉⊖⍟⍱⍲!⌹
                      ?⍵∊⍴~↑↓⍳○*←→   ?⍵⍷⍴⍨↑↓⍸⍥⍣⍞⍬
                      ⍺⌈⌊_∇∆∘'⎕⍎⍕⊢   ⍺⌈⌊_∇∆⍤⌸⌷≡≢⊣
                      ⊂⊃∩∪⊥⊤|⍝⍀⌿     ⊂⊃∩∪⊥⊤|⍪⍙⍠
  '''.split /\s*/g

  squiggleDescriptions = '''
    ¨ each
    ¯ negative
    ∨ or (GCD)
    ∧ and (LCM)
    × signum/times
    ÷ reciprocal/divide
    ? roll/deal
    ⍵ right argument
    ∊ enlist/membership
    ⍴ shape/reshape
    ~ not/without
    ↑ mix/take
    ↓ split/drop
    ⍳ indices/index of
    ○ pi/trig
    * exp/power
    ← assignment
    → branch
    ⍺ left argument
    ⌈ ceil/max
    ⌊ floor/min
    ∇ recur
    ∘ compose
    ⎕ evaluated input
    ⍎ execute
    ⍕ format
    ⊢ right
    ⊂ enclose/partition
    ⊃ disclose/pick
    ∩ intersection
    ∪ unique/union
    ⊥ decode (1 2 3→123)
    ⊤ encode (123→1 2 3)
    | abs/modulo
    ⍝ comment
    ⍀ \\[⎕io]
    ⌿ /[⎕io]
    ⋄ statement sep
    ⌶ I-beam
    ⍒ grade down
    ⍋ grade up
    ⌽ reverse/rotate
    ⍉ transpose
    ⊖ ⌽[⎕io]
    ⍟ logarithm
    ⍱ nor
    ⍲ nand
    ! factorial/binomial
    ⌹ matrix inv/div
    ⍷ find
    ⍨ commute
    ⍣ power operator
    ⍞ char I/O
    ⍬ zilde (⍳0)
    ⍤ rank
    ⌸ key
    ⌷ default/index
    ≡ depth/match
    ≢ tally/not match
    ⊣ left
    ⍪ table / ,[⎕io]
    ⍠ variant
  '''

  squiggleNames = '''
    ← leftarrow assign gets
    + plus add conjugate
    - minus hyphen subtract negate
    × cross times multiply sgn signum direction
    ÷ divide reciprocal obelus
    * star asterisk power exponential
    ⍟ logarithm naturallogarithm circlestar starcircle
    ⌹ domino matrixdivide quaddivide
    ○ pi circular trigonometric
    ! exclamation bang shriek factorial binomial combinations
    ? question roll deal random
    | stile stroke verticalline modulo abs magnitude residue
    ⌈ upstile maximum ceiling
    ⌊ downstile minimum floor
    ⊥ base decode uptack
    ⊤ encode downtack
    ⊣ left lex lefttack
    ⊢ right rex righttack
    = equal
    ≠ ne notequal xor logicalxor
    ≤ le lessorequal
    < lessthan
    > greaterthan
    ≥ ge greaterorequal
    ≡ match equalunderbar identical
    ≢ notmatch equalunderbarslash notidentical tally
    ∧ and conjunction lcm logicaland lowestcommonmultiple caret
    ∨ or disjunction gcd vel logicalor greatestcommondivisor
    ⍲ nand andtilde logicalnand carettilde
    ⍱ nor ortilde logicalnor
    ↑ uparrow mix take
    ↓ downarrow split drop
    ⊂ enclose leftshoe partition
    ⊃ disclose rightshoe pick
    ⌷ squishquad squad index default materialise
    ⍋ gradeup deltastile
    ⍒ gradedown delstile
    ⍳ iota indices indexof
    ⍷ find epsilonunderbar
    ∪ cup union unique downshoe
    ∩ cap intersection upshoe
    ∊ epsilon in membership enlist flatten type
    ~ tilde not without
    / slash reduce fold insert select compress replicate solidus
    \\ backslash slope scan expand
    ⌿ slashbar reducefirst foldfirst insertfirst
    ⍀ slopebar backslashbar scanfirst expandfirst
    , comma catenate laminate ravel
    ⍪ commabar table catenatefirst
    ⍴ rho shape reshape
    ⌽ reverse rotate circlestile
    ⊖ reversefirst rotatefirst circlebar
    ⍉ transpose circlebackslash
    ¨ each diaeresis
    ⍨ commute switch selfie tildediaeresis
    ⍣ poweroperator stardiaeresis
    . dot
    ∘ jot compose ring
    ⍤ jotdiaeresis rank
    ⍞ quotequad characterinput rawinput
    ⎕ quad input evaluatedinput
    ⍠ colonquad quadcolon variant option
    ⌸ equalsquad quadequals key
    ⍎ execute eval uptackjot hydrant
    ⍕ format downtackjot thorn
    ⋄ diamond statementseparator
    ⍝ comment lamp
    → rightarrow branch abort
    ⍵ omega rightarg
    ⍺ alpha leftarg
    ∇ del recur triangledown downtriangle
    & ampersand spawn et
    ¯ macron negative highminus
    ⍬ zilde empty
    ⌶ ibeam
    ¤ currency isolate
    ∥ parallel
    ∆ delta triangleup uptriangle
    ⍙ deltaunderbar
    ⍥ circlediaeresis
    ⍫ deltilde
    á aacute
  '''

  ctid = null # backquote completion timeout id
  bqc = [] # backquote completions
  bqbqc = [] # double backquote completions
  Dyalog.reverseKeyMap = {}

  CodeMirror.keyMap.dyalog =
    fallthrough: 'default'
    F1: (cm) ->
      c = cm.getCursor(); s = cm.getLine(c.line).toLowerCase()
      u =
        if m = /^ *(\)[a-z]+).*$/.exec s
          Dyalog.helpURLs[m[1]] || 'lang/syscmds/intro'
        else if m = /^ *(\][a-z]+).*$/.exec s
          Dyalog.helpURLs[m[1]] || 'userguide/the-apl-environment/user-commands'
        else
          x = s[s[...c.ch].replace(/.[áa-z]*$/i, '').length..]
            .replace(/^([⎕:][áa-z]*|.).*$/i, '$1')
            .replace /^:end/, ':'
          Dyalog.helpURLs[x] ||
            if x[0] == '⎕' then 'lang/sysfns/sysfns-categorised'
            else if x[0] == ':' then 'lang/control-structures/control-structures-intro'
            else 'lang/intro/lang-elements'
      w = screen.width; h = screen.height
      popup = open "help/#{u}.html", 'help',
        "width=#{w / 2},height=#{h / 2},left=#{w / 4},top=#{h / 4}," +
        "scrollbars=1,location=1,toolbar=0,menubar=0,resizable=1"
      popup.focus?()
      return
    "'`'": (cm) ->
      cm.setOption 'autoCloseBrackets', false
      cm.setOption 'keyMap', 'dyalogBackquote'
      c = cm.getCursor()
      cm.replaceSelection '`', 'end'
      ctid = setTimeout(
        ->
          cm.showHint completeOnSingleClick: true, hint: ->
            data = from: c, to: cm.getCursor(), list: bqc
            CodeMirror.on data, 'close', ->
              cm.setOption 'autoCloseBrackets', true
              cm.setOption 'keyMap', 'dyalog'
            data
        500
      )

  CodeMirror.keyMap.dyalogBackquote = nofallthrough: true, disableInput: true
  ds = {}; for line in squiggleDescriptions.split '\n' then ds[line[0]] = line[2..]
  if ks.length != vs.length then console.error? 'bad configuration of backquote keymap'
  for k, i in ks when k != (v = vs[i]) || k == '`'
    bqc.push text: v, displayText: "#{v} `#{k} #{ds[v] || ''}  "
    Dyalog.reverseKeyMap[v] = k
    CodeMirror.keyMap.dyalogBackquote["'#{k}'"] = do (v = v) -> (cm) ->
      clearTimeout ctid
      cm.state.completionActive?.close?()
      cm.setOption 'keyMap', 'dyalog'
      cm.setOption 'autoCloseBrackets', true
      c = cm.getCursor()
      if v == '`' then bqbqHint cm
      else cm.replaceRange v, {line: c.line, ch: c.ch - 1}, c
      return

  bqc[0].render = (e) -> e.innerHTML = '  `` <i>completion by name</i>'
  bqc[0].hint = bqbqHint = (cm) ->
    c = cm.getCursor(); c0 = line: c.line, ch: c.ch - 1
    cm.replaceSelection '`', 'end'
    cm.showHint completeOnSingleClick: true, hint: ->
      u = cm.getLine(c.line)[c.ch + 1..]
      a = []; for x in bqbqc when x.name[...u.length] == u then a.push x
      from: c0, to: cm.getCursor(), list: a

  for line in squiggleNames.split '\n'
    [squiggle, names...] = line.split ' '
    bqKey = Dyalog.reverseKeyMap[squiggle]
    for name in names then bqbqc.push
      name: name, text: squiggle
      displayText: "#{squiggle} #{if bqKey then '`' + bqKey else '  '} ``#{name}"

  window.onhelp = -> false # prevent IE from acting silly on F1
  ks = vs = ds = squiggleDescriptions = squiggleNames = null
