'use strict'
//session
//holds a reference to a CodeMirror instance (.cm) and processes some of its commands (e.g. .ED(), .ER(), ...)
D.Se=function(ide){ //constructor
  var se=this;se.ide=ide;se.hist=[''];se.histIdx=0;se.focusTS=0;se.id=0
  se.dirty={} //modified lines: lineNumber→originalContent, inserted lines: lineNumber→0 (also used in syn.js)
  se.dom=document.createElement('div');se.dom.className='ride_win';se.$e=$(se.dom)
  se.dom.oncontextmenu=D.oncmenu
  var cm=se.cm=CM(se.dom,{
    autofocus:true,mode:{name:'apl-session',se:se},matchBrackets:!!D.prf.matchBrackets(),readOnly:true,keyMap:'dyalog',
    lineWrapping:!!D.prf.wrap(),indentUnit:4,smartIndent:0,autoCloseBrackets:{pairs:'()[]{}',explode:''},
    scrollbarStyle:'simple',extraKeys:{'Shift-Tab':'indentLess',Tab:'indentOrComplete'},
    cursorBlinkRate:D.prf.blinkCursor()*CM.defaults.cursorBlinkRate,
  });D.prf.blockCursor()&&CM.addClass(cm.getWrapperElement(),'cm-fat-cursor')
  cm.dyalogCmds=se
  D.util.cmOnDblClick(cm,function(e){se.ED(cm);e.stopPropagation();e.preventDefault()})
  cm.on('scroll',function(c){var i=c.getScrollInfo();se.btm=i.clientHeight+i.top})
  cm.on('focus',function(){se.focusTS=+new Date;ide.focusedWin=se})
  cm.on('beforeChange',function(_,c){ //keep track of inserted/deleted/changed lines, use se.dirty for that
    if(c.origin==='D')return
    var l0=c.from.line,l1=c.to.line,m=l1-l0+1,n=c.text.length
    if(m<n){var h=se.dirty;se.dirty={};for(var x in h)se.dirty[x+(n-m)*(x>l1)]=h[x]}
    else if(n<m){if(!c.update){c.cancel();return} //the change is probably the result of Undo
                 var text=c.text.slice(0);for(var j=n;j<m;j++)text.push('') //pad shrinking changes with empty lines
                 c.update(c.from,c.to,text);n=m}
    var l=l0;while(l<=l1){var base=se.dirty;base[l]==null&&(base[l]=se.cm.getLine(l));l++}
    while(l<l0+n)se.dirty[l++]=0
  })
  cm.on('change',function(_,c){if(c.origin==='D')return
                               var l0=c.from.line,l1=c.to.line,m=l1-l0+1,n=c.text.length
                               for(var l in se.dirty)se.cm.addLineClass(+l,'background','modified')})
  se.promptType=0 //see ../docs/protocol.md #SetPromptType
  se.processAutocompleteReply=D.ac(se) //delegate autocompletion processing to ac.js
  D.prf.wrap(function(x){se.cm.setOption('lineWrapping',!!x);se.scrollCursorIntoView()})
  D.prf.blockCursor(function(x){
    for(var i in D.wins)D.wins[i].blockCursor(!!x)})
  D.prf.blinkCursor(function(x){
    for(var i in D.wins)D.wins[i].blinkCursor(D.prf.blinkCursor()*CM.defaults.cursorBlinkRate)})
  this.vt=D.vt(this) //value tips
}
D.Se.prototype={
  histAdd:function(lines){this.hist[0]='';[].splice.apply(this.hist,[1,0].concat(lines));this.histIdx=0},
  histMove:function(d){ //go back or forward in history
    var i=this.histIdx+d, l=this.cm.getCursor().line
    if(i<0                ){$.alert('There is no next line'    ,'Dyalog APL Error');return}
    if(i>=this.hist.length){$.alert('There is no previous line','Dyalog APL Error');return}
    if(!this.histIdx)this.hist[0]=this.cm.getLine(l)
    if(this.hist[i]==null)return
    this.cm.replaceRange(this.hist[i],{line:l,ch:0},{line:l,ch:this.cm.getLine(l).length})
    this.cm.setCursor({line:l,ch:this.hist[i].search(/\S|$/)})
    this.histIdx=i
  },
  add:function(s){ //append text to session
    var cm=this.cm,l=cm.lastLine(),s0=cm.getLine(l),p='      ',sp=s.slice(-1)=='\n'?s+p:s
    if(this.dirty[l]!=null){ 
      var cp=cm.getCursor()
      cm.replaceRange(s0+'\n'+sp,{line:l,ch:0},{line:l,ch:s0.length},'D')
      cm.setCursor(cp)
    } else {
      sp=cm.getOption('readOnly')&&s0!==p?(s0+sp):sp
      cm.replaceRange(sp,{line:l,ch:0},{line:l,ch:s0.length},'D')
      cm.setCursor({line:cm.lastLine()})
      var i=cm.getScrollInfo()
      this.btm=Math.max(i.clientHeight+i.top,cm.heightAtLine(cm.lastLine(),"local"))
    }
  },
  prompt:function(x){
    var cm=this.cm,l=cm.lastLine(),t=cm.getLine(l);
    this.promptType=x;cm.setOption('readOnly',!x);cm.setOption('cursorHeight',+!!x)
    
    if(x===1&&this.dirty[l]==null||[0,1,3,4].indexOf(x)<0)
      cm.replaceRange('      ',{line:l,ch:0},{line:l,ch:t.length},'D')
    else if('      '===t)cm.replaceRange('',{line:l,ch:0},{line:l,ch:6},'D')
    else cm.setCursor(l,t.length)
    x&&cm.clearHistory()
  },
  updSize:function(){
    var i=this.cm.getScrollInfo(),top=i.top,
      ontop=top>this.cm.heightAtLine(this.cm.lastLine(),"local")-i.clientHeight;
    this.cm.setSize(this.dom.clientWidth,this.dom.clientHeight);this.updPW()
    if (ontop){this.btm=top+this.cm.getScrollInfo().clientHeight;
    }else if(i.top==0){this.btm+=this.cm.getScrollInfo().clientHeight-i.clientHeight}
  },
  updPW:function(force){ //force:emit a SetPW message even if the width hasn't changed
    //discussion about CodeMirror's width in chars: https://github.com/codemirror/CodeMirror/issues/3618
    //We can get the scrollbar's width through cm.display.scrollbarFiller.clientWidth, it's 0 if not present.
    //But it's better to reserve a hard-coded width for it regardless of its presence.
    var pw=Math.max(42,Math.floor((this.dom.clientWidth-20)/this.cm.defaultCharWidth()))
    if(pw!==this.pw&&this.ide.connected||force)D.send('SetPW',{pw:this.pw=pw})
  },
  scrollCursorIntoView:function(){
    var cm=this.cm;cm.scrollTo(0,cm.getScrollInfo().top);setTimeout(function(){cm.scrollIntoView()},1)
  },
  saveScrollPos:function(){ //workaround for CodeMirror scrolling up to the top under GoldenLayout when editor is closed
    if(this.btm==null){var i=this.cm.getScrollInfo();this.btm=i.clientHeight+i.top}
  },
  restoreScrollPos:function(){
    if(this.btm!=null){var i=this.cm.getScrollInfo();this.cm.scrollTo(0,this.btm-i.clientHeight)}
  },
  stateChanged:function(){var w=this;w.updSize();w.cm.refresh();w.updGutters&&w.updGutters();w.restoreScrollPos()},
  blockCursor:function(x){this.cm.getWrapperElement().classList.toggle('cm-fat-cursor',!!x)},
  blinkCursor:function(x){this.cm.setOption("cursorBlinkRate",x)},
  hasFocus:function(){return this.cm.hasFocus()},
  focus:function(){
    var q=this.container,p=q&&q.parent,l=q&&q.layoutManager,m=l&&l._maximisedItem
    if(m&&m!==(p&&p.parent))m.toggleMaximise()
    while(p){p.setActiveContentItem&&p.setActiveContentItem(q);q=p;p=p.parent} //reveal in golden layout
    window.focused||window.focus();this.cm.focus()
  },
  insert:function(ch){this.cm.getOption('readOnly')||this.cm.replaceSelection(ch)},
  die:function(){this.cm.setOption('readOnly',true)},
  getDocument:function(){return this.dom.ownerDocument},
  refresh:function(){this.cm.refresh()},
  loadLine:function(s){var cm=this.cm,l=cm.lastLine();cm.replaceRange(s,{line:l,ch:0},{line:l,ch:cm.getLine(l).length})},
  exec:function(trace){
    var w,es,l,ls=[],se=this;if(!se.promptType)return
    for(l in se.dirty)ls.push(+l)
    if(ls.length){
      ls.sort(function(x,y){return x-y})
      es=ls.map(function(l){return se.cm.getLine(l)||''}) //strings to execute
      ls.reverse().forEach(function(l){
        se.cm.removeLineClass(l,'background','modified')
        se.dirty[l]===0?se.cm.replaceRange('',{line:l,ch:0},{line:l+1,ch:0},'D')
                       :se.cm.replaceRange(se.dirty[l],{line:l,ch:0},{line:l,ch:(se.cm.getLine(l)||'').length||0},'D')
      })
    }else{
      es=[se.cm.getLine(se.cm.getCursor().line)]
      if (trace&&/^\s*$/.test(es[0])&&(w=se.ide.tracer())){
        w.focus();return
      }
    }
    se.ide.exec(es,trace);se.dirty={};se.histAdd(es.filter(function(x){return!/^\s*$/.test(x)}));se.cm.clearHistory()
  },
  autoCloseBrackets:function(x){this.cm.setOption('autoCloseBrackets',x)},
  matchBrackets:function(x){this.cm.setOption('matchBrackets',!!x)},
  zoom:function(z){
    var w=this,b=w.getDocument().body,
      top=w.cm.heightAtLine(w.cm.lastLine(),"local")<w.btm,i=w.cm.getScrollInfo(),
      line=w.cm.lineAtHeight(top?i.top:w.btm,'local'),
      diff=w.btm-line*w.cm.defaultTextHeight(),
      ch=i.clientHeight
    b.className='zoom'+z+' '+b.className.split(/\s+/).filter(function(s){return!/^zoom-?\d+$/.test(s)}).join(' ')
    w.refresh()
    w.btm=w.cm.defaultTextHeight()*line+(top?ch+5:diff)+w.cm.getScrollInfo().clientHeight-ch
  },
  
  ValueTip:function(x){this.vt.processReply(x)},
  ED:function(cm){
    var c=cm.getCursor(),txt=cm.getLine(c.line);
    if(/^\s*$/.test(txt)){
      var tc=this.ide.tracer();if(tc){tc.focus();tc.ED(tc.cm)}
    } else {
    //D.send('Edit',{win:0,pos:c.ch,text:txt,unsaved:this.ide.getUnsaved()})
      this.ide.Edit({win:0,pos:c.ch,text:txt});
    }
  },
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
      cm.removeLineClass(l,'background','modified');cm.setCursor(l,this.dirty[l].search(/\S|$/));delete this.dirty[l]
    }
  },
  EP:function(){this.ide.focusMRUWin()},
  ER:function(){this.exec(0)},
  LN:function(){D.prf.lineNums.toggle()},
  TC:function(){this.exec(1)},
  MA:function(){D.send('RestartThreads',{win:0})},
  indentOrComplete:function(cm){
    var u=cm.getCursor(),s=cm.getLine(u.line)
    if(cm.somethingSelected()||this.promptType===4||/^ *$/.test(s.slice(0,u.ch))){cm.execCommand('indentMore');return}
    this.autocompleteWithTab=1;D.send('GetAutocomplete',{line:s,pos:u.ch,token:0,win:0})
  }
}
