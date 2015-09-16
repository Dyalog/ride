// To use this extension:
//   export DYALOG_IDE_JS=/path/to/file.js
// before running RIDE.

// For how to write CodeMirror modes, see https://codemirror.net/doc/manual.html#modeapi
CodeMirror.defineMIME('text/apl-comments','acme')
CodeMirror.defineMode('acme',function(){
  return{
    startState:function(){return{}},
    token:function(stream,state){
      var c=stream.next()
      return /\d/.test(c)?'acme-digit':/[a-z]/i.test(c)?'acme-letter':''
    }
  }
})

// Dyalog API for adding extra syntax highlighting groups to Preferences>Colours:
D.addSyntaxGroups([
  {t:'acme-digit', s:'ACME Digit', c:'.cm-apl-com.cm-acme-digit'},
  {t:'acme-letter',s:'ACME Letter',c:'.cm-apl-com.cm-acme-letter'}
])
