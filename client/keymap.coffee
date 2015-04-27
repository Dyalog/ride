CodeMirror = require 'codemirror'
helpurls = require './helpurls'
prefs = require './prefs'
{inherit, cat, dict, chr, ord, zip, join, delay} = require './util'

window.onhelp = -> false # prevent IE from acting silly on F1

prefs.prefixKey (x, old) -> # change listener
  if x != old then m = CodeMirror.keyMap.dyalog; m["'#{x}'"] = m["'#{old}'"]; delete m["'#{old}'"]
  return

squiggleDescriptions =
  '¨': 'each',               '←': 'assignment',          '⊤': 'encode (123→1 2 3)',  '⌹': 'matrix inv/div'
  '¯': 'negative',           '→': 'branch',              '|': 'abs/modulo',          '⍷': 'find'
  '∨': 'or (GCD)',           '⍺': 'left argument',       '⍝': 'comment',             '⍨': 'commute'
  '∧': 'and (LCM)',          '⌈': 'ceil/max',            '⍀': '\\[⎕io]',             '⍣': 'power operator'
  '×': 'signum/times',       '⌊': 'floor/min',           '⌿': '/[⎕io]',              '⍞': 'char I/O'
  '÷': 'reciprocal/divide',  '∇': 'recur',               '⋄': 'statement sep',       '⍬': 'zilde (⍳0)'
  '?': 'roll/deal',          '∘': 'compose',             '⌶': 'I-beam',              '⍤': 'rank'
  '⍵': 'right argument',     '⎕': 'evaluated input',     '⍒': 'grade down',          '⌸': 'key'
  '∊': 'enlist/membership',  '⍎': 'execute',             '⍋': 'grade up',            '⌷': 'default/index'
  '⍴': 'shape/reshape',      '⍕': 'format',              '⌽': 'reverse/rotate',      '≡': 'depth/match'
  '~': 'not/without',        '⊢': 'right',               '⍉': 'transpose',           '≢': 'tally/not match'
  '↑': 'mix/take',           '⊂': 'enclose/partition',   '⊖': '⌽[⎕io]',              '⊣': 'left'
  '↓': 'split/drop',         '⊃': 'disclose/pick',       '⍟': 'logarithm',           '⍪': 'table / ,[⎕io]'
  '⍳': 'indices/index of',   '∩': 'intersection',        '⍱': 'nor',                 '⍠': 'variant'
  '○': 'pi/trig',            '∪': 'unique/union',        '⍲': 'nand'
  '*': 'exp/power',          '⊥': 'decode (1 2 3→123)',  '!': 'factorial/binomial'

ctid = 0 # backquote completion timeout id

CodeMirror.keyMap.dyalog = inherit fallthrough: 'default', F1: (cm) ->
  c = cm.getCursor(); s = cm.getLine(c.line).toLowerCase()
  u =
    if      m = /^ *(\)[a-z]+).*$/.exec s then helpurls[m[1]] || helpurls.WELCOME
    else if m = /^ *(\][a-z]+).*$/.exec s then helpurls[m[1]] || helpurls.UCMDS
    else
      x = s[s[...c.ch].replace(/.[áa-z]*$/i, '').length..].replace(/^([⎕:][áa-z]*|.).*$/i, '$1').replace /^:end/, ':'
      helpurls[x] ||
        if      x[0] == '⎕' then helpurls.SYSFNS
        else if x[0] == ':' then helpurls.CTRLSTRUCTS
        else                     helpurls.LANGELEMENTS
  w = screen.width / 4; h = screen.height / 4
  open u, 'help', "width=#{2 * w},height=#{2 * h},left=#{w},top=#{h},scrollbars=1,location=1,toolbar=0,menubar=0,resizable=1"
    .focus?()
  return

CodeMirror.keyMap.dyalog["'#{prefs.prefixKey()}'"] = (cm) ->
  if cm.dyalogBQ
    c = cm.getCursor(); cm.replaceSelection prefs.prefixKey(), 'end'
  else
    # Make it possible to use `( etc -- remember the original value of
    # autoCloseBrackets, set it temporarily to "false", and restore it when the
    # menu is closed:
    cm.setOption 'autoCloseBrackets0', cm.getOption 'autoCloseBrackets'
    cm.setOption 'autoCloseBrackets', false
    cm.on 'change', bqChangeHandler; cm.dyalogBQ = 1
    c = cm.getCursor(); cm.replaceSelection prefs.prefixKey(), 'end'
    ctid = delay 500, -> cm.showHint
      completeOnSingleClick: true
      extraKeys:
        Backspace: (cm, m) -> m.close(); cm.execCommand 'delCharBefore'; return
        Left:      (cm, m) -> m.close(); cm.execCommand 'goCharLeft'; return
        Right:     (cm, m) -> m.pick(); return
      hint: ->
        pk = prefs.prefixKey()
        data = from: c, to: cm.getCursor(), list: KS.map (k) ->
          if k == pk
            text: '', hint: bqbqHint, render: (e) -> e.innerHTML = "  #{pk}#{pk} <i>completion by name</i>"; return
          else
            v = bq[k]; text: v, render: (e) -> $(e).text "#{v} #{pk}#{k} #{squiggleDescriptions[v] || ''}  "; return
        CodeMirror.on data, 'close', -> bqCleanUp cm; return
        data
  return

