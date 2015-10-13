'use strict'
var autocompletion=require('./autocompletion')
var prefs=require('./prefs')
var mode=require('./cm-apl-mode'),letter=mode.letter,dfnDepth=mode.dfnDepth
var util=require('./util'),onCodeMirrorDoubleClick=util.onCodeMirrorDoubleClick

var ACB_VALUE=this.ACB_VALUE={pairs:'()[]{}',explode:'{}'} // value for CodeMirror's "autoCloseBrackets" option when on

var b=function(cc,t){return'<a href=# class="'+cc+' tb-btn" title="'+t+'""></a>'} // cc:css classes, t:title
var EDITOR_HTML=
  '<div class=toolbar>'+
    // The first button is placed on the right-hand side through CSS. In a floating window it is hidden.
    // CSS classes "first" and "last" indicate button grouping.
    b('tb-ER  tc-only first', 'Execute line')+
    b('tb-TC  tc-only',       'Trace into expression')+
    b('tb-BK  tc-only',       'Go back one line')+
    b('tb-FD  tc-only',       'Skip current line')+
    b('tb-BH  tc-only',       'Stop on next line of calling function')+
    b('tb-RM  tc-only',       'Continue execution of this thread')+
    b('tb-MA  tc-only',       'Continue execution of all threads')+
    b('tb-ED  tc-only',       'Edit name')+
    b('tb-WI  tc-only',       'Interrupt')+
    b('tb-CBP tc-only',       'Clear trace/stop/monitor for this object')+
    b('tb-LN  tc-only last',  'Toggle line numbers')+
    b('tb-LN  ed-only first', 'Toggle line numbers')+
    b('tb-AO  ed-only',       'Comment selected text')+
    b('tb-DO  ed-only last',  'Uncomment selected text')+
    '<span class=tb-sep></span>'+
    '<div class="tb-sc text-field"></div>'+
    '<div class="tb-rp text-field ed-only"></div>'+
    b('tb-NX first',              'Search for next match')+
    b('tb-PV',                    'Search for previous match')+
    b('tb-case last',             'Match case')+
  '</div>'+
  '<div class=ride-win></div>'
b=null

this.Editor=function(ide,e,opts){
  var ed=this
  ed.ide=ide
  ed.$e=$(e).html(EDITOR_HTML)
  ed.opts=opts;ed.id=opts.id;ed.name=opts.name;ed.emit=opts.emit
  ed.isTracer=opts.tracer
  ed.xline=null // the line number of the empty line inserted at eof when cursor is there and you press <down>
  ed.oText='';ed.oStop=[] // remember original text and "stops" to avoid pointless saving on EP
  ed.hll=null // highlighted line -- currently executed line in tracer
  ed.lastQuery=ed.lastIC=ed.overlay=ed.annotation=null // search-related state
  ed.focusTimestamp=0
  ed.cm=CodeMirror(ed.$e.find('.ride-win')[0],{
    lineNumbers:!!(ed.isTracer?prefs.lineNumsTracer():prefs.lineNumsEditor()),
    firstLineNumber:0,lineNumberFormatter:function(i){return'['+i+']'},
    smartIndent:prefs.indent()>=0,indentUnit:prefs.indent(),scrollButtonHeight:12,matchBrackets:!!prefs.matchBrackets(),
    autoCloseBrackets:!!prefs.autoCloseBrackets()&&ACB_VALUE,foldGutter:!!prefs.fold(),
    keyMap:'dyalog',extraKeys:{'Shift-Tab':'indentLess',Tab:'tabOrAutocomplete',Down:'downOrXline'}
    // Some options of this.cm can be set from ide.coffee when the corresponding pref changes.
  })
  ed.cm.dyalogCommands=ed
  ed.cm.on('cursorActivity',ed.cursorActivity.bind(ed))
  ed.cm.on('gutterClick',function(cm,l,g){ // g:gutter
    if(g==='breakpoints'||g==='CodeMirror-linenumbers'){cm.setCursor({line:l,ch:0});ed.BP(ed.cm)}
  })
  ed.cm.on('focus',function(){ed.focusTimestamp=+new Date;ide.focusedWin=ed})
  onCodeMirrorDoubleClick(ed.cm,function(e){ed.ED(ed.cm);e.preventDefault();e.stopPropagation()})
  ed.autocomplete=autocompletion.setUp(ed)
  ed.$tb=$('.toolbar',ed.$e)
    .on('click','.tb-hid,.tb-case',function(e){$(e.target).toggleClass('pressed');ed.highlightSearch();return false})
    .on('mousedown','.tb-btn',function(e){$(e.target).addClass('armed');e.preventDefault()})
    .on('mouseup mouseout','.tb-btn',function(e){$(e.target).removeClass('armed');e.preventDefault()})
    .on('click','.tb-btn',function(e){
      var m,a=$(e.target).prop('class').split(/\s+/)
      for(var i=0;i<a.length;i++)if(m=/^tb-([A-Z]{2,3})$/.exec(a[i])){ed[m[1]](ed.cm);break}
    })
  ed.cmSC=CodeMirror(ed.$tb.find('.tb-sc')[0],{placeholder:'Search',extraKeys:{
    Enter:ed.NX.bind(ed),
    'Shift-Enter':ed.PV.bind(ed),
    'Ctrl-Enter':ed.selectAllSearchResults.bind(ed),
    Tab:function(){(ed.isTracer?ed.cm:ed.cmRP).focus()},
    'Shift-Tab':ed.cm.focus.bind(ed.cm)
  }})
  ed.cmSC.on('change',function(){ed.highlightSearch()})
  ed.cmRP=CodeMirror(ed.$tb.find('.tb-rp')[0],{placeholder:'Replace',extraKeys:{
    Enter:ed.replace.bind(ed),
    'Shift-Enter':ed.replace.bind(ed,1),
    Tab:ed.cm.focus.bind(ed.cm),
    'Shift-Tab':function(){(ed.isTracer?ed.cm:ed.cmSC).focus()}
  }})
  var cms=[ed.cmSC,ed.cmRP]
  for(var i=0;i<cms.length;i++){
    cms[i].setOption('keyMap','dyalog')
    cms[i].setOption('scrollbarStyle','null')
    cms[i].addKeyMap({
      Down:ed.NX.bind(ed),
      Up:ed.PV.bind(ed),
      Esc:function(){ed.clearSearch();setTimeout(ed.cm.focus.bind(ed.cm),0)}
    })
  }
  ed.setTracer(!!ed.isTracer)
}

