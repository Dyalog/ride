helpurls = require './helpurls'
prefs = require './prefs'
about = require './about'
{inherit, cat, dict, chr, ord, zip, join, delay, qw} = require './util'
prefsUI = require './prefs-ui'
{ACB_VALUE} = require './editor'

window.onhelp = -> false # prevent IE from acting silly on F1

prefs.prefixKey (x, old) -> # change listener
  if x != old then m = CodeMirror.keyMap.dyalogDefault; m["'#{x}'"] = m["'#{old}'"]; delete m["'#{old}'"]
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

CodeMirror.keyMap.dyalogDefault = fallthrough: 'default', End: 'goLineEndSmart'
CodeMirror.keyMap.dyalogDefault["'#{prefs.prefixKey()}'"] = 'BQC'

$.extend CodeMirror.commands,
  TB: -> switchWindows  1; return
  BT: -> switchWindows -1; return
  SA: CodeMirror.commands.selectAll
  CT: -> document.execCommand 'Cut'  ; return
  CP: -> document.execCommand 'Copy' ; return
  PT: -> document.execCommand 'Paste'; return
  TO: CodeMirror.commands.toggleFold
  PRF: -> prefsUI.showDialog(); return
  ABT: -> about.showDialog();   return
  CNC: -> D.rideConnect();      return
  NEW: -> D.rideNewSession();   return
  QIT: -> D.quit();             return
  LBR: -> prefs.lbar.toggle();  return

  HLP: (cm) ->
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

  BQC: (cm) ->
    if cm.dyalogBQ
      c = cm.getCursor(); cm.replaceSelection prefs.prefixKey(), 'end'
    else
      # Make it possible to use `( etc -- remember the original value of
      # autoCloseBrackets, set it temporarily to "false", and restore it when the
      # menu is closed:
      cm.setOption 'autoCloseBrackets', false # this is temporary until bqCleanUp()
      cm.on 'change', bqChangeHandler; cm.dyalogBQ = 1
      c0 = cm.getCursor(); cm.replaceSelection prefs.prefixKey(), 'end'
      ctid = delay 500, ->
        c1 = cm.getCursor()
        if c1.line == c0.line && c1.ch == c0.ch + 1
          cm.showHint
            completeOnSingleClick: true
            extraKeys:
              Backspace: (cm, m) -> m.close(); cm.execCommand 'delCharBefore'; return
              Left:      (cm, m) -> m.close(); cm.execCommand 'goCharLeft'; return
              Right:     (cm, m) -> m.pick(); return
            hint: ->
              pk = prefs.prefixKey(); ks = (for x of bq when x != '☠' then x).sort()
              data = from: c0, to: cm.getCursor(), list: ks.map (k) ->
                if k == pk
                  text: '', hint: bqbqHint, render: (e) -> e.innerHTML = "  #{pk}#{pk} <i>completion by name</i>"; return
                else
                  v = bq[k]; text: v, render: (e) -> $(e).text "#{v} #{pk}#{k} #{squiggleDescriptions[v] || ''}  "; return
              data
        else
          bqCleanUp cm
        return
    return

  goLineEndSmart: (cm) -> # CodeMirror provides a goLineStartSmart but not a goLineEndSmart command.
    cm.extendSelectionsBy(
      ->
        c = cm.getCursor(); l = c.line; s = cm.getLine l; n = s.length; m = s.replace(/\ +$/, '').length
        CodeMirror.Pos l, if m <= c.ch < n || !m then n else m
      origin: '+move', bias: -1
    )
    return

switchWindows = (d) -> # d: a step of either 1 or -1
  a = []; i = -1; for _, w of D.wins then (if w.hasFocus() then i = a.length); a.push w
  j = if i < 0 then 0 else (i + a.length + d) % a.length
  $("#wintab#{a[j].id} a").click(); a[j].focus(); false

# Every geometry (aka "mechanical layout") has its precise arrangement of keys specified as a CSS class.
@geom = geom = US: 'ansi', UK: 'iso', DK: 'iso'