# `x completions
KS = '`1234567890-=qwertyuiop[]asdfghjk l;\'\\zxcvbnm,./~!@#$%^&*()_+QWERTYUIOP{}ASDFGHJKL:"|ZXCVBNM<>?'.split /\s*/
VS = '`¨¯<≤=≥>≠∨∧×÷?⍵∊⍴~↑↓⍳○*←→⍺⌈⌊_∇∆∘\'⎕⍎⍕ ⊢ ⊂⊃∩∪⊥⊤|⍝⍀⌿⋄⌶⍫⍒⍋⌽⍉⊖⍟⍱⍲!⌹?⍵⍷⍴⍨↑↓⍸⍥⍣⍞⍬⍺⌈⌊_∇∆⍤⌸⌷≡≢⊣⊂⊃∩∪⊥⊤|⍪⍙⍠'.split /\s*/
if KS.length != VS.length then console.error? 'bad configuration of backquote keymap'
BQ = dict zip KS, VS # default ` map
bq = $.extend {}, BQ; do -> s = prefs.prefixMap(); for i in [0...s.length] by 2 then bq[s[i]] = s[i + 1] # current ` map
@getBQMap = -> $.extend {}, bq
@getBQKeyFor = getBQKeyFor = (v) -> (for k in KS when bq[k] == v then return k); ''
@setBQMap = (bq1) -> $.extend bq, bq1; prefs.prefixMap join(for k, v of bq when v != (BQ[k] || ' ') then k + v); return

bqChangeHandler = (cm, o) -> # o: changeObj
  l = o.from.line; i = o.from.ch
  if o.origin == '+input' && l == o.to.line && i == o.to.ch && o.text.length == 1 && o.text[0].length == 1
    x = o.text[0]; pk = prefs.prefixKey()
    if x == pk
      if i && cm.getLine(l)[i - 1] == pk
        bqCleanUp cm; bqbqHint cm
    else
      bq[x] && cm.replaceRange bq[x], {line: l, ch: i - 1}, {line: l, ch: i + 1}, 'D'
      bqCleanUp cm
  else
    bqCleanUp cm
  return

bqCleanUp = (cm) ->
  cm.off 'change', bqChangeHandler; delete cm.dyalogBQ
  clearTimeout ctid; cm.state.completionActive?.close?()
  cm.setOption 'autoCloseBrackets', cm.getOption 'autoCloseBrackets0'
  cm.setOption 'autoCloseBrackets0', null
  return

bqbqHint = (cm) ->
  c = cm.getCursor()
  cm.showHint completeOnSingleClick: true, extraKeys: {Right: pick = ((cm, m) -> m.pick()), Space: pick}, hint: ->
    u = cm.getLine(c.line)[c.ch...cm.getCursor().ch]
    a = []; for x in bqbqc when x.name[...u.length] == u then a.push x
    from: {line: c.line, ch: c.ch - 2}, to: cm.getCursor(), list: a
  return

# ``name completions
bqbqc = ((s) -> cat s.split('\n').map (l) ->
  [squiggle, names...] = l.split ' '
  names.map (name) -> name: name, text: squiggle, render: (e) ->
    key = getBQKeyFor squiggle; pk = prefs.prefixKey()
    $(e).text "#{squiggle} #{if key then pk + key else '  '} #{pk}#{pk}#{name}"
) """
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
""" + [0...26].map((i) -> "\n#{chr i + ord 'Ⓐ'} _#{chr i + ord 'a'}").join '' # underscored alphabet: Ⓐ _a ...

createCommand = (xx) -> CodeMirror.commands[xx] ?= (cm) -> (if (h = cm.dyalogCommands) && h[xx] then h[xx]()); return
['CBP', 'MA', 'tabOrAutocomplete', 'downOrXline', 'indentMoreOrAutocomplete'].forEach createCommand
'''
  [     0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F]
  [00] QT ER TB BT EP UC DC RC LC US DS RS LS UL DL RL
  [10] LL HO CT PT IN II DI DP DB RD TG DK OP CP MV FD
  [20] BK ZM SC RP NX PV RT RA ED TC NB NS ST EN IF HK
  [30] FX LN MC MR JP D1 D2 D3 D4 D5 U1 U2 U3 U4 U5 Lc
  [40] Rc LW RW Lw Rw Uc Dc Ll Rl Ul Dl Us Ds DD DH BH
  [50] BP AB HT TH RM CB PR SR -- TL UA AO DO GL CH PU
  [60] PA -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
  [70] -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
  [80] -- -- -- -- -- -- TO MO -- -- -- -- -- S1 S2 OS
'''.replace(/\[.*?\]/g, '').replace(/^\s*|\s*$/g, '').split(/\s+/).forEach (xx, i) ->
  if xx != '--' then createCommand xx; CodeMirror.keyMap.dyalog["'#{chr 0xf800 + i}'"] = xx
  return

'''
  QT Shift-Esc
  ER Enter
  EP Esc
  FD Shift-Ctrl-Enter
  BK Shift-Ctrl-Backspace
  SC Ctrl-F
  RP Ctrl-G
  ED Shift-Enter
  TC Ctrl-Enter
  TL Ctrl-Up
  WI Ctrl-Pause
'''.split('\n').forEach (l) ->
  [xx, keys...] = l.split /\s+/; createCommand xx; keys.forEach (key) -> CodeMirror.keyMap.dyalog[key] = xx; return

# CodeMirror provides a goLineStartSmart but not a goLineEndSmart command.
CodeMirror.keyMap.dyalog.End = 'goLineEndSmart'
CodeMirror.commands.goLineEndSmart = (cm) ->
  cm.extendSelectionsBy(
    ->
      c = cm.getCursor(); l = c.line; s = cm.getLine l; n = s.length; m = s.replace(/\ +$/, '').length
      CodeMirror.Pos l, if m <= c.ch < n || !m then n else m
    origin: "+move", bias: -1
  )
  return
