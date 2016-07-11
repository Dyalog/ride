;(function(){'use strict'

var CM=CodeMirror,
    ACB_VALUE={pairs:'()[]{}',explode:'{}'} // value for CodeMirror's "autoCloseBrackets" option when on

D.Ed=function(ide,opts){ //Editor constructor
  var ed=this;ed.ide=ide;ed.dom=document.getElementById('ed_tmpl').cloneNode(1);ed.dom.hidden=0;ed.$e=$(ed.dom)
  ed.opts=opts;ed.id=opts.id;ed.name=opts.name;ed.emit=opts.emit
  ed.tc=opts.tracer
  ed.xline=null // the line number of the empty line inserted at eof when cursor is there and you press <down>
  ed.oText='';ed.oStop=[] // remember original text and "stops" to avoid pointless saving on EP
  ed.hll=null // highlighted line -- currently executed line in tracer
  ed.lastQuery=ed.lastIC=ed.lastGen=ed.overlay=ed.annotation=null // search-related state
  ed.focusTimestamp=0
  ed.jumps=[]
  ed.cm=CM(ed.dom.querySelector('.ride-win-cm'),{
    lineNumbers:!!(ed.tc?D.prf.lineNumsTracer():D.prf.lineNumsEditor()),
    firstLineNumber:0,lineNumberFormatter:function(i){return'['+i+']'},
    smartIndent:D.prf.indent()>=0,indentUnit:D.prf.indent(),scrollButtonHeight:12,matchBrackets:!!D.prf.matchBrackets(),
    autoCloseBrackets:!!D.prf.autoCloseBrackets()&&ACB_VALUE,foldGutter:!!D.prf.fold(),
    scrollbarStyle:'simple',
    keyMap:'dyalog',extraKeys:{'Shift-Tab':'indentLess',Tab:'tabOrAutocomplete',Down:'downOrXline'}
    // Some options of this.cm can be set from ide.coffee when the corresponding pref changes.
  })
  ed.cm.dyalogCmds=ed
  ed.cm.on('cursorActivity',ed.cursorActivity.bind(ed))
  ed.cm.on('gutterClick',function(cm,l,g){ // g:gutter
    if(g==='breakpoints'||g==='CodeMirror-linenumbers'){cm.setCursor({line:l,ch:0});ed.BP(ed.cm)}
  })
  ed.cm.on('focus',function(){ed.focusTimestamp=+new Date;ide.focusedWin=ed})
  D.util.cmOnDblClick(ed.cm,function(e){ed.ED(ed.cm);e.preventDefault();e.stopPropagation()})
  ed.processAutocompleteReply=D.ac(ed)
  ed.$tb=$('.toolbar',ed.dom)
    .on('click','.tb_hid,.tb_case',function(e){$(e.target).toggleClass('pressed');ed.highlightSearch();return!1})
    .on('mousedown','.tb_btn',function(e){$(e.target).addClass('armed');e.preventDefault()})
    .on('mouseup mouseout','.tb_btn',function(e){$(e.target).removeClass('armed');e.preventDefault()})
    .on('click','.tb_btn',function(e){
      var m,a=$(e.target).prop('class').split(/\s+/)
      for(var i=0;i<a.length;i++)if(m=/^tb_([A-Z]{2,3})$/.exec(a[i]))
        {ed[m[1]]?ed[m[1]](ed.cm):CM.commands[m[1]]?CM.commands[m[1]](ed.cm):0;break}
    })
  ed.cmSC=CM(ed.$tb.find('.tb_sc')[0],{placeholder:'Search',extraKeys:{
    Enter:ed.NX.bind(ed),
    'Shift-Enter':ed.PV.bind(ed),
    'Ctrl-Enter':ed.selectAllSearchResults.bind(ed),
    Tab:function(){(ed.tc?ed.cm:ed.cmRP).focus()},
    'Shift-Tab':ed.cm.focus.bind(ed.cm)
  }})
  ed.cmSC.on('change',function(){ed.highlightSearch()})
  ed.$rp=ed.$tb.find('.tb_rp')
  ed.cmRP=CM(ed.$rp[0],{placeholder:'Replace',extraKeys:{
    Enter            :function(){ed.replace()},
    'Shift-Enter'    :function(){ed.replace(1)},
    'Alt-Enter'      :function(){ed.search()},
    'Shift-Alt-Enter':function(){ed.search(1)},
    Tab              :function(){ed.cm.focus()},
    'Shift-Tab'      :function(){(ed.tc?ed.cm:ed.cmSC).focus()}
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
  ed.setTracer(!!ed.tc)
  this.vt=D.vt(this)
}
D.Ed.prototype={
  updGutters:function(){
    var g=['breakpoints'],cm=this.cm
    cm.getOption('lineNumbers')&&g.push('CodeMirror-linenumbers')
    cm.getOption('foldGutter') &&g.push('cm-foldgutter')
    cm.setOption('gutters',g)
  },
  createBPEl:function(){
    var e=this.dom.ownerDocument.createElement('div');e.className='breakpoint';e.innerHTML='●';return e
  },
  getStops:function(){ // returns an array of line numbers
    var r=[];this.cm.eachLine(function(lh){var m=lh.gutterMarkers;m&&m.breakpoints&&r.push(lh.lineNo())})
    return r.sort(function(x,y){return x-y})
  },
  cursorActivity:function(){
    if(this.xline==null)return
    var ed=this,n=ed.cm.lineCount(),l=ed.cm.getCursor().line
    if(l===ed.xline&&l===n-1&&/^\s*$/.test(ed.cm.getLine(n-1)))return
    if(l<ed.xline&&ed.xline===n-1&&/^\s*$/.test(ed.cm.getLine(n-1))){
      ed.cm.replaceRange('',{line:n-2,ch:ed.cm.getLine(n-2).length},{line:n-1,ch:0},'D')
    }
    ed.xline=null
  },
  scrollCursorIntoProminentView:function(){ // approx. to 1/3 of editor height; might not work near the top or bottom
    var h=this.dom.clientHeight,cc=this.cm.cursorCoords(true,'local'),x=cc.left,y=cc.top
    this.cm.scrollIntoView({left:x,right:x,top:y-h/3,bottom:y+2*h/3})
  },
  clearSearch:function(){
    var ed=this;$('.ride-win .CodeMirror-vscrollbar',ed.dom).prop('title','');$('.tb_sc',ed.$tb).removeClass('no-matches')
    ed.cm.removeOverlay(ed.overlay);ed.annotation&&ed.annotation.clear();ed.overlay=ed.annotation=null
  },
  highlightSearch:function(){
    var ed=this,ic=!$('.tb_case',ed.$tb).hasClass('pressed'),g=ed.cm.changeGeneration(),q=ed.cmSC.getValue()
    if(ic)q=q.toLowerCase() // ic:ignore case?, q:query string
    if(ed.lastQuery!==q||ed.lastIC!==ic||ed.lastGen!==g){
      ed.lastQuery=q;ed.lastIC=ic;ed.lastGen=g;ed.clearSearch()
      if(q){
        ed.annotation=ed.cm.showMatchesOnScrollbar(q,ic)
        ed.cm.addOverlay(ed.overlay={token:function(x){ // x:stream
          var s=ed.cm.getValue();if(ic)s=s.toLowerCase();$('.tb_sc',ed.$tb).toggleClass('no-matches',s.indexOf(q)<0)
          s=x.string.slice(x.pos);var i=s.indexOf(q);if(!i){x.pos+=q.length;return'searching'};i>0?x.pos+=i:x.skipToEnd()
        }})
        $('.CodeMirror-vscrollbar',ed.dom).prop('title','Lines on scroll bar show match locations')
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
        var i=cm.indexFromPos(cm.getCursor()),j=s.slice(i).indexOf(q);j=j>=0?(j+i):s.slice(0,i).indexOf(q)
      }
      if(j>=0){cm.setSelection(cm.posFromIndex(j),cm.posFromIndex(j+q.length));this.scrollCursorIntoProminentView()}
    }
    return!1
  },
  selectAllSearchResults:function(){
    var cm=this.cm,ic=!$('.tb_case',this.$tb).hasClass('pressed') // ic:ignore case?, q:query string
    var q=this.cmSC.getValue();ic&&(q=q.toLowerCase())
    if(q){
      var s=cm.getValue(),sels=[],i=0;ic&&(s=s.toLowerCase())
      while((i=s.indexOf(q,i))>=0){sels.push({anchor:cm.posFromIndex(i),head:cm.posFromIndex(i+q.length)});i++}
      sels.length&&cm.setSelections(sels)
    }
    cm.focus()
  },
  replace:function(backwards){ // replace current occurrence and move to next
    var ic=!$('.tb_case',this.$tb).hasClass('pressed')   // ignore case?
    var q=this.cmSC.getValue()  ;ic&&(q=q.toLowerCase()) // query string
    var s=this.cm.getSelection();ic&&(s=s.toLowerCase()) // selection
    s===q&&this.cm.replaceSelection(this.cmRP.getValue(),backwards?'start':'end')
    this.search(backwards)
    var v=this.cm.getValue();ic&&(v=v.toLowerCase())
    $('.tb_sc',this.$tb).toggleClass('no-matches',v.indexOf(q)<0)
  },
  highlight:function(l){ // current line in tracer
    var ed=this;ed.hll!=null&&ed.cm.removeLineClass(ed.hll,'background','highlighted')
    if((ed.hll=l)!=null){
      ed.cm.addLineClass(l,'background','highlighted');ed.cm.setCursor(l,0);ed.scrollCursorIntoProminentView()
    }
  },
  setTracer:function(x){
    var ed=this;ed.tc=x;ed.$e.toggleClass('tracer',x);ed.highlight(null)
    var ln=!!(ed.tc?D.prf.lineNumsTracer():D.prf.lineNumsEditor())
    ed.cm.setOption('lineNumbers',ln);ed.$tb.find('.tb_LN').toggleClass('pressed',ln)
    ed.updGutters();ed.setReadOnly(x)
  },
  setReadOnly:function(x){this.cm.setOption('readOnly',x);this.$rp.toggle(!x)},
  updSize:function(){var $p=this.$e;this.cm.setSize($p.width(),$p.height()-28)},
  open:function(ee){ // ee:editable entity
    var ed=this,cm=ed.cm
    this.jumps.forEach(function(x){x.n=x.lh.lineNo()}) // to preserve jumps, convert LineHandle-s to line numbers
    cm.setValue(ed.oText=ee.text.join('\n')) // .setValue() invalidates old LineHandle-s
    this.jumps.forEach(function(x){x.lh=cm.getLineHandle(x.n);delete x.n}) // look up new LineHandle-s, forget numbers
    cm.clearHistory()
    if(D.mac){cm.focus();window.focus()}
    // entityType:             16 NestedArray        512 AplClass
    //  1 DefinedFunction      32 QuadORObject      1024 AplInterface
    //  2 SimpleCharArray      64 NativeFile        2048 AplSession
    //  4 SimpleNumericArray  128 SimpleCharVector  4096 ExternalFunction
    //  8 MixedSimpleArray    256 AplNamespace
    if([1,256,512,1024,2048,4096].indexOf(ee.entityType)<0){cm.setOption('mode','text')}
    else{cm.setOption('mode','apl');if(D.prf.indentOnOpen()){cm.execCommand('selectAll');cm.execCommand('indentAuto')}}
    ed.setReadOnly(ee.readOnly||ee['debugger'])
    var line=ee.currentRow,col=ee.currentColumn||0
    if(line===0&&col===0&&ee.text.length===1)col=ee.text[0].length
    cm.setCursor(line,col);cm.scrollIntoView(null,ed.$e.height()/2)
    ed.oStop=(ee.stop||[]).slice(0).sort(function(x,y){return x-y})
    for(var k=0;k<ed.oStop.length;k++)cm.setGutterMarker(ed.oStop[k],'breakpoints',ed.createBPEl())
    D.floating&&$('title',ed.$e[0].ownerDocument).text(ee.name)
  },
  hasFocus:function(){return window.focused&&this.cm.hasFocus()},
  focus:function(){
    var q=this.container,p=q&&q.parent,l=q&&q.layoutManager,m=l&&l._maximisedItem
    if(m&&m!==(p&&p.parent))m.toggleMaximise()
    while(p){p.setActiveContentItem&&p.setActiveContentItem(q);q=p;p=p.parent} // reveal in golden layout
    window.focused||window.focus();this.cm.focus()
  },
  insert:function(ch){this.cm.getOption('readOnly')||this.cm.replaceSelection(ch)},
  saved:function(err){
    if(err){this.isClosing=0;$.err('Cannot save changes')}else{this.isClosing&&this.emit('CloseWindow',{win:this.id})}
  },
  closePopup:function(){if(D.floating){window.onbeforeunload=null;D.forceClose=1;close()}},
  die:function(){this.setReadOnly(true)},
  getDocument:function(){return this.$e[0].ownerDocument},
  refresh:function(){this.cm.refresh()},
  cword:function(){ // apl identifier under cursor
    var c=this.cm.getCursor(),s=this.cm.getLine(c.line),r='['+D.syn.letter+'0-9]*' // r:regex fragment used for a name
    return(
        ((RegExp('⎕?'+r+'$').exec(s.slice(0,c.ch))||[])[0]||'')+ // match left  of cursor
        ((RegExp('^'+r     ).exec(s.slice(  c.ch))||[])[0]||'')  // match right of cursor
    ).replace(/^\d+/,'') // trim leading digits
  },
  ED:function(cm){
    this.addJump()
    this.emit('Edit',{win:this.id,pos:cm.indexFromPos(cm.getCursor()),text:cm.getValue(),unsaved:this.ide.getUnsaved()})
  },
  QT:function(){this.emit('CloseWindow',{win:this.id})},
  BK:function(cm){this.tc?this.emit('TraceBackward',{win:this.id}):cm.execCommand('undo')},
  FD:function(cm){this.tc?this.emit('TraceForward' ,{win:this.id}):cm.execCommand('redo')},
  SC:function(cm){
    var v=cm.getSelection();/^[ -\uffff]+$/.test(v)&&this.cmSC.setValue(v)
    this.cmSC.focus();this.cmSC.execCommand('selectAll')
  },
  RP:function(cm){
    if(cm.getOption('readOnly'))return
    var v=cm.getSelection()||this.cword();if(v&&v.indexOf('\n')<0){this.cmSC.setValue(v);this.cmRP.setValue(v)}
    this.cmRP.focus();this.cmRP.execCommand('selectAll');this.highlightSearch()
  },
  EP:function(cm){this.isClosing=1;this.FX(cm)},
  FX:function(cm){
    var ed=this,v=cm.getValue(),stop=ed.getStops()
    if(ed.tc||v===ed.oText&&''+stop===''+ed.oStop){ed.emit('CloseWindow',{win:ed.id});return} // if tracer or unchanged
    for(var i=0;i<stop.length;i++)cm.setGutterMarker(stop[i],'breakpoints',null)
    ed.emit('SaveChanges',{win:ed.id,text:cm.getValue().split('\n'),stop:stop})
  },
  TL:function(cm){ // toggle localisation
    var name=this.cword(),l,l0=l=cm.getCursor().line;if(!name)return
    while(l>=0&&!/^\s*∇\s*\S/.test(cm.getLine(l)))l-- // search back for tradfn header (might find a dfns's ∇ instead)
    if(l<0&&!/\{\s*$/.test(cm.getLine(0).replace(/⍝.*/,'')))l=0
    if(l<0||l===l0)return
    var m=/([^⍝]*)(.*)/.exec(cm.getLine(l)), s=m[1], com=m[2]
    var a=s.split(';'), head=a[0].replace(/\s+$/,''), tail=a.length>1?a.slice(1):[]
    tail=tail.map(function(x){return x.replace(/\s+/g,'')})
    var i=tail.indexOf(name);i<0?tail.push(name):tail.splice(i,1)
    s=[head].concat(tail.sort()).join(';')+(com?(' '+com):'')
    cm.replaceRange(s,{line:l,ch:0},{line:l,ch:cm.getLine(l).length},'D')
  },
  LN:function(cm){ // toggle line numbers
    var v=!!(this.tc?D.prf.lineNumsTracer.toggle():D.prf.lineNumsEditor.toggle())
    cm.setOption('lineNumbers',v);this.updGutters();this.$tb.find('.tb_LN').toggleClass('pressed',v)
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
  ER:function(cm){
    if(this.tc){this.emit('RunCurrentLine',{win:this.id});return}
    if(D.prf.autoCloseBlocks()){
      var u=cm.getCursor(),l=u.line,s=cm.getLine(l),m
      var re=/^(\s*):(class|disposable|for|if|interface|namespace|property|repeat|section|select|trap|while|with)\b([^⋄\{]*)$/i
      if(u.ch===s.length&&(m=re.exec(s))&&!D.syn.dfnDepth(cm.getStateAfter(l-1))){
        var pre=m[1],kw=m[2],post=m[3],l1=l+1,end=cm.lastLine();kw=kw[0].toUpperCase()+kw.slice(1).toLowerCase()
        while(l1<=end&&/^\s*(?:$|⍝)/.test(cm.getLine(l1)))l1++ // find the next non-blank line
        var s1=cm.getLine(l1)||'',pre1=s1.replace(/\S.*$/,'')
        if(pre.length>pre1.length||pre.length===pre1.length&&!/^\s*:(?:end|else|andif|orif|case|until|access)/i.test(s1)){
          var r=':'+kw+post+'\n'+pre+':End'
          D.prf.autoCloseBlocksEnd()||(r+=kw)
          cm.replaceRange(r,{line:l,ch:pre.length},{line:l,ch:s.length})
          cm.execCommand('indentAuto');cm.execCommand('goLineUp');cm.execCommand('goLineEnd')
        }
      }
    }
    cm.execCommand('newlineAndIndent')
  },
  BH:function(){this.emit('ContinueTrace' ,{win:this.id})},
  RM:function(){this.emit('Continue'      ,{win:this.id})},
  MA:function(){this.emit('RestartThreads',{win:this.id})},
  CBP:function(){ // Clear trace/stop/monitor for this object
    var ed=this,n=ed.cm.lineCount();for(var i=0;i<n;i++)ed.cm.setGutterMarker(i,'breakpoints',null)
    ed.tc&&ed.emit('SetLineAttributes',{win:ed.id,nLines:n,stop:ed.getStops(),trace:[],monitor:[]})
  },
  BP:function(cm){ // toggle breakpoint
    var sels=cm.listSelections()
    for(var i=0;i<sels.length;i++){
      var p=sels[i].anchor,q=sels[i].head;if(p.line>q.line){var h=p;p=q;q=h}
      var l1=q.line-(p.line<q.line&&!q.ch)
      for(var l=p.line;l<=l1;l++)cm.setGutterMarker(l,'breakpoints',
        (cm.getLineHandle(l).gutterMarkers||{}).breakpoints?null:this.createBPEl()
      )
    }
    this.tc&&this.emit('SetLineAttributes',{win:this.id,nLines:cm.lineCount(),stop:this.getStops()})
  },
  RD:function(cm){
    if(cm.somethingSelected()){cm.execCommand('indentAuto')}
    else{var u=cm.getCursor();cm.execCommand('SA');cm.execCommand('indentAuto');cm.setCursor(u)}
  },
  VAL:function(cm){
    var a=cm.getSelections(), s=a.length!==1?'':!a[0]?this.cword():a[0].indexOf('\n')<0?a[0]:''
    s&&this.ide.wins[0].opts.exec(['      '+s],0)
  },
  addJump:function(){var j=this.jumps,u=this.cm.getCursor();j.push({lh:this.cm.getLineHandle(u.line),ch:u.ch})>10&&j.shift()},
  JBK:function(cm){var p=this.jumps.pop();p&&cm.setCursor({line:p.lh.lineNo(),ch:p.ch})},
  tabOrAutocomplete:function(cm){
    if(cm.somethingSelected()){cm.execCommand('indentMore');return}
    var c=cm.getCursor(),s=cm.getLine(c.line);if(/^ *$/.test(s.slice(0,c.ch))){cm.execCommand('indentMore');return}
    this.autocompleteWithTab=1;this.emit('GetAutocomplete',{line:s,pos:c.ch,token:this.id,win:this.id})
  },
  downOrXline:function(cm){
    var l=cm.getCursor().line;if(l!==cm.lastLine()||/^\s*$/.test(cm.getLine(l))){cm.execCommand('goLineDown');return}
    cm.execCommand('goDocEnd');cm.execCommand('newlineAndIndent');this.xline=l+1
  },
  onbeforeunload:function(){ // called when the user presses [X] on the OS window
    var ed=this
    if(ed.ide.dead){D.nww&&D.nww.close(true)} // force close window
    else if(ed.tc||ed.cm.getValue()===ed.oText&&''+ed.getStops()===''+ed.oStop){ed.EP(ed.cm)}
    else if(!ed.dlg){
      window.focus()
      ed.dlg=$('<p>The object "'+ed.name+'" has changed.<br>Do you want to save the changes?</p>').dialog({
        width:400,title:'Save?',close:function(){ed.dlg.dialog('close');ed.dlg=null},
        buttons:[
          {html:'<u>Y</u>es'   ,click:function(){ed.dlg.dialog('close');ed.dlg=null;ed.EP(ed.cm)}},
          {html:'<u>N</u>o'    ,click:function(){ed.dlg.dialog('close');ed.dlg=null;ed.QT(ed.cm)}},
          {html:'<u>C</u>ancel',click:function(){ed.dlg.dialog('close');ed.dlg=null}}
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
D.Ed.ACB_VALUE=ACB_VALUE

}())