this.Editor.prototype={
  updateGutters:function(){
    var g=['breakpoints'],cm=this.cm
    cm.getOption('lineNumbers')&&g.push('CodeMirror-linenumbers')
    cm.getOption('foldGutter') &&g.push('CodeMirror-foldgutter')
    cm.setOption('gutters',g)
  },
  createBPElement:function(){
    var e=this.$e[0].ownerDocument.createElement('div');e.setAttribute('class','breakpoint');e.innerHTML='●';return e
  },
  getStops:function(){ // returns an array of line numbers
    var r=[];this.cm.eachLine(function(lh){var gm=lh.gutterMarkers;if(gm&&gm.breakpoints)r.push(lh.lineNo())})
    return r.sort(function(x,y){return x-y})
  },
  cursorActivity:function(){
    if(this.xline!==null){
      var n=this.cm.lineCount(),l=this.cm.getCursor().line
      if(l!==this.xline||l!==n-1||!/^\s*$/.test(this.cm.getLine(n-1))){
        if(l<this.xline&&this.xline===n-1&&/^\s*$/.test(this.cm.getLine(n-1))){
          this.cm.replaceRange('',{line:n-2,ch:this.cm.getLine(n-2).length},{line:n-1,ch:0},'D')
        }
        this.xline=null
      }
    }
  },
  scrollCursorIntoProminentView:function(){ // approx. to 1/3 of editor height; might not work near the top or bottom
    var h=this.$e.height(),cc=this.cm.cursorCoords(true,'local'),x=cc.left,y=cc.top
    this.cm.scrollIntoView({left:x,right:x,top:y-h/3,bottom:y+2*h/3})
  },
  clearSearch:function(){
    $('.ride-win .CodeMirror-vscrollbar',this.$e).prop('title','')
    $('.tb-sc',this.$tb).removeClass('no-matches')
    this.cm.removeOverlay(this.overlay);this.annotation&&this.annotation.clear();this.overlay=this.annotation=null
  },
  highlightSearch:function(){
    var ic=!$('.tb-case',this.$tb).hasClass('pressed'),q=this.cmSC.getValue() // ic:ignore case?, q:query string
    ic&&(q=q.toLowerCase())
    if(this.lastQuery!==q||this.lastIC!==ic){
      this.lastQuery=q;this.lastIC=ic;this.clearSearch()
      if(q){
        var s=this.cm.getValue()
        ic&&(s=s.toLowerCase())
        $('.tb-sc',this.$tb).toggleClass('no-matches',s.indexOf(q)<0)
        this.annotation=this.cm.showMatchesOnScrollbar(q,ic)
        this.cm.addOverlay(this.overlay={token:function(stream){
          s=stream.string.slice(stream.pos);ic&&(s=s.toLowerCase())
          var i=s.indexOf(q)
          if(!i){stream.pos+=q.length;return'searching'}else if(i>0){stream.pos+=i}else{stream.skipToEnd()}
        }})
        $('.CodeMirror-vscrollbar',this.$e).prop('title','Lines on scroll bar show match locations')
      }
    }
    return[q,ic]
  },
  search:function(backwards){
    var cm=this.cm,h=this.highlightSearch(),q=h[0],ic=h[1] // ic:ignore case?, q:query string
    if(q){
      var s=cm.getValue();ic&&(s=s.toLowerCase())
      if(backwards){
        var i=cm.indexFromPos(cm.getCursor('anchor')),j=s.slice(0,i).lastIndexOf(q)
        if(j<0){j=s.slice(i).lastIndexOf(q);if(j>=0)j+=i}
      }else{
        var i=cm.indexFromPos(cm.getCursor()),j=s.slice(i).indexOf(q)
        j= j>=0?(j+i):s.slice(0,i).indexOf(q)
      }
      if(j>=0){
        cm.setSelection(cm.posFromIndex(j),cm.posFromIndex(j+q.length))
        this.scrollCursorIntoProminentView()
      }
    }
    return false
  },
  selectAllSearchResults:function(){
    var cm=this.cm
    var ic=!$('.tb-case',this.$tb).hasClass('pressed') // ic:ignore case?, q:query string
    var q=this.cmSC.getValue();ic&&(q=q.toLowerCase())
    if(q){
      var s=cm.getValue();ic&&(s=s.toLowerCase())
      var sels=[],i=0
      while((i=s.indexOf(q,i))>=0){sels.push({anchor:cm.posFromIndex(i),head:cm.posFromIndex(i+q.length)});i++}
      sels.length&&cm.setSelections(sels)
    }
    cm.focus()
  },
  replace:function(backwards){ // replace current occurrence and move to next
    var ic=!$('.tb-case',this.$tb).hasClass('pressed'),   // ignore case?
        q=this.cmSC.getValue()  ;ic&&(q=q.toLowerCase()), // query string
        s=this.cm.getSelection();ic&&(s=s.toLowerCase())  // selection
    s===q&&this.cm.replaceSelection(this.cmRP.getValue(),backwards?'start':'end')
    this.search(backwards)
    var v=this.cm.getValue();ic&&(v=v.toLowerCase())
    $('.tb-sc',this.$tb).toggleClass('no-matches',v.indexOf(q)<0)
  },
  highlight:function(l){ // current line in tracer
    this.hll!=null&&this.cm.removeLineClass(this.hll,'background','highlighted')
    if((this.hll=l)!=null){
      this.cm.addLineClass(l,'background','highlighted');this.cm.setCursor(l,0);this.scrollCursorIntoProminentView()
    }
  },
  setTracer:function(x){
    this.isTracer=x;this.$e.toggleClass('tracer',x);this.highlight(null)
    var ln=!!(this.isTracer?prefs.lineNumsTracer():prefs.lineNumsEditor())
    this.cm.setOption('lineNumbers',ln);this.$tb.find('.tb-LN').toggleClass('pressed',ln)
    this.updateGutters();this.cm.setOption('readOnly',!!x)
  },
  setReadOnly:function(x){this.cm.setOption('readOnly',x)},
  updateSize:function(){this.cm.setSize(this.$e.width(),this.$e.parent().height()-this.$e.position().top-28)},
  open:function(ee){ // ee:editable entity
    var cm=this.cm;cm.setValue(this.oText=ee.text);cm.clearHistory()
    if(D.mac){cm.focus();window.focus()}
    // entityType:             5 NestedArray        10 AplClass
    //  1 DefinedFunction      6 QuadORObject       11 AplInterface
    //  2 SimpleCharArray      7 NativeFile         12 AplSession
    //  3 SimpleNumericArray   8 SimpleCharVector   13 ExternalFunction
    //  4 MixedSimpleArray     9 AplNamespace
    if([1,9,10,11,12,13].indexOf(ee.entityType)<0){cm.setOption('mode','text')}
    else{cm.setOption('mode','apl');if(prefs.indentOnOpen()){cm.execCommand('selectAll');cm.execCommand('indentAuto')}}
    cm.setOption('readOnly',ee.readOnly||ee['debugger'])
    var line=ee.currentRow,col=ee.currentColumn||0
    if(line===0&&col===0&&ee.text.indexOf('\n')<0)col=ee.text.length
    cm.setCursor(line,col);cm.scrollIntoView(null,this.$e.height()/2)
    this.oStop=ee.lineAttributes.stop.slice(0).sort(function(x,y){return x-y})
    for(var k=0;k<this.oStop.length;k++)cm.setGutterMarker(this.oStop[k],'breakpoints',this.createBPElement())
    D.floating&&$('title',this.$e[0].ownerDocument).text(ee.name)
  },
  hasFocus:function(){return window.focused&&this.cm.hasFocus()},
  focus:function(){if(!window.focused){window.focus()};this.cm.focus()},
  insert:function(ch){this.cm.getOption('readOnly')||this.cm.replaceSelection(ch)},
  saved:function(err){err?$.alert('Cannot save changes'):this.emit('CloseWindow',{win:this.id})},
  closePopup:function(){if(D.floating){window.onbeforeunload=null;D.forceClose=1;close()}},
  die:function(){this.cm.setOption('readOnly',true)},
  getDocument:function(){returnthis.$e[0].ownerDocument},
  refresh:function(){this.cm.refresh()},
  cword:function(){ // apl identifier under cursor
    var c=this.cm.getCursor(),s=this.cm.getLine(c.line),r='['+letter+'0-9]*' // r:regex fragment used for identifiers
    return(
        ((RegExp('⎕?'+r+'$').exec(s.slice(0,c.ch))||[])[0]||'')+ // match left  of cursor
        ((RegExp('^'+r     ).exec(s.slice(  c.ch))||[])[0]||'')  // match right of cursor
    ).replace(/^\d+/,'') // trim leading digits
  },
  ED:function(cm){this.emit('Edit',{win:this.id,text:cm.getValue(),pos:cm.indexFromPos(cm.getCursor())})},
  QT:function(){this.emit('CloseWindow',{win:this.id})},
  BK:function(cm){this.isTracer?this.emit('TraceBackward',{win:this.id}):cm.execCommand('undo')},
  FD:function(cm){this.isTracer?this.emit('TraceForward' ,{win:this.id}):cm.execCommand('redo')},
  SC:function(cm){
    var v=cm.getSelection();/^[ -\uffff]+$/.test(v)&&this.cmSC.setValue(v)
    this.cmSC.focus();this.cmSC.execCommand('selectAll')
  },
  RP:function(cm){
    var v=cm.getSelection()||this.cword()
    if(v&&v.indexOf('\n')<0){this.cmSC.setValue(v);this.cmRP.setValue(v)}
    this.cmRP.focus();this.cmRP.execCommand('selectAll');this.highlightSearch()
  },
  EP:function(cm){
    if(this.isTracer){
      this.emit('CloseWindow',{win:this.id})
    }else{
      var v=cm.getValue(),stop=this.getStops()
      if(v!==this.oText||''+stop!==''+this.oStop){
        for(var i=0;i<stop.length;i++)cm.setGutterMarker(stop[i],'breakpoints',null)
        this.emit('SaveChanges',{win:this.id,text:cm.getValue(),attributes:{stop:stop}})
      }else{
        this.emit('CloseWindow',{win:this.id})
      }
    }
  },
  TL:function(cm){ // toggle localisation
    var name=this.cword()
    if(name){ // search back for a line that looks like a tradfn header (though in theory it might be a dfns's recur: ∇)
      var l,l0=l=cm.getCursor().line
      while(l>=0&&!/^\s*∇\s*\S/.test(cm.getLine(l)))l--
      if(l<0&&!/\{\s*$/.test(cm.getLine(0).replace(/⍝.*/,'')))l=0
      if(l>=0&&l!==l0){
        var m=/([^⍝]*)(.*)/.exec(cm.getLine(l)), s=m[1], com=m[2]
        var a=s.split(';'), head=a[0].replace(/\s+$/,''), tail=a.length>1?a.slice(1):[]
        tail=tail.map(function(x){return x.replace(/\s+/g,'')})
        var i=tail.indexOf(name);i<0?tail.push(name):tail.splice(i,1)
        s=[head].concat(tail.sort()).join(';')+(com?(' '+com):'')
        cm.replaceRange(s,{line:l,ch:0},{line:l,ch:cm.getLine(l).length},'D')
      }
    }
  },
  LN:function(cm){ // toggle line numbers
    var v=!!(this.isTracer?prefs.lineNumsTracer.toggle():prefs.lineNumsEditor.toggle())
    cm.setOption('lineNumbers',v);this.updateGutters();this.$tb.find('.tb-LN').toggleClass('pressed',v)
  },
  PV:function(){this.search(1)},
  NX:function(){this.search()},
  TC:function(){this.emit('StepInto',{win:this.id})},
  AC:function(cm){ // align comments
    var ed=this,ll=cm.lastLine(),o=cm.listSelections() // o:original selections
    var sels=cm.somethingSelected()?o:[{anchor:{line:0,ch:0},head:{line:ll,ch:cm.getLine(ll).length}}]
    var a=sels.map(function(sel){ // a:info about individual selections (Hey, it's AC; we must align our own comments!)
      var p=sel.anchor,q=sel.head;if((p.line-q.line||p.ch-q.ch)>0){var h=p;p=q;q=h} // p:from, q:to
      var l=ed.cm.getRange({line:p.line,ch:0},q,'\n').split('\n')                   // l:lines
      var u=l.map(function(x){return x.replace(/'[^']*'?/g,function(y){return' '.repeat(y.length)})}) // u:scrubbed strings
      var c=u.map(function(x){return x.indexOf('⍝')})                               // c:column index of ⍝
      return{p:p,q:q,l:l,u:u,c:c}
    })
    var m=Math.max.apply(Math,a.map(function(sel){return Math.max.apply(Math,sel.c)}))
    a.forEach(function(sel){
      var r=sel.l.map(function(x,i){var ci=sel.c[i];return ci<0?x:x.slice(0,ci)+' '.repeat(m-ci)+x.slice(ci)})
      r[0]=r[0].slice(sel.p.ch);ed.cm.replaceRange(r.join('\n'),sel.p,sel.q,'D')
    })
    cm.setSelections(o)
  },
  AO:function(cm){ // add comment
    if(cm.somethingSelected()){
      var a=cm.listSelections()
      cm.replaceSelections(cm.getSelections().map(function(s){return s.replace(/^/gm,'⍝').replace(/\n⍝$/,'\n')}))
      for(var i=0;i<a.length;i++){ // correct selection ends for inserted characters:
        var r=a[i],d=r.head.line-r.anchor.line||r.head.ch-r.anchor.ch
        d&&(d>0?r.head:r.anchor).ch++
      }
      cm.setSelections(a)
    }else{
      var l=cm.getCursor().line,p={line:l,ch:0};cm.replaceRange('⍝',p,p,'D');cm.setCursor({line:l,ch:1})
    }
  },
  DO:function(cm){ // delete comment
    if(cm.somethingSelected()){
      var a=cm.listSelections(),u=cm.getSelections()
      cm.replaceSelections(u.map(function(s){return s.replace(/^⍝/gm,'')}))
      for(var i=0;i<a.length;i++){
        var r=a[i],d=r.head.line-r.anchor.line||r.head.ch-r.anchor.ch // d:direction of selection
        if(d&&u[i].split(/^/m).slice(-1)[0][0]==='⍝'){ // if the first character of last line in the selection is ⍝
          (d>0?r.head:r.anchor).ch-- // ... shrink the selection end to compensate for it
        }
      }
      cm.setSelections(a)
    }else{
      var l=cm.getCursor().line,s=cm.getLine(l)
      cm.replaceRange(s.replace(/^( *)⍝/,'$1'),{line:l,ch:0},{line:l,ch:s.length},'D')
      cm.setCursor({line:l,ch:0})
    }
  },
  ER:function(cm){
    if(this.isTracer){
      this.emit('RunCurrentLine',{win:this.id})
    }else{
      if(prefs.autoCloseBlocks()){
        var u=cm.getCursor(),l=u.line,s=cm.getLine(l)
        var m,re=/^(\s*):(class|disposable|for|if|interface|namespace|property|repeat|section|select|trap|while|with)\b([^⋄\{]*)$/i
        if(u.ch===s.length&&(m=re.exec(s))&&!dfnDepth(cm.getStateAfter(l-1))){
          var pre=m[1],kw=m[2],post=m[3]
          kw=kw[0].toUpperCase()+kw.slice(1).toLowerCase()
          var l1=l+1,end=cm.lastLine() // find the next non-blank line
          while(l1<=end&&/^\s*(?:$|⍝)/.test(cm.getLine(l1)))l1++
          var s1=cm.getLine(l1)||'',pre1=s1.replace(/\S.*$/,'')
          if(pre.length>pre1.length||pre.length===pre1.length&&!/^\s*:(?:end|else|andif|orif|case|until|access)/i.test(s1)){
            var r=':'+kw+post+'\n'+pre+':End'
            prefs.autoCloseBlocksEnd()||(r+=kw)
            cm.replaceRange(r,{line:l,ch:pre.length},{line:l,ch:s.length})
            cm.execCommand('indentAuto');cm.execCommand('goLineUp');cm.execCommand('goLineEnd')
          }
        }
      }
      cm.execCommand('newlineAndIndent')
    }
  },
  BH:function(){this.emit('ContinueTrace' ,{win:this.id})},
  RM:function(){this.emit('Continue'      ,{win:this.id})},
  MA:function(){this.emit('RestartThreads',{win:this.id})},
  CBP:function(){ // Clear trace/stop/monitor for this object
    var n=this.cm.lineCount();for(var i=0;i<n;i++)this.cm.setGutterMarker(i,'breakpoints',null)
    this.isTracer&&this.emit('SetLineAttributes',{
      win:this.id,nLines:n,lineAttributes:{stop:this.getStops(),trace:[],monitor:[]}
    })
  },
  BP:function(cm){ // toggle breakpoint
    var sels=cm.listSelections()
    for(var i=0;i<sels.length;i++){
      var p=sels[i].anchor,q=sels[i].head;if(p.line>q.line){var h=p;p=q;q=h}
      var l1=q.line-(p.line<q.line&&!q.ch)
      for(var l=p.line;l<=l1;l++)cm.setGutterMarker(l,'breakpoints',
        (cm.getLineHandle(l).gutterMarkers||{}).breakpoints?null:this.createBPElement()
      )
    }
    this.isTracer&&this.emit('SetLineAttributes',{
      win:this.id,nLines:cm.lineCount(),lineAttributes:{stop:this.getStops()}
    })
  },
  RD:function(cm){
    if(cm.somethingSelected())cm.execCommand('indentAuto')
    else{var u=cm.getCursor();cm.execCommand('SA');cm.execCommand('indentAuto');cm.setCursor(u)}
  },
  VAL:function(cm){
    var a=cm.getSelections(), s=a.length!==1?'':!a[0]?this.cword():a[0].indexOf('\n')<0?a[0]:''
    s&&this.ide.wins[0].opts.exec(['      '+s],0)
  },
  tabOrAutocomplete:function(){
    if(this.cm.somethingSelected()){
      this.cm.execCommand('indentMore')
    }else{
      var c=this.cm.getCursor(),s=this.cm.getLine(c.line)
      if(/^ *$/.test(s.slice(0,c.ch))){this.cm.execCommand('indentMore')}
      else{this.autocompleteWithTab=1;this.emit('GetAutoComplete',{line:s,pos:c.ch,token:this.id})}
    }
  },
  downOrXline:function(){
    var l=this.cm.getCursor().line
    if(l!==this.cm.lastLine()||/^\s*$/.test(this.cm.getLine(l))){this.cm.execCommand('goLineDown')}
    else{this.cm.execCommand('goDocEnd');this.cm.execCommand('newlineAndIndent');this.xline=l+1}
  },
  onbeforeunload:function(){ // called when the user presses [X] on the OS window
    var ed=this
    if(ed.ide.dead){var f=D.forceCloseNWWindow;f&&f()}
    else if(ed.isTracer||ed.cm.getValue()===ed.oText&&''+ed.getStops()===''+ed.oStop){ed.EP(ed.cm)}
    else if(!ed.dialog){
      window.focus()
      ed.dialog=$('<p>The object "'+ed.name+'" has changed.<br>Do you want to save the changes?').dialog({
        width:400,
        close:function(){ed.dialog.dialog('close');ed.dialog=null},
        buttons:[
          {text:'Yes'   ,click:function(){ed.dialog.dialog('close');ed.dialog=null;ed.EP(ed.cm)}},
          {text:'No'    ,click:function(){ed.dialog.dialog('close');ed.dialog=null;ed.QT(ed.cm)}},
          {text:'Cancel',click:function(){ed.dialog.dialog('close');ed.dialog=null}}
        ]
      })
      // When a string is returned from onbeforeunload:
      //   NW.js prevents the window from closing.
      //   Browsers ask the user "Are you sure you want to close this window?"
      //   In addition, some browsers display the returned string along with the above question.
      return''
    }
  }
}
