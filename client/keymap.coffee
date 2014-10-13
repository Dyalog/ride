do ->
  ctid = null # autocompletion timeout id

  window.onhelp = -> false # prevent IE from being silly

  Dyalog.bqCompletions = []
  bqKeybindings = {}
  Dyalog.reverseKeyMap = {}

  ks = ''' `1234567890-=  ~!@#$%^&*()_+
           qwertyuiop[]   QWERTYUIOP{}
           asdfghjkl;\'\\ ASDFGHJKL:"|
           zxcvbnm,./     ZXCVBNM<>?    '''.replace(/^\s*|\s*$/g, '').split /\s*/g

  vs = ''' `¨¯<≤=≥>≠∨∧×÷  ⋄⌶⍫⍒⍋⌽⍉⊖⍟⍱⍲!⌹
           ?⍵∊⍴~↑↓⍳○*←→   ?⍵⍷⍴⍨↑↓⍸⍥⍣⍞⍬
           ⍺⌈⌊_∇∆∘\'⎕⍎⍕⊢  ⍺⌈⌊_∇∆⍤⌸⌷≡≢⊣
           ⊂⊃∩∪⊥⊤|⍝⍀⌿     ⊂⊃∩∪⊥⊤|⍪⍙⍠    '''.replace(/^\s*|\s*$/g, '').split /\s*/g

  ds =
    '¨':'each', '¯':'negative', '∨':'or (GCD)', '∧':'and (LCM)',
    '×':'sgn/times', '÷':'reciprocal/divide', '?':'roll/deal', '⍵':'right arg',
    '∊':'enlist/in', '⍴':'shape/reshape', '~':'not/without', '↑':'mix/take',
    '↓':'split/drop', '⍳':'indices/index of', '○':'pi/trig', '*':'exp/power',
    '←':'assignment', '→':'branch', '⍺':'left arg', '⌈':'ceil/max', '⌊':'floor/min',
    '∇':'recur', '∘':'compose', '⎕':'eval\'ed I/O', '⍎':'eval', '⍕':'format',
    '⊢':'right', '⊂':'enclose/partition', '⊃':'disclose/pick', '∩':'intersect',
    '∪':'uniq/union', '⊥':'decode (1 2 3→123)', '⊤':'encode (123→1 2 3)', '|':'abs/mod',
    '⍝':'comment', '⍀':'\\[⎕io]', '⌿':'/[⎕io]', '⋄':'statement sep', '⌶':'I-beam',
    '⍒':'grade down', '⍋':'grade up', '⌽':'reverse/rotate', '⍉':'transpose',
    '⊖':'⌽[⎕io]', '⍟':'logarithm', '⍱':'nor', '⍲':'nand', '!':'factorial/binomial',
    '⌹':'matrix inv/div', '⍷':'find', '⍨':'switch', '⍣':'power operator',
    '⍞':'char I/O', '⍬':'zilde (⍳0)', '⍤':'rank', '⌸':'key', '⌷':'default/index',
    '≡':'depth/match', '≢':'tally/not match', '⊣':'left', '⍪':'table / ,[⎕io]',
    '⍠':'variant'

  if ks.length != vs.length then console.error? 'bad configuration of backquote keymap'

  do ->
    for k, i in ks when k != (v = vs[i]) || k == '`'
      Dyalog.bqCompletions.push text: v, displayText: "#{v} `#{k} #{ds[v] || ''}  "
      bqKeybindings[k] = v
      Dyalog.reverseKeyMap[v] = k

  Dyalog.setUpBackquoteMappings = (cm) ->
    bq = false
    cm.on 'beforeChange', (cm, changeObj) ->
      if bq
        bq = false; cm.setOption 'autoCloseBrackets', true
        if changeObj.text.length == 1 && (v = bqKeybindings[changeObj.text[0]])
          clearTimeout ctid; ctid = null
          if v != '`' then changeObj.cancel(); cm.replaceSelection v, 'end'
          cm.state.completionActive?.close?()
      else if changeObj.text.length == 1 && changeObj.text[0] == '`'
        bq = true; cm.setOption 'autoCloseBrackets', false
        changeObj.cancel()
        clearTimeout ctid
        ctid = setTimeout(
          ->
            c = cm.getCursor()
            cm.showHint completeOnSingleClick: true, hint: ->
              data = list: Dyalog.bqCompletions, from: c, to: c
              CodeMirror.on data, 'close', -> bq = false; cm.setOption 'autoCloseBrackets', true
              data
            clearTimeout ctid; ctid = null
            return
          500
        )
      return

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

  return
