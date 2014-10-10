do ->
  ctid = null # autocompletion timeout id

  window.onhelp = -> false # prevent IE from being silly

  completions = []
  Dyalog.reverseKeyMap = {}
  CodeMirror.keyMap.dyalogBackquote =
    auto: 'dyalog', nofallthrough: true, disableInput: true

  ks = ''' `1234567890-=  ~!@#$%^&*()_+
           qwertyuiop[]   QWERTYUIOP{}
           asdfghjkl;\'\\ ASDFGHJKL:"|
           zxcvbnm,./     ZXCVBNM<>?    '''.replace(/^\s*|\s*$/g, '').split /\s*/g

  vs = ''' `¨¯<≤=≥>≠∨∧×÷  ⋄⌶⍫⍒⍋⌽⍉⊖⍟⍱⍲!⌹
           ?⍵∊⍴~↑↓⍳○*←→   ?⍵⍷⍴⍨↑↓⍸⍥⍣⍞⍬
           ⍺⌈⌊_∇∆∘\'⎕⍎⍕⊢  ⍺⌈⌊_∇∆⍤⌸⌷≡≢⊣
           ⊂⊃∩∪⊥⊤|⍝⍀⌿     ⊂⊃∩∪⊥⊤|⍪⍙⍠    '''.replace(/^\s*|\s*$/g, '').split /\s*/g

  if ks.length != vs.length then console.error? 'bad configuration of backquote keymap'

  for k, i in ks when k != (v = vs[i]) || k == '`'
    completions.push text: v, displayText: v + ' `' + k + '   '
    Dyalog.reverseKeyMap[v] = k
    CodeMirror.keyMap.dyalogBackquote["'#{k}'"] = do (v = v) ->
      (cm) ->
        clearTimeout ctid; ctid = null; cm.replaceSelection v, 'end'
        cm.state.completionActive?.close?()

  CodeMirror.keyMap.dyalog =
    fallthrough: 'default'
    "'`'": (cm) ->
      cm.setOption 'keyMap', 'dyalogBackquote'
      clearTimeout ctid
      ctid = setTimeout(
        ->
          c = cm.getCursor()
          cm.showHint
            completeOnSingleClick: true
            hint: ->
              data = list: completions, from: c, to: c
              CodeMirror.on data, 'close', -> cm.setOption 'keyMap', 'dyalog'
              data
          clearTimeout ctid; ctid = null
          return
        500
      )

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
