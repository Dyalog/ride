do ->
  window.onhelp = -> false # prevent IE from acting silly on F1

  inherit = (x) -> (F = ->):: = x; new F

  DEFAULT_PREFIX_KEY = '`'
  prefixKeyListeners = []
  Dyalog.onPrefixKeyChange = (f) -> prefixKeyListeners.push f
  Dyalog.getPrefixKey = -> localStorage.prefixKey || DEFAULT_PREFIX_KEY
  Dyalog.setPrefixKey = (x = DEFAULT_PREFIX_KEY) ->
    old = Dyalog.getPrefixKey()
    if x != old
      if x != DEFAULT_PREFIX_KEY then localStorage.prefixKey = x else delete localStorage.prefixKey
      for f in prefixKeyListeners then f x, old
    1

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
    + plus add conjugate mate
    - minus hyphen subtract negate
    × cross times multiply sgn signum direction
    ÷ divide reciprocal obelus
    * star asterisk power exponential
    ⍟ logarithm naturallogarithm circlestar starcircle splat
    ⌹ domino matrixdivide quaddivide
    ○ pi circular trigonometric
    ! exclamation bang shriek factorial binomial combinations
    ? question roll deal random
    | stile stroke verticalline modulo abs magnitude residue remainder
    ⌈ upstile maximum ceiling
    ⌊ downstile minimum floor
    ⊥ base decode uptack
    ⊤ antibase encode downtack representation
    ⊣ left lev lefttack
    ⊢ right dex righttack
    = equal
    ≠ ne notequal xor logicalxor
    ≤ le lessorequal fore
    < lessthan before
    > greaterthan after
    ≥ ge greaterorequal aft
    ≡ match equalunderbar identical
    ≢ notmatch equalunderbarslash notidentical tally
    ∧ and conjunction lcm logicaland lowestcommonmultiple caret
    ∨ or disjunction gcd vel logicalor greatestcommondivisor hcf highestcommonfactor
    ⍲ nand andtilde logicalnand carettilde
    ⍱ nor ortilde logicalnor
    ↑ uparrow mix take
    ↓ downarrow split drop
    ⊂ enclose leftshoe partition
    ⊃ disclose rightshoe pick
    ⌷ squishquad squad index default materialise
    ⍋ gradeup deltastile upgrade pine
    ⍒ gradedown delstile downgrade spine
    ⍳ iota indices indexof
    ⍷ find epsilonunderbar
    ∪ cup union unique downshoe distinct
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
    ⊖ reversefirst rotatefirst circlebar rowel upset
    ⍉ transpose circlebackslash cant
    ¨ each diaeresis
    ⍨ commute switch selfie tildediaeresis
    ⍣ poweroperator stardiaeresis
    . dot
    ∘ jot compose ring
    ⍤ jotdiaeresis rank paw
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
    ⍥ circlediaeresis hoof
    ⍫ deltilde
    á aacute
    Ⓐ _a
    Ⓑ _b
    Ⓒ _c
    Ⓓ _d
    Ⓔ _e
    Ⓕ _f
    Ⓖ _g
    Ⓗ _h
    Ⓘ _i
    Ⓙ _j
    Ⓚ _k
    Ⓛ _l
    Ⓜ _m
    Ⓝ _n
    Ⓞ _o
    Ⓟ _p
    Ⓠ _q
    Ⓡ _r
    Ⓢ _s
    Ⓣ _t
    Ⓤ _u
    Ⓥ _v
    Ⓦ _w
    Ⓧ _x
    Ⓨ _y
    Ⓩ _z
  '''

  ctid = null # backquote completion timeout id
  bqc = [] # backquote completions
  bqbqc = [] # double backquote completions
  Dyalog.reverseKeyMap = {}

  CodeMirror.keyMap.dyalog = inherit
    fallthrough: 'default'
    F1: (cm) ->
      c = cm.getCursor(); s = cm.getLine(c.line).toLowerCase()
      u =
        if m = /^ *(\)[a-z]+).*$/.exec s
          Dyalog.helpURLs[m[1]] || Dyalog.helpURLs.WELCOME
        else if m = /^ *(\][a-z]+).*$/.exec s
          Dyalog.helpURLs[m[1]] || Dyalog.helpURLs.UCMDS
        else
          x = s[s[...c.ch].replace(/.[áa-z]*$/i, '').length..]
            .replace(/^([⎕:][áa-z]*|.).*$/i, '$1')
            .replace /^:end/, ':'
          Dyalog.helpURLs[x] ||
            if x[0] == '⎕' then Dyalog.helpURLs.SYSFNS
            else if x[0] == ':' then Dyalog.helpURLs.CTRLSTRUCTS
            else Dyalog.helpURLs.LANGELEMENTS
      w = screen.width; h = screen.height
      popup = open u, 'help',
        "width=#{w / 2},height=#{h / 2},left=#{w / 4},top=#{h / 4}," +
        "scrollbars=1,location=1,toolbar=0,menubar=0,resizable=1"
      popup.focus?()
      return

  CodeMirror.keyMap.dyalog["'#{Dyalog.getPrefixKey()}'"] = (cm) ->
    cm.setOption 'autoCloseBrackets', false
    cm.setOption 'keyMap', 'dyalogBackquote'
    c = cm.getCursor()
    cm.replaceSelection Dyalog.getPrefixKey(), 'end'
    ctid = setTimeout(
      -> cm.showHint
        completeOnSingleClick: true
        extraKeys:
          Backspace: (cm, m) -> m.close(); cm.execCommand 'delCharBefore'
          Left:      (cm, m) -> m.close(); cm.execCommand 'goCharLeft'
          Right:     (cm, m) -> m.pick()
        hint: ->
          data = from: c, to: cm.getCursor(), list: bqc
          CodeMirror.on data, 'close', -> cm.setOption 'autoCloseBrackets', true; cm.setOption 'keyMap', 'dyalog'
          data
      500
    )
  Dyalog.onPrefixKeyChange (x, old) -> x = "'#{x}'"; old = "'#{old}'"; m = CodeMirror.keyMap.dyalog; m[x] = m[old]; delete m[old]

  CodeMirror.keyMap.dyalogBackquote = nofallthrough: true, disableInput: true
  ds = {}; for line in squiggleDescriptions.split '\n' then ds[line[0]] = line[2..]
  if ks.length != vs.length then console.error? 'bad configuration of backquote keymap'
  for k, i in ks then do (k = k) ->
    v = vs[i]
    Dyalog.reverseKeyMap[v] ?= k
    bqc.push text: v, render: (e) -> $(e).text "#{v} #{Dyalog.getPrefixKey()}#{k} #{ds[v] || ''}  "
    CodeMirror.keyMap.dyalogBackquote["'#{k}'"] = (cm) ->
      clearTimeout ctid
      cm.state.completionActive?.close?()
      cm.setOption 'keyMap', 'dyalog'
      cm.setOption 'autoCloseBrackets', true
      c = cm.getCursor()
      if k == Dyalog.getPrefixKey() then bqbqHint cm else cm.replaceRange v, {line: c.line, ch: c.ch - 1}, c
      return

  bqc[0].render = (e) -> e.innerHTML = "  #{Dyalog.getPrefixKey()}#{Dyalog.getPrefixKey()} <i>completion by name</i>"
  bqc[0].hint = bqbqHint = (cm) ->
    c = cm.getCursor()
    cm.replaceSelection Dyalog.getPrefixKey(), 'end'
    cm.showHint
      completeOnSingleClick: true
      extraKeys: Right: (cm, m) -> m.pick()
      hint: ->
        u = cm.getLine(c.line)[c.ch + 1...cm.getCursor().ch]
        a = []; for x in bqbqc when x.name[...u.length] == u then a.push x
        from: {line: c.line, ch: c.ch - 1}, to: cm.getCursor(), list: a
    return

  for line in squiggleNames.split '\n' then do ->
    [squiggle, names...] = line.split ' '
    for name in names then bqbqc.push name: name, text: squiggle, render: do (name = name) -> (e) ->
      key = Dyalog.reverseKeyMap[squiggle]
      $(e).text "#{squiggle} #{if key then Dyalog.getPrefixKey() + key else '  '} #{Dyalog.getPrefixKey()}#{Dyalog.getPrefixKey()}#{name}"

  ks = vs = squiggleDescriptions = squiggleNames = null