# The quadrants of each layout entry will be turned into an array of four strings without whitespace.
#    0:normal  1:shifted
#    2:APL     3:APL shifted
# They can be indexed by scancode: http://www.abreojosensamblador.net/Productos/AOE/html/Pags_en/ApF.html
# "APL" and "APL shifted" are the defaults upon which the user can build customisations.
layoutDesc =
  US: '''
    ☠ ` 1 2 3 4 5 6 7 8 9 0 - = ☠ ☠   ☠ ~ ! @ # $ % ^ & * ( ) _ + ☠ ☠
    ☠ q w e r t y u i o p [ ] \\      ☠ Q W E R T Y U I O P { } |
    ☠ a s d f g h j k l ; ' ☠ ☠       ☠ A S D F G H J K L : " ☠ ☠
    ☠ ☠ z x c v b n m , . / ☠ ☠       ☠ ☠ Z X C V B N M < > ? ☠ ☠

    ☠ ⋄ ¨ ¯ < ≤ = ≥ > ≠ ∨ ∧ × ÷ ☠ ☠   ☠ ¤ ⌶ ⍫ ⍒ ⍋ ⌽ ⍉ ⊖ ⍟ ⍱ ⍲ ! ⌹ ☠ ☠
    ☠ ? ⍵ ∊ ⍴ ~ ↑ ↓ ⍳ ○ * ← → ⊢       ☠ ⍰ ⍵ ⍷ ⌾ ⍨ ↑ ↓ ⍸ ⍥ ⍣ ⍞ ⍬ ⊣
    ☠ ⍺ ⌈ ⌊ _ ∇ ∆ ∘ ' ⎕ ⍎ ⍕ ☠ ☠       ☠ ⍺ ⌈ ⌊ _ ⍢ ∆ ⍤ ⌸ ⌷ ≡ ≢ ☠ ☠
    ☠ ☠ ⊂ ⊃ ∩ ∪ ⊥ ⊤ | ⍝ ⍀ ⌿ ☠ ☠       ☠ ☠ ⊂ ⊃ ∩ ∪ ⍭ ⍡ ∥ ⍪ ⍙ ⍠ ☠ ☠
  '''
  UK: '''
    ☠ ` 1 2 3 4 5 6 7 8 9 0 - = ☠ ☠   ☠ ¬ ! " £ $ % ^ & * ( ) _ + ☠ ☠
    ☠ q w e r t y u i o p [ ] ☠       ☠ Q W E R T Y U I O P { } ☠
    ☠ a s d f g h j k l ; ' # ☠       ☠ A S D F G H J K L : @ ~ ☠
    ☠ \\z x c v b n m , . / ☠ ☠       ☠ | Z X C V B N M < > ? ☠ ☠

    ☠ ⋄ ¨ ¯ < ≤ = ≥ > ≠ ∨ ∧ × ÷ ☠ ☠   ☠ ¤ ⌶ ⍫ ⍒ ⍋ ⌽ ⍉ ⊖ ⍟ ⍱ ⍲ ! ⌹ ☠ ☠
    ☠ ? ⍵ ∊ ⍴ ~ ↑ ↓ ⍳ ○ * ← → ☠       ☠ ⍰ ⍵ ⍷ ⌾ ⍨ ↑ ↓ ⍸ ⍥ ⍣ ⍞ ⍬ ☠
    ☠ ⍺ ⌈ ⌊ _ ∇ ∆ ∘ ' ⎕ ⍎ ⍕ ⊢ ☠       ☠ ⍺ ⌈ ⌊ _ ⍢ ∆ ⍤ ⌸ ⌷ ≡ ≢ ⊣ ☠
    ☠ ⊢ ⊂ ⊃ ∩ ∪ ⊥ ⊤ | ⍝ ⍀ ⌿ ☠ ☠       ☠ ⊣ ⊂ ⊃ ∩ ∪ ⍭ ⍡ ∥ ⍪ ⍙ ⍠ ☠ ☠
  '''
  DK: '''
    ☠ $ 1 2 3 4 5 6 7 8 9 0 + ´ ☠ ☠   ☠ § ! " # € % & / ( ) = ? ` ☠ ☠
    ☠ q w e r t y u i o p å ¨ ☠       ☠ Q W E R T Y U I O P Å ^ ☠
    ☠ a s d f g h j k l æ ø ' ☠       ☠ A S D F G H J K L Æ Ø * ☠
    ☠ < z x c v b n m , . - ☠ ☠       ☠ > Z X C V B N M ; : _ ☠ ☠

    ☠ ⋄ ¨ ¯ < ≤ = ≥ > ≠ ∨ ∧ × ÷ ☠ ☠   ☠ ¤ ⌶ ⍫ ⍒ ⍋ ⌽ ⍉ ⊖ ⍟ ⍱ ⍲ ! ⌹ ☠ ☠
    ☠ ? ⍵ ∊ ⍴ ~ ↑ ↓ ⍳ ○ * ← → ☠       ☠ ⍰ ⍵ ⍷ ⌾ ⍨ ↑ ↓ ⍸ ⍥ ⍣ ⍞ ⍬ ☠
    ☠ ⍺ ⌈ ⌊ _ ∇ ∆ ∘ ' ⎕ ⍎ ⍕ ⊢ ☠       ☠ ⍺ ⌈ ⌊ _ ⍢ ∆ ⍤ ⌸ ⌷ ≡ ≢ ⊣ ☠
    ☠ ⊢ ⊂ ⊃ ∩ ∪ ⊥ ⊤ | ⍝ ⍀ ⌿ ☠ ☠       ☠ ⊣ ⊂ ⊃ ∩ ∪ ⍭ ⍡ ∥ ⍪ ⍙ ⍠ ☠ ☠
  '''
