// https://codemirror.net/doc/manual.html#modeapi
var prefs=require('./prefs')
var // regexes
  letter=this.letter='A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ',
  name0=RegExp('['+letter+']'),
  name1=RegExp('['+letter+'\\d]*'),
  name='(?:['+letter+']['+letter+'\\d]*)',
  notName=RegExp('[^'+letter+'0-9]+'),
  end='(?:⍝|$)',
  dfnHeader=RegExp(
    '^\\s*'+name+'\\s*←\\s*\\{\\s*(?:'+
      end+'|'+
      '[^'+letter+'⍝\\s]|'+
      name+'\\s*(?:'+
        '\\}\\s*'+end+'|'+
        end+'|'+
        '[^'+letter+'\\d\\}⍝\\s]'+
        '|\\s[^\\}⍝\\s]'+
      ')'+
    ')'
  )

var quadNames=['á','a','af','ai','an','arbin','arbout','arg','at','av','avu','base','class','clear','cmd','cr','cs',
'ct','cy','d','dct','df','div','dl','dm','dmx','dq','dr','ea','ec','ed','em','en','env','es','et','ex','exception',
'export','fappend','favail','fc','fchk','fcopy','fcreate','fdrop','ferase','fhold','fix','flib','fmt','fnames','fnums',
'fprops','fr','frdac','frdci','fread','frename','freplace','fresize','fsize','fstac','fstie','ftie','funtie','fx','inp',
'instances','io','kl','l','lc','load','lock','lx','map','ml','monitor','na','nappend','nc','ncreate','nerase','new',
'nl','nlock','nnames','nnums','nq','nr','nread','nrename','nreplace','nresize','ns','nsi','nsize','ntie','null',
'nuntie','nxlate','off','or','opt','path','pfkey','pp','pr','profile','ps','pt','pw','refs','r','rl','rsi','rtl','s',
'save','sd','se','sh','shadow','si','signal','size','sm','sr','src','stack','state','stop','svc','sve','svo','svq',
'svr','svs','syl','tc','tcnums','tf','tget','this','tid','tkill','tname','tnums','tpool','tput','treq','trace','trap',
'ts','tsync','tz','ucs','ul','using','vfi','vr','wa','wc','wg','wn','ws','wsid','wx','x','xml','xsi','xt']

// « and » prevent tolerance for extra whitespace
// _ stands for «' '» (space as an APL character literal)
var idioms=['⍴⍴','/⍳','/⍳⍴','⊃¨⊂','{}','{⍺}','{⍵}','{⍺⍵}','{0}','{0}¨',',/','⍪/','⊃⌽','↑⌽','⊃⌽,','↑⌽,','0=⍴','0=⍴⍴',
'0=≡','{(↓⍺)⍳↓⍵}','↓⍉↑','↓⍉⊃','∧\\_=','+/∧\\_=','+/∧\\\n{(∨\\_≠⍵)/⍵}','{(+/∧\\_=⍵)↓⍵}','~∘_¨↓','{(+/∨\\_≠⌽⍵)↑¨↓⍵}',
'⊃∘⍴¨','↑∘⍴¨',',←','⍪←','{⍵[⍋⍵]}','{⍵[⍒⍵]}','{⍵[⍋⍵;]}','{⍵[⍒⍵;]}','1=≡','1=≡,','0∊⍴\n~0∊⍴','⊣⌿','⊣/','⊢⌿','⊢/','*○',
'0=⊃⍴','0≠⊃⍴','⌊«0.5»+','«⎕AV»⍳']
function escRE(s){return s.replace(/[\(\)\[\]\{\}\.\?\+\*\/\\\^\$\|]/g,function(x){return'\\'+x})}
function escIdiom(s){
  return s.replace(/«(.*?)»|(.)/g,function(_,g,g2){g||(g=g2);return' *'+(g==='_'?"' '":escRE(g))}).slice(2)
}
var idiomsRE=RegExp('^(?:'+(idioms.sort(function(x,y){return y.length-x.length}).map(escIdiom).join('|'))+')','i')

var sw=4,swm=2 // default indent unit and indent unit for methods; these are kept in sync with prefs
function updateSW(){sw=prefs.indent();swm=prefs.indentMethods();swm<0&&(swm=sw)}
updateSW();prefs.indent(updateSW);prefs.indentMethods(updateSW)

var icom=prefs.indentComments()
prefs.indentComments(function(x){icom=x})

var dfnDepth=this.dfnDepth=function(a){var r=0;for(var j=0;j<a.length;j++)a[j].t==='{'&&r++;return r}

