;(function(){'use strict'
var ACB_VALUE={pairs:'()[]{}',explode:'{}'} //value for CodeMirror's "autoCloseBrackets" option when on

//represents an editor (.tc==0) or a tracer (.tc==1)
//holds a ref to a CodeMirror instance (.cm),
//handles most CodeMirror commands in editors (e.g. .LN(), .QT(), .TL(), ...)
D.Ed=function(ide,opts){ //constructor
  var ed=this;ed.ide=ide;ed.id=opts.id;ed.name=opts.name;ed.tc=opts.tc
  ed.dom=I.ed_tmpl.cloneNode(1);ed.dom.id=null;ed.dom.style.display='';ed.$e=$(ed.dom);ed.jumps=[];ed.focusTS=0
  ed.dom.oncontextmenu=D.oncmenu 
  ed.oText='';ed.oStop=[] //remember original text and "stops" to avoid pointless saving on EP
  ed.cm=CM(ed.dom.querySelector('.ride_win_cm'),{
    lineNumbers:!!D.prf.lineNums(),firstLineNumber:0,lineNumberFormatter:function(i){return'['+i+']'},
    smartIndent:!D.prf.ilf()&&D.prf.indent()>=0,indentUnit:D.prf.indent(),scrollButtonHeight:12,matchBrackets:!!D.prf.matchBrackets(),
    autoCloseBrackets:!!D.prf.autoCloseBrackets()&&ACB_VALUE,foldGutter:!!D.prf.fold(),scrollbarStyle:'simple',
    keyMap:'dyalog',extraKeys:{'Shift-Tab':'indentLess',Tab:'indentOrComplete',Down:'downOrXline'},
    viewportMargin:Infinity,
    cursorBlinkRate:D.prf.blinkCursor()*CM.defaults.cursorBlinkRate,
  });D.prf.blockCursor()&&CM.addClass(ed.cm.getWrapperElement(),'cm-fat-cursor')
  ed.cm.dyalogCmds=ed
  ed.cm.on('cursorActivity',ed.cursorActivity.bind(ed))
  ed.cm.on('gutterClick',function(cm,l,g){ //g:gutter
    if(g==='breakpoints'||g==='CodeMirror-linenumbers'){cm.setCursor({line:l,ch:0});ed.BP(ed.cm)}
  })
  ed.cm.on('scroll',function(c){var i=c.getScrollInfo();ed.btm=i.clientHeight+i.top})
  ed.cm.on('focus',function(){ed.focusTS=+new Date;ide.focusedWin=ed})
  D.util.cmOnDblClick(ed.cm,function(x){ed.ED(ed.cm);x.preventDefault();x.stopPropagation()})
  ed.processAutocompleteReply=D.ac(ed)
  ed.tb=ed.dom.querySelector('.toolbar')
  ed.tb.onmousedown=function(x){if(x.target.matches('.tb_btn')){x.target.className+=' armed';x.preventDefault()}}
  ed.tb.onmouseup=ed.tb.onmouseout=function(x){if(x.target.matches('.tb_btn')){x.target.classList.remove('armed')
                                                                               x.preventDefault()}}
  ed.tb.onclick=function(x){var t=x.target
    if(t.matches('.tb_hid,.tb_case')){t.classList.toggle('pressed');ed.hls();return!1}
    if(t.matches('.tb_btn')){var c=t.className.replace(/^.*\btb_([A-Z]{2,3})\b.*$/,'$1')
                             ed[c]?ed[c](ed.cm):CM.commands[c]?CM.commands[c](ed.cm):0;return!1}
  }
  ed.setTC(!!ed.tc);this.vt=D.vt(this);this.setLN(D.prf.lineNums())
  ed.firstOpen=true;
}
D.Ed.prototype={
  updGutters:function(){
    var g=['breakpoints'],cm=this.cm
    cm.getOption('lineNumbers')&&g.push('CodeMirror-linenumbers')
    cm.getOption('foldGutter') &&g.push('cm-foldgutter')
    cm.setOption('gutters',g)
  },
  createBPEl:function(){ //create breakpoint element
    var e=this.dom.ownerDocument.createElement('div');e.className='breakpoint';e.innerHTML='●';return e
  },
  getStops:function(){ //returns an array of line numbers
    var r=[];this.cm.eachLine(function(lh){var m=lh.gutterMarkers;m&&m.breakpoints&&r.push(lh.lineNo())})
    return r.sort(function(x,y){return x-y})
  },
  cursorActivity:function(){ //handle "cursor activity" event from CodeMirror
    if(this.xline==null)return //xline:the line number of the empty line inserted when you press <down> at eof
    var ed=this,n=ed.cm.lineCount(),l=ed.cm.getCursor().line
    if(l===ed.xline&&l===n-1&&/^\s*$/.test(ed.cm.getLine(n-1)))return
    if(l<ed.xline&&ed.xline===n-1&&/^\s*$/.test(ed.cm.getLine(n-1))){
      ed.cm.replaceRange('',{line:n-2,ch:ed.cm.getLine(n-2).length},{line:n-1,ch:0},'D')
    }
    delete ed.xline
  },
  scrollToCursor:function(){ //approx. to 1/3 of editor height; might not work near the top or bottom
    var h=this.dom.clientHeight,cc=this.cm.cursorCoords(true,'local'),x=cc.left,y=cc.top
    this.cm.scrollIntoView({left:x,right:x,top:y-h/3,bottom:y+2*h/3})
  },
  hl:function(l){ //highlight - set current line in tracer
    var ed=this;ed.hll!=null&&ed.cm.removeLineClass(ed.hll,'background','highlighted')
    if((ed.hll=l)!=null){ //hll:highlighted line -- the one about to be executed in the tracer
      ed.cm.addLineClass(l,'background','highlighted');ed.cm.setCursor(l,0);ed.scrollToCursor()
    }
  },
  setLN:function(x){ //update the display of line numbers and the state of the "[...]" button
    var ed=this;ed.cm.setOption('lineNumbers',!!x);ed.updGutters()
    var a=ed.tb.querySelectorAll('.tb_LN');for(var i=0;i<a.length;i++)a[i].classList.toggle('pressed',!!x)
  },
  setTC:function(x){var ed=this;ed.tc=x;ed.dom.classList.toggle('tracer',!!x);ed.hl(null);ed.updGutters();ed.setRO(x)},
  setRO:function(x){this.cm.setOption('readOnly',x)/*;this.rp.hidden=x*/},
  updSize:function(){},
  saveScrollPos:function(){ //workaround for CodeMirror scrolling up to the top under GoldenLayout when editor is closed
    if(this.btm==null){var i=this.cm.getScrollInfo();this.btm=i.clientHeight+i.top}
  },
  restoreScrollPos:function(){
    if(this.btm!=null){var i=this.cm.getScrollInfo();this.cm.scrollTo(0,this.btm-i.clientHeight)}
    else {this.cm.scrollTo(0,0)}
  },
  updateSIStack:function(x){
    this.dom.querySelector('.si_stack').innerHTML=x.stack.map(function(o){return'<option>'+o}).join('')
  },
  open:function(ee){ //ee:editable entity
    var ed=this,cm=ed.cm
    this.jumps.forEach(function(x){x.n=x.lh.lineNo()}) //to preserve jumps, convert LineHandle-s to line numbers
    cm.setValue(ed.oText=ee.text.join('\n')) //.setValue() invalidates old LineHandle-s
    this.jumps.forEach(function(x){x.lh=cm.getLineHandle(x.n);delete x.n}) //look up new LineHandle-s, forget numbers
    cm.clearHistory();
    if(D.mac){cm.focus();window.focus()}
    //entityType:             16 NestedArray        512 AplClass
    // 1 DefinedFunction      32 QuadORObject      1024 AplInterface
    // 2 SimpleCharArray      64 NativeFile        2048 AplSession
    // 4 SimpleNumericArray  128 SimpleCharVector  4096 ExternalFunction
    // 8 MixedSimpleArray    256 AplNamespace
    var isCode=[1,256,512,1024,2048,4096].indexOf(ee.entityType)>=0
    cm.setOption('mode',isCode?'apl':'text');cm.setOption('foldGutter',isCode&&!!D.prf.fold())
    if(isCode&&D.prf.indentOnOpen())this.RD(cm)
    ed.setRO(ee.readOnly||ee['debugger'])
    if (ee.readOnly){ //don't show comment or replace buttons if editor is readonly
      ed.dom.getElementsByClassName("tb_AO")[0].style.display="none"
      ed.dom.getElementsByClassName("tb_DO")[0].style.display="none"
      ed.dom.getElementsByClassName("tb_RP")[0].style.display="none"
    }
    var line=ee.currentRow,col=ee.currentColumn||0
    if(line===0&&col===0&&ee.text.length===1&&/\s?[a-z|@]+$/.test(ee.text[0]))col=ee.text[0].length
    cm.setCursor(line,col);cm.scrollIntoView(null,cm.getScrollInfo().clientHeight/2)
    ed.oStop=(ee.stop||[]).slice(0).sort(function(x,y){return x-y})
    for(var k=0;k<ed.oStop.length;k++)cm.setGutterMarker(ed.oStop[k],'breakpoints',ed.createBPEl())
    D.floating&&$('title',ed.dom.ownerDocument).text(ee.name)
  },
  hasFocus:function(){return this.cm.hasFocus()},
  focus:function(){
    var q=this.container,p=q&&q.parent,l=q&&q.layoutManager,m=l&&l._maximisedItem
    if(m&&m!==(p&&p.parent))m.toggleMaximise()
    while(p){p.setActiveContentItem&&p.setActiveContentItem(q);q=p;p=p.parent} //reveal in golden layout
    window.focused||window.focus();this.cm.focus()
  },
  insert:function(ch){this.cm.getOption('readOnly')||this.cm.replaceSelection(ch)},
  saved:function(err){
    if(err){this.isClosing=0;$.err('Cannot save changes')}else{this.isClosing&&D.send('CloseWindow',{win:this.id})}
  },
  closePopup:function(){if(D.floating){window.onbeforeunload=null;D.forceClose=1;close()}},
  die:function(){this.setRO(1)},
  getDocument:function(){return this.dom.ownerDocument},
  refresh:function(){this.cm.refresh()},
  cword:function(){ //apl identifier under cursor
    var c=this.cm.getCursor(),s=this.cm.getLine(c.line),r='['+D.syn.letter+'0-9]*' //r:regex fragment used for a name
    return(
        ((RegExp('⎕?'+r+'$').exec(s.slice(0,c.ch))||[])[0]||'')+ //match left  of cursor
        ((RegExp('^'+r     ).exec(s.slice(  c.ch))||[])[0]||'')  //match right of cursor
    ).replace(/^\d+/,'') //trim leading digits
  },
  ED:function(cm){this.addJump();D.send('Edit',{win:this.id,pos:cm.indexFromPos(cm.getCursor()),
                                                text:cm.getValue(),unsaved:this.ide.getUnsaved()})},
  QT:function(){D.send('CloseWindow',{win:this.id})},
  BK:function(cm){this.tc?D.send('TraceBackward',{win:this.id}):cm.execCommand('undo')},
  FD:function(cm){this.tc?D.send('TraceForward' ,{win:this.id}):cm.execCommand('redo')},
  EP:function(cm){this.isClosing=1;this.FX(cm)},
  FX:function(cm){
    var ed=this,v=cm.getValue(),stop=ed.getStops()
    if(ed.tc||v===ed.oText&&''+stop===''+ed.oStop){D.send('CloseWindow',{win:ed.id});return} //if tracer or unchanged
    for(var i=0;i<stop.length;i++)cm.setGutterMarker(stop[i],'breakpoints',null)
    D.send('SaveChanges',{win:ed.id,text:cm.getValue().split('\n'),stop:stop})
  },
  TL:function(cm){ //toggle localisation
    var name=this.cword();if(!name)return
    var ts=(((cm.getTokenAt(cm.getCursor())||{}).state||{}).a||[])
             .map(function(x){return x.t})
             .filter(function(t){return/^(∇|\{|namespace|class|interface)$/.test(t)})
    if(ts.includes('{')||(ts.length&&!ts.includes('∇')))return
    var l0=cm.getCursor().line,f //f:found?
    for(var l=l0-1;l>=0;l--){var b=cm.getLineTokens(l)
                             for(var i=b.length-1;i>=0;i--)if(b[i].type==='apl-trad'){f=1;break}
                             if(f)break}
    if(l<0)l=0
    var u=cm.getLine(l).split('⍝'), s=u[0], com=u.slice(1).join('⍝') //s:the part before the first "⍝", com:the rest
    var a=s.split(';'), head=a[0].replace(/\s+$/,''), tail=a.length>1?a.slice(1):[]
    tail=tail.map(function(x){return x.replace(/\s+/g,'')})
    var i=tail.indexOf(name);i<0?tail.push(name):tail.splice(i,1)
    s=[head].concat(tail.sort()).join(';')+(com?(' '+com):'')
    cm.replaceRange(s,{line:l,ch:0},{line:l,ch:cm.getLine(l).length},'D')
  },
  LN:function(){D.prf.lineNums.toggle()},
  TC:function(){D.send('StepInto',{win:this.id});D.ide.getSIS()},
  AC:function(cm){ //align comments
    if(cm.getOption('readOnly'))return
    var ed=this,ll=cm.lastLine(),o=cm.listSelections() //o:original selections
    var sels=cm.somethingSelected()?o:[{anchor:{line:0,ch:0},head:{line:ll,ch:cm.getLine(ll).length}}]
    var a=sels.map(function(sel){ //a:info about individual selections (Hey, it's AC; we must align our own comments!)
      var p=sel.anchor,q=sel.head;if((p.line-q.line||p.ch-q.ch)>0){var h=p;p=q;q=h} //p:from, q:to
      var l=ed.cm.getRange({line:p.line,ch:0},q,'\n').split('\n')                   //l:lines
      var u=l.map(function(x){return x.replace(/'[^']*'?/g,function(y){return' '.repeat(y.length)})}) //u:scrubbed strings
      var c=u.map(function(x){return x.indexOf('⍝')})                               //c:column index of ⍝
      return{p:p,q:q,l:l,u:u,c:c}
    })
    var m=Math.max.apply(Math,a.map(function(sel){return Math.max.apply(Math,sel.c)}))
    a.forEach(function(sel){
      var r=sel.l.map(function(x,i){var ci=sel.c[i];return ci<0?x:x.slice(0,ci)+' '.repeat(m-ci)+x.slice(ci)})
      r[0]=r[0].slice(sel.p.ch);ed.cm.replaceRange(r.join('\n'),sel.p,sel.q,'D')
    })
    cm.setSelections(o)
  },
  ER:function(cm){
    if(this.tc){D.send('RunCurrentLine',{win:this.id});D.ide.getSIS();return}
    if(D.prf.autoCloseBlocks()){
      var u=cm.getCursor(),l=u.line,s=cm.getLine(l),m
      var re=/^(\s*):(class|disposable|for|if|interface|namespace|property|repeat|section|select|trap|while|with)\b([^⋄\{]*)$/i
      if(u.ch===s.length&&(m=re.exec(s))&&!D.syn.dfnDepth(cm.getStateAfter(l-1))){
        var pre=m[1],kw=m[2],post=m[3],l1=l+1,end=cm.lastLine();kw=kw[0].toUpperCase()+kw.slice(1).toLowerCase()
        while(l1<=end&&/^\s*(?:$|⍝)/.test(cm.getLine(l1)))l1++ //find the next non-blank line
        var s1=cm.getLine(l1)||'',pre1=s1.replace(/\S.*$/,'')
        if(pre.length>pre1.length||pre.length===pre1.length&&!/^\s*:(?:end|else|andif|orif|case|until|access)/i.test(s1)){
          var r=':'+kw+post+'\n'+pre+':End'
          D.prf.autoCloseBlocksEnd()||(r+=kw)
          cm.replaceRange(r,{line:l,ch:pre.length},{line:l,ch:s.length})
          cm.execCommand('indentAuto');cm.execCommand('goLineUp');cm.execCommand('goLineEnd')
        }
      }
    }
    cm.getOption('mode')=='apl'?cm.execCommand('newlineAndIndent'):cm.replaceSelection('\n','end')
  },
  BH:function(){D.send('ContinueTrace' ,{win:this.id})},
  RM:function(){D.send('Continue'      ,{win:this.id})},
  MA:function(){D.send('RestartThreads',{win:this.id})},
  CBP:function(){ //Clear trace/stop/monitor for this object
    var ed=this,n=ed.cm.lineCount();for(var i=0;i<n;i++)ed.cm.setGutterMarker(i,'breakpoints',null)
    ed.tc&&D.send('SetLineAttributes',{win:ed.id,stop:ed.getStops(),trace:[],monitor:[]})
  },
  BP:function(cm){ //toggle breakpoint
    var sels=cm.listSelections()
    for(var i=0;i<sels.length;i++){
      var p=sels[i].anchor,q=sels[i].head;if(p.line>q.line){var h=p;p=q;q=h}
      var l1=q.line-(p.line<q.line&&!q.ch)
      for(var l=p.line;l<=l1;l++)cm.setGutterMarker(l,'breakpoints',
        (cm.getLineHandle(l).gutterMarkers||{}).breakpoints?null:this.createBPEl()
      )
    }
    this.tc&&D.send('SetLineAttributes',{win:this.id,stop:this.getStops()})
  },
  RD:function(cm){
    if (D.prf.ilf()){
        var cm_v=cm.getValue().split('\n')
        D.send('FormatCode',{win:this.id,text:cm_v})
    }
    else{
      if(cm.somethingSelected()){cm.execCommand('indentAuto')}
      else{var u=cm.getCursor();cm.execCommand('SA');cm.execCommand('indentAuto');cm.setCursor(u)}
    }
  },
  VAL:function(cm){var a=cm.getSelections(), s=a.length!==1?'':!a[0]?this.cword():a[0].indexOf('\n')<0?a[0]:''
                   s&&this.ide.exec(['      '+s],0)},
  addJump:function(){var j=this.jumps,u=this.cm.getCursor();j.push({lh:this.cm.getLineHandle(u.line),ch:u.ch})>10&&j.shift()},
  JBK:function(cm){var p=this.jumps.pop();p&&cm.setCursor({line:p.lh.lineNo(),ch:p.ch})},
  indentOrComplete:function(cm){
    if(cm.somethingSelected()){cm.execCommand('indentMore');return}
    var c=cm.getCursor(),s=cm.getLine(c.line);if(/^ *$/.test(s.slice(0,c.ch))){cm.execCommand('indentMore');return}
    this.autocompleteWithTab=1;D.send('GetAutocomplete',{line:s,pos:c.ch,token:this.id,win:this.id})
  },
  downOrXline:function(cm){
    var l=cm.getCursor().line;if(l!==cm.lastLine()||/^\s*$/.test(cm.getLine(l))){cm.execCommand('goLineDown');return}
    cm.execCommand('goDocEnd');cm.execCommand('newlineAndIndent');this.xline=l+1
  },
  onbeforeunload:function(){ //called when the user presses [X] on the OS window
    var ed=this
    if(ed.ide.dead){D.nww&&D.nww.close(true)} //force close window
    else if(ed.tc||ed.cm.getValue()===ed.oText&&''+ed.getStops()===''+ed.oStop){ed.EP(ed.cm)}
    else{
      window.focus()
      var r=D.el.dialog.showMessageBox(D.elw,{title:'Save?',buttons:['Yes','No','Cancel'],cancelId:-1,
        message:'The object "'+ed.name+'" has changed.\nDo you want to save the changes?'})
      r===0?ed.EP(ed.cm):r===1?ed.QT(ed.cm):0;return''
    }
  }
}
D.Ed.ACB_VALUE=ACB_VALUE

}())