@layouts = layouts = {}
do ->
  for lc, s of layoutDesc
    q = layouts[lc] = ['', '', '', '']
    for half, i in s.split '\n\n'
      for line in half.split '\n'
        for chunk, j in line.split /\s{3,}/
          q[2 * i + j] += chunk.replace /\s+/g, ''
    console.assert q[0].length == q[1].length == q[2].length == q[3].length
    console.assert geom[lc]
  layoutDesc = null
  return

bq = null # effective ` map as a dictionary, kept in sync with the prefs
do updateBQ = ->
  bq = {}; lc = prefs.kbdLocale(); l = layouts[lc]; n = l[0].length
  for i in [0..1] then for j in [0...n] then bq[l[i][j]] ?= l[2 + i][j]
  if s = prefs.prefixMaps()[lc] then for i in [0...s.length] by 2 then x = s[i]; y = s[i + 1]; bq[x] = y
  return
prefs.prefixMaps updateBQ; prefs.kbdLocale updateBQ

# order: used to measure how "complicated" (for some made-up definition of the word) a shortcut is.
# Tooltips in the lbar show the simplest one.
order = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
complexity = (x) -> (1 + order.indexOf x) || (1 + order.length + x.charCodeAt 0)
@getBQKeyFor = getBQKeyFor = (v) ->
  r = ''; (for x, y of bq when y == v && (!r || complexity(r) > complexity(x)) then r = x); r

bqChangeHandler = (cm, o) -> # o: changeObj
  l = o.from.line; c = o.from.ch
  if o.origin == '+input' && o.text.length == 1 && o.text[0].length == 1
    x = o.text[0]; pk = prefs.prefixKey()
    if x == pk
      if c && cm.getLine(l)[c - 1] == pk then bqCleanUp cm; bqbqHint cm
    else
      if bq[x]
        cm.replaceRange bq[x], {line: l, ch: c - 1}, {line: l, ch: c + 1}, 'D'
        if bq[x] == '∇' && /^\s*∇/.test cm.getLine l then cm.indentLine l, 'smart'
      bqCleanUp cm
  else
    bqCleanUp cm
  return

bqCleanUp = (cm) ->
  cm.off 'change', bqChangeHandler; delete cm.dyalogBQ
  clearTimeout ctid; cm.state.completionActive?.close?()
  cm.setOption 'autoCloseBrackets', !!prefs.autoCloseBrackets() && ACB_VALUE
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

createCommand = (xx) -> CodeMirror.commands[xx] ?= (cm) -> (if (h = cm.dyalogCommands) && h[xx] then h[xx](cm)); return
qw('CBP MA WI SI AC tabOrAutocomplete downOrXline indentMoreOrAutocomplete').forEach createCommand
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
  if xx != '--' then createCommand xx; CodeMirror.keyMap.dyalogDefault["'#{chr 0xf800 + i}'"] = xx
  return
