'use strict'
var autocompletion=require('./autocompletion'),prefs=require('./prefs'),cmOnDblClick=require('./util').cmOnDblClick
require('./cm-scroll')
this.Session=function(ide,e,opts){ // Session constructor
  var se=this;se.ide=ide;se.opts=opts;se.emit=opts.emit;se.hist=[''];se.histIdx=0;se.focusTimestamp=0
  se.dirty={} // modified lines: lineNumber→originalContent, inserted lines: lineNumber→0 (also used in cm-apl-mode.js)
  se.$e=$(e).addClass('ride-win')
  var cm=se.cm=CodeMirror(se.$e[0],{
    autofocus:true,mode:{name:'apl-session',se:se},matchBrackets:!!prefs.matchBrackets(),readOnly:true,keyMap:'dyalog',
    lineWrapping:!!prefs.wrap(),indentUnit:4,smartIndent:0,autoCloseBrackets:{pairs:'()[]{}',explode:''},
    scrollbarStyle:'simple',extraKeys:{'Shift-Tab':'indentLess',Tab:'tabOrAutocomplete'},
  })
  cm.dyalogCommands=se
  cmOnDblClick(cm,function(e){se.ED(cm);e.stopPropagation();e.preventDefault()})
  cm.on('focus',function(){se.focusTimestamp=+new Date;ide.focusedWin=se})
  cm.on('beforeChange',function(_,c){
    if(c.origin!=='D'){
      var l0=c.from.line,l1=c.to.line,m=l1-l0+1,n=c.text.length
      if(n<m){
        if(c.update){
          var text=c.text.slice(0);for(var j=n;j<m;j++)text.push('') // pad shrinking changes with empty lines
          c.update(c.from,c.to,text);n=m
        }else{
          c.cancel();return // the change is probably the result of Undo
        }
      }else if(m<n){
        var h=se.dirty;se.dirty={};for(var x in h)se.dirty[x+(n-m)*(x>l1)]=h[x]
      }
      var l=l0
      while(l<=l1){var base=se.dirty;base[l]==null&&(base[l]=se.cm.getLine(l));l++}
      while(l<l0+n)se.dirty[l++]=0
    }
  })
  cm.on('change',function(_,c){
    if(c.origin!=='D'){
      var l0=c.from.line,l1=c.to.line,m=l1-l0+1,n=c.text.length
      for(var l in se.dirty)se.cm.addLineClass(+l,'background','modified')
    }
  })
  se.promptType=0 // 0=Invalid 1=Descalc 2=QuadInput 3=LineEditor 4=QuoteQuadInput 5=Prompt
  se.autocomplete=autocompletion.setUp(se)
  prefs.wrap(function(x){se.cm.setOption('lineWrapping',!!x);se.scrollCursorIntoView()})
}
this.Session.prototype={
  histAdd:function(lines){this.hist[0]='';[].splice.apply(this.hist,[1,0].concat(lines));this.histIdx=0},
  histMove:function(d){
    var i=this.histIdx+d
    if(i<0)$.alert('There is no next line','Dyalog APL Error')
    else if(i>=this.hist.length)$.alert('There is no previous line','Dyalog APL Error')
    else{
      var l=this.cm.getCursor().line
      if(!this.histIdx)this.hist[0]=this.cm.getLine(l)
      if(this.hist[i]!=null){
        this.cm.replaceRange(this.hist[i],{line:l,ch:0},{line:l,ch:this.cm.getLine(l).length},'D')
        this.cm.setCursor({line:l,ch:this.hist[i].replace(/[^ ].*$/,'').length})
        this.histIdx=i
      }
    }
  },
  add:function(s){
    var cm=this.cm,l=cm.lastLine(),s0=cm.getLine(l)
    cm.replaceRange((cm.getOption('readOnly')?(s0+s):s),{line:l,ch:0},{line:l,ch:s0.length},'D')
    cm.setCursor(cm.lastLine(),0)
  },
  prompt:function(why){ // why: 0=NoPrompt 1=Descalc 2=QuadInput 3=LineEditor 4=QuoteQuadInput 5=Prompt
    var cm=this.cm
    this.promptType=why;cm.setOption('readOnly',!why);cm.setOption('cursorHeight',+!!why)
    var l=cm.lastLine()
    if(why===1&&this.dirty[l]==null||[0,1,3,4].indexOf(why)<0){
      cm.replaceRange('      ',{line:l,ch:0},{line:l,ch:cm.getLine(l).length},'D')
    }else if('      '===cm.getLine(l)){
      cm.replaceRange('',{line:l,ch:0},{line:l,ch:6},'D')
    }else{
      cm.setCursor(l,cm.getLine(l).length)
    }
    why&&cm.clearHistory()
  },
  updateSize:function(){
    var i=this.cm.getScrollInfo(),b=5>Math.abs(i.top+i.clientHeight-i.height) // b:are we at the bottom edge?
    this.cm.setSize(this.$e.width(),this.$e.height());b&&this.scrollCursorIntoView();this.updatePW()
  },
  updatePW:function(force){ // force:emit a SetPW message even if the width hasn't changed
    var pw=Math.max(42,Math.floor((this.$e.width()-this.cm.display.scrollbarFiller.clientWidth)/this.cm.defaultCharWidth()))
    if(pw!==this.pw||force){this.emit('SetPW',{pw:pw});this.pw=pw}
  },
  scrollCursorIntoView:function(){
    var cm=this.cm;cm.scrollTo(0,cm.getScrollInfo().top);setTimeout(function(){cm.scrollIntoView()},1)
  },
  hasFocus:function(){return window.focused&&this.cm.hasFocus()},
  focus:function(){window.focused||window.focus();this.cm.focus()},
  insert:function(ch){this.cm.getOption('readOnly')||this.cm.replaceSelection(ch)},
  die:function(){this.cm.setOption('readOnly',true)},
  getDocument:function(){return this.$e[0].ownerDocument},
  refresh:function(){this.cm.refresh()},
  loadLine:function(s){var cm=this.cm,l=cm.lastLine();cm.replaceRange(s,{line:l,ch:0},{line:l,ch:cm.getLine(l).length})},
  exec:function(trace){
    var es,l,ls,se=this
    if(this.promptType){
      ls=[]
      for(l in this.dirty)ls.push(+l)
      if(ls.length){
        ls.sort(function(x,y){return x-y})
        es=ls.map(function(l){return se.cm.getLine(l)||''}) // strings to execute
        ls.reverse().forEach(function(l){
          se.cm.removeLineClass(l,'background','modified')
          se.dirty[l]===0?se.cm.replaceRange('',{line:l,ch:0},{line:l+1,ch:0},'D')
                         :se.cm.replaceRange(se.dirty[l],{line:l,ch:0},{line:l,ch:(se.cm.getLine(l)||'').length||0},'D')
        })
      }else{
        es=[this.cm.getLine(this.cm.getCursor().line)]
      }
      this.opts.exec(es,trace);this.dirty={};this.histAdd(es.filter(function(x){return!/^\s*$/.test(x)}))
      this.cm.clearHistory()
    }
  },
  ED:function(cm){var c=cm.getCursor();this.emit('Edit',{win:0,pos:c.ch,text:cm.getLine(c.line)})},
  BK:function(){this.histMove(1)},
  FD:function(){this.histMove(-1)},
  QT:function(cm){
    var c=cm.getCursor(),l=c.line
    if(this.dirty[l]===0){
      l===cm.lastLine()?cm.replaceRange('',{line:l,ch:0},{line:l+1,ch:0},'D')
                       :cm.replaceRange('',{line:l-1,ch:cm.getLine(l-1).length},{line:l,ch:cm.getLine(l).length},'D')
      delete this.dirty[l];var h=this.dirty;this.dirty={};for(var x in h)this.dirty[x-(x>l)]=h[x]
    }else if(this.dirty[l]!=null){
      cm.replaceRange(this.dirty[l],{line:l,ch:0},{line:l,ch:cm.getLine(l).length},'D')
      cm.removeLineClass(l,'background','modified');cm.setCursor(l+1,c.ch);delete this.dirty[l]
    }
  },
  EP:function(){this.ide.focusMRUWin()},
  ER:function(){this.exec(0)},
  TC:function(){this.exec(1)},
  tabOrAutocomplete:function(cm){
    if(cm.somethingSelected()){
      cm.execCommand('indentMore')
    }else if(this.promptType!==4){ // never autocomplete in ⍞ input
      var c=cm.getCursor(),s=cm.getLine(c.line)
      if(/^ *$/.test(s.slice(0,c.ch))){cm.execCommand('indentMore')}
      else{this.autocompleteWithTab=1;this.emit('GetAutoComplete',{line:s,pos:c.ch,token:0})}
    }
  },
  CLM:function(cm){
    var sels=cm.listSelections()
    for(var i=0;i<sels.length;i++){
      var a=sels[i].anchor.line,b=sels[i].head.line;if(a>b){var c=a;a=b;b=c}
      for(var l=a;l<=b;l++){delete this.dirty[l];cm.removeLineClass(l,'background','modified')}
    }
  }
}