CodeMirror.defineMIME('text/apl','apl')
CodeMirror.defineMode('apl',function(){
  var comMode=CodeMirror.getMode({},'text/apl-comments');if(!comMode.token||!comMode.startState)comMode=null
  return{
    startState:function(){
      // hdr       are we at a location where a tradfn header can be expected?
      // a         stack of objects with the following properties
      //   t       the opening token -- a keyword (without the colon) or '{', '[', '(', '∇'
      //   oi      outer indent -- the indent of the opening token's line
      //   ii      inner indent -- the indent of the block's body; it can be adjusted later
      // kw        current keyword
      // vars      local names in a tradfn
      // comState  state of the inner mode for syntax highlighting inside comments
      return{hdr:1,a:[{t:'',oi:0,ii:0}]}
    },
    token:function(stream,h){ // h:state
      var ref4, ref5, s, x, y
      var a=h.a,la=a[a.length-1],n=stream.indentation(),c
      if(stream.sol()){delete h.kw;if(!stream.match(/^\s*(:|∇|$)/,false)){a[a.length-1]=$.extend({ii:n},la)}}
      if(h.hdr){
        delete h.hdr;stream.match(/[^⍝\n\r]*/);s=stream.current()
        if(/^\s*:/.test(s)||dfnHeader.test(s)){stream.backUp(s.length)}else{h.vars=s.split(notName)}
        return'apl-trad'
      }else if(h.comState){
        if(stream.sol()){
          return delete h.comState
        }else{
          var h1=CodeMirror.copyState(comMode,h.comState)
          var r=comMode.token(stream,h1)
          h.comState=CodeMirror.copyState(comMode,h1)
          return r+' apl-com'
        }
      }else if(stream.match(idiomsRE)){
        return'apl-idm'
      }else if(stream.match(/^¯?(?:\d*\.)?\d+(?:e¯?\d+)?(?:j¯?(?:\d*\.)?\d+(?:e¯?\d+)?)?/i)){
        return'apl-num'
      }else if(!(c=stream.next())){
        return null
      }else{
        switch(c){
          case' ':stream.eatSpace();return null
          case'⍝':comMode?(h.comState=comMode.startState()):stream.skipToEnd();return'apl-com'
          case'⋄':delete h.kw;return la.t!=='('&&la.t!=='['?'apl-diam':'apl-err'
          case'←':return'apl-asgn'
          case"'":if(stream.match(/^(?:[^'\r\n]|'')*'/)){return'apl-str'}else{stream.skipToEnd();return'apl-err'}
          case'⍬':return'apl-zld'
          case'(':a.push({t:c,oi:la.oi,ii:la.ii});return'apl-par'
          case'[':a.push({t:c,oi:la.oi,ii:la.ii});return'apl-sqbr'
          case'{':a.push({t:c,oi:n,ii:n+sw});return'apl-dfn'+dfnDepth(a)+' apl-dfn'
          case')':if(la.t==='('){a.pop();return'apl-par' }else{return'apl-err'}
          case']':if(la.t==='['){a.pop();return'apl-sqbr'}else{return'apl-err'}
          case'}':if(la.t==='{'){a.pop();return'apl-dfn'+(1+dfnDepth(a))+' apl-dfn'}else{return'apl-err'}
          case';':return la.t==='['?'apl-semi':'apl-err'
          case'⎕':
            var m=stream.match(/[áa-z0-9]*/i);return m&&quadNames.indexOf(m[0].toLowerCase())>=0?'apl-quad':'apl-err'
          case'⍞':return'apl-quad'
          case'#':return'apl-ns'
          case'⍺':case'⍵':case'∇':case':':
            var dd
            if(dd=dfnDepth(a)){
              return'apl-dfn apl-dfn'+dd
            }else if(c==='∇'){
              var i=a.length-1;while(i&&a[i].t!=='∇')i--
              if(i){a.splice(i);delete h.vars}else{a.push({t:'∇',oi:n,ii:n+swm});h.hdr=1}
              return'apl-trad'
            }else if(c===':'){
              var ok=0,m=stream.match(/^\w*/),kw=m?m[0].toLowerCase():''
              switch(kw){
                case'class':case'disposable':case'for':case'hold':case'if':case'interface':case'namespace':
                case'property':case'repeat':case'section':case'select':case'trap':case'while':case'with':
                  a.push({t:kw,oi:n,ii:n+sw});ok=1;break
                case'end':
                  ok=a.length>1&&la.t!=='∇'
                  ok && a.pop()
                  break
                case'endclass':case'enddisposable':case'endfor':case'endhold':case'endif':case'endinterface':
                case'endnamespace':case'endproperty':case'endrepeat':case'endsection':case'endselect':case'endtrap':
                case'endwhile':case'endwith':case'until':
                  var kw0=kw==='until'?'repeat':kw.slice(3) // corresponding opening keyword
                  ok=la.t===kw0
                  if(ok){a.pop()}else{var i=a.length-1;while(i&&a[i].t!==kw0)i--;i&&a.splice(i)}
                  break
                case'else':                          ok=la.t==='if'||la.t==='select'||la.t==='trap';break
                case'elseif':case'andif':case'orif': ok=la.t==='if';break
                case'in':case'ineach':               ok=la.t==='for';break
                case'case':case'caselist':           ok=la.t==='select'||la.t==='trap';break
                case'leave':case'continue':          ok=la.t==='for'||la.t==='while'||la.t==='continue';break
                case'access': ok=la.t==='class'||la.t==='∇';stream.match(/(?:\s+\w+)+/);ok=1;break
                case'base':case'field':case'goto':case'include':case'return':case'using': ok=1;break
                case'implements':
                  var m=stream.match(/\s+(\w+)/)
                  if(m){
                    var x=m[1].toLowerCase(),ys=['constructor','destructor','method','trigger']
                    for(var j=0;j<ys.length;j++)if(x===ys[j].slice(0,x.length)){ok=1;break}
                  }else{
                    ok=1
                  }
                  break
                case'': ok=h.kw==='class' // ":" is allowed after ":Class" to specify inheritance
              }
              if(ok){h.kw=kw;return'apl-kw'}else{delete h.kw;return'apl-err'}
            }
            break
          default:
            if(name0.test(c)){
              stream.match(name1)
              var x=stream.current(),dd=dfnDepth(a)
              return !dd&&stream.match(/:/) ? 'apl-lbl' : dd||h.vars&&h.vars.indexOf(x)>=0 ? 'apl-var' : 'apl-glb'
            }
            return/[\+\-×÷⌈⌊\|⍳\?\*⍟○!⌹<≤=≥>≠≡≢∊⍷∪∩~∧∨⍲⍱⍴,⍪⌽⊖⍉↑↓⊂⊃⌷⍋⍒⊤⊥⍕⍎⊣⊢→]/.test(c)?'apl-fn':
                  /[\/\\⌿⍀¨⍨⌸⌶&]/.test(c)?'apl-op1':/[\.∘⍤⍣⍠]/.test(c)?'apl-op2':'apl-err'
        }
      }
    },
    electricInput:/(?::end|:else|:andif|:orif|:case|:until|:access|\}|∇)$/, // these trigger a re-indent
    indent:function(h,s){ // h:state, s:textAfter
      var a=h.a,la=a[a.length-1]
      if(!icom&&/^\s*⍝/.test(s))return CodeMirror.Pass
      else if(dfnDepth(a))return/^\s*\}/.test(s)?la.oi:la.ii
      else if(/^\s*∇/.test(s)){var i=a.length-1;while(i&&a[i].t!=='∇')i--;return i?a[i].oi:la.ii}
      else if(/^\s*:access/i.test(s))return la.t==='class'?la.oi:la.ii
      else return/^\s*:(?:end|else|andif|orif|case|until)/i.test(s)?la.oi:la.ii
    },
    fold:'apl'
  }
})

// stackStr(h): a string representation of the block stack in CodeMirror's state object "h"
function stackStr(h){var a=h.a,r='';for(var i=0;i<a.length;i++)r+=a[i].t+' ';return r}

function isPrefix(x,y){return x===y.slice(0,x.length)}

CodeMirror.registerHelper('fold','apl',function(cm,start){
  var l,l0=l=start.line,end=cm.lastLine(),x,y
      x0=stackStr(cm.getStateAfter(l0-1)), // x0: the stackStr at the beginning of start.line
      y0=stackStr(cm.getStateAfter(l0))    // y0: the stackStr at the end of start.line
  if(x0!==y0&&isPrefix(x0,y0)){
    while(++l<=end){
      x=stackStr(cm.getStateAfter(l-1))    // x:  the stackStr at the beginning of the current line
      y=stackStr(cm.getStateAfter(l))      // y:  the stackStr at the end of the current line
      if(!isPrefix(y0,x)||!isPrefix(y0,y))break
    }
    if(l<=end&&x0===y&&isPrefix(y,x)){
      while(l+1<=end&&/^ *$/.test(cm.getLine(l+1)))l++
      return{from:CodeMirror.Pos(l0,cm.getLine(l0).length),to:CodeMirror.Pos(l,cm.getLine(l).length)}
    }
  }
})
