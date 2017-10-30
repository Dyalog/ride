//various stuff related to keymapping
;(function(){'use strict'

D.prf.prefixKey(function(x,old){
  if(x!==old){var m=CM.keyMap.dyalogDefault;m["'"+x+"'"]=m["'"+old+"'"];delete m["'"+old+"'"]}
})

var ctid=0 //backquote completion timeout id
CM.keyMap.dyalogDefault={fallthrough:'default',End:'goLineEndSmart'}
//D.db is initialised later in init.js, so we must wait until the next tick for D.prf.prefixKey():
setTimeout(function(){CM.keyMap.dyalogDefault["'"+D.prf.prefixKey()+"'"]='BQC'},1)
$.extend(CM.commands,{
  TB:function(){D.ide.switchWin( 1)},
  BT:function(){D.ide.switchWin(-1)},
  SA:CM.commands.selectAll,
  CT:function(){document.execCommand('Cut'  )},
  CP:function(){document.execCommand('Copy' )},
  PT:function(){document.execCommand('Paste')},
  EMD:function(cm){D.send('Edit',{win:cm.dyalogCmds.id,pos:0,text:''})},
  TO:CM.commands.toggleFold,
  PRF:function(){D.prf_ui()},
  ABT:function(){D.abt()},
  CNC:function(){
    var p=D.el.process.argv;//if(D.mac)p=p.replace(/(\/Contents\/).*$/,'$1MacOS/nwjs')
    node_require('child_process').spawn(p[0],p.slice(1),{detached:true,stdio:['ignore','ignore','ignore'],
    env:$.extend({},process.env,{RIDE_SPAWN:''})})
    if(D.ide.dead)close()
  },
  OWS:function(){
    if(D.el&&D.lastSpawnedExe){
      const v=D.el.dialog.showOpenDialog(D.elw,{
        title:'Load Workspace',
        filters:[{name:'Workspaces',extensions:['dws']}],
        properties:['openFile']
      })
      if(v){
        $.confirm('Run Latent Expression of '+v[0].replace(/^.*[\\\/]/,'')+'?','Load Workspace',
          function(x){D.ide.exec(['      )'+(x?'':'x')+ 'load '+v[0]+'\n'],0)})
      };
    }
  },
  NEW:function(){
    if(!D.el)return
    if(D.lastSpawnedExe){
      let e={};for(let k in process.env)e[k]=process.env[k]
      e.RIDE_SPAWN=D.lastSpawnedExe;var p=D.el.process.argv
      node_require('child_process').spawn(p[0],p.slice(1),{detached:true,stdio:['ignore','ignore','ignore'],env:e})
    }else{
      $.err('The current session is remote.\nTo connect elsewhere or\nlaunch a local interpreter,\n'+
            'please use "Connect..." instead.','Cannot Start New Session')
    }
  },
  QIT:function(){D.quit()},
  LBR:D.prf.lbar.toggle,
  WI:function(){D.send('WeakInterrupt',{})},
  SI:function(){D.send('StrongInterrupt',{})},
  FUL:function(){
    var d=document,e=d.body,x
    ;(    d.fullscreenElement||d.webkitFullscreenElement||d.mozFullScreenElement||d.msFullscreenElement) //if
      ?(x=d.exitFullscreen   ||d.webkitExitFullscreen   ||d.mozCancelFullScreen ||d.msExitFullscreen   )&&x.apply(d)
      :(x=e.requestFullscreen||e.webkitRequestFullscreen||e.mozRequestFullScreen||e.msRequestFullscreen)&&x.apply(e)
  },
  EXP:function(cm){
    var sels=cm.listSelections(),ll=cm.lastLine(),u=cm.getCursor(),l=u.line;if(sels.length!==1)return
    var ranges=[ //candidates for selection as [line0,ch0,line1,ch1], more candidates will be added later
      [l,0,l, cm.getLine(l) .length], //current line
      [0,0,ll,cm.getLine(ll).length]  //whole document
    ]
    //choose token on the left or right based on how important it looks, and add it to "ranges"
    var t0=cm.getTokenAt(u),t1=cm.getTokenAt({line:u.line,ch:u.ch+1}),tu=t0||t1
    if(t0&&t1&&(t0.start!==t1.start||t0.end!==t1.end)){ //we must decide which token looks more important
      var lr=[t0,t1].map(function(ti){return(ti.type||'').replace(/^.*\bapl-(\w*)$/,'$1')}) //lft and rgt token type
      var I={'var':5,glb:5, quad:4, str:3, num:2, kw:1, par:-1,sqbr:-1,semi:-1,dfn:-1, '':-2} //importance table
      tu=(I[lr[0]]||0)>(I[lr[1]]||0)?t0:t1 //tu is the more important of t0 t1
    }
    tu&&ranges.push([l,tu.start,l,tu.end])
    //look for surrounding pairs of balanced brackets and add them to "ranges"
    var ts=cm.getLineTokens(l),tl=[],tr=[] //tl,tr: tokens for closest op. and cl. brackets, indexed by stack height
    for(var i=0;i<ts.length;i++){
      var t=ts[i],h=(t.state.a||[]).length //stack height
      if(t.end  <=u.ch&&'([{'.indexOf(t.string)>=0)tl[h]=t
      if(t.start>=u.ch&&')]}'.indexOf(t.string)>=0)tr[h+1]=tr[h+1]||t
    }
    var mh=(tu.state.a||[]).length //stack height at current token
    for(var h=Math.min(mh,Math.min(tl.length,tr.length)-1);h>=0;h--){
      tl[h]&&tr[h]&&ranges.push([l,tl[h].end,l,tr[h].start],[l,tl[h].start,l,tr[h].end])
    }
    var sA=sels[0].anchor,sH=sels[0].head,s=[sA.line,sA.ch,sH.line,sH.ch]
    if((s[0]-s[2]||s[1]-s[3])>0)s=[s[2],s[3],s[0],s[1]] //anchor and head could be in reverse order
    var b=ranges[0] //best candidate for new selection
    for(var i=0;i<ranges.length;i++){ //choose candidate that wraps tightest around current selection
      var r=ranges[i],d0=r[0]-s[0]||r[1]-s[1]||0,d1=r[2]-s[2]||r[3]-s[3]||0
      if(d0<=0&&0<=d1&&(d0||d1)&&((b[0]-r[0]||b[1]-r[1]||0)<=0||0<=(b[2]-r[2]||b[3]-r[3]||0)))b=r
    }
    cm.setSelection(CM.Pos(b[0],b[1]),CM.Pos(b[2],b[3]))
  },
  HLP:function(cm){
    var c=cm.getCursor(),s=cm.getLine(c.line).toLowerCase(),h=D.hlp,u,m //u: the URL, m: match object
    if(m=/^ *(\)[a-z]+).*$/.exec(s))u=h[m[1]]||h.WELCOME
    else if(m=/^ *(\][a-z]+).*$/.exec(s))u=h[m[1]]||h.UCMDS
    else if(m=/(\d+) *⌶$/.exec(s.slice(0,c.ch)))u=h[m[1]+'⌶']||h['⌶']+'#'+m[1]
    else{var x=s.slice(s.slice(0,c.ch).replace(/.[áa-z]*$/i,'').length)
                .replace(/^([⎕:][áa-z]*|.).*$/i,'$1').replace(/^:end/,':')
         u=h[x]||(x[0]==='⎕'?h.SYSFNS:x[0]===':'?h.CTRLSTRUCTS:h.LANGELEMENTS)}
    D.openExternal(u)
  },
  BQC:function(cm){
    if(cm.dyalogBQ){var c=cm.getCursor();cm.replaceSelection(D.prf.prefixKey(),'end');return}
    //Make it possible to use pfxkey( etc -- remember the original value of
    //autoCloseBrackets, set it temporarily to false, and restore it when the
    //menu is closed:
    cm.setOption('autoCloseBrackets',false) //this is temporary until bqCleanUp()
    cm.on('change',bqChangeHandler);cm.dyalogBQ=1
    var c0=cm.getCursor();cm.replaceSelection(D.prf.prefixKey(),'end')
    ctid=setTimeout(function(){
      var c1=cm.getCursor(),sel //sel: selected completion object
      if(c1.line!==c0.line||c1.ch!==c0.ch+1){bqCleanUp(cm);return}
      cm.showHint({
        completeOnSingleClick:true,
        extraKeys:{Backspace:function(cm,m){m.close();cm.execCommand('delCharBefore')},
                   Left     :function(cm,m){m.close();cm.execCommand('goCharLeft')},
                   Right    :function(cm,m){m.pick()},
                   F1       :function(){sel&&sel.text&&D.hlp[sel.text]&&D.openExternal(D.hlp[sel.text])}},
        hint:function(){
          var pk=D.prf.prefixKey(),ks=[];for(var x in bq)ks.push(x);ks.sort()
          var data={from:c0,to:cm.getCursor(),list:ks.map(function(k){
            var v=bq[k];return(k===pk
              ?{text:'',hint:bqbqHint,render:function(e){e.innerHTML='  '+pk+pk+' <i>completion by name</i>'}}
              :{text:v,render:function(x){x.textContent=v+' '+pk+k+' '+(D.sqglDesc[v]||'')+'  '}}
            )
          })}
          CM.on(data,'select',function(x){sel=x})
          return data
        }
      })
    },500)
  },
  goLineEndSmart:function(cm){ //CodeMirror provides a goLineStartSmart but not a goLineEndSmart command.
    cm.extendSelectionsBy(function(){
      var c=cm.getCursor(),l=c.line,s=cm.getLine(l),n=s.length,m=s.replace(/ +$/,'').length
      return CM.Pos(l,m<=c.ch&&c.ch<n||!m?n:m)
    },{origin:'+move',bias:-1})
  },
//JSC:function(){D.elw&&D.elw.webContents.toggleDevTools()},
  JSC:function(){var w;D.el&&(w=D.el.BrowserWindow.getFocusedWindow())&&w.webContents.toggleDevTools()},
  LOG:function(){
    if(!D.el)return
    var w=D.logw=new D.el.BrowserWindow({width:400,height:500,parent:D.elw}), cn=node_require(__dirname+'/src/cn')
    w.setTitle('Protocol Log');w.loadURL('file://'+__dirname+'/empty.html')
    w.webContents.executeJavaScript('var d=document,b=d.body,e=d.createElement("div");'+
                                    'b.style.fontFamily="monospace";b.style.overflow="scroll";'+
                                    'e.style.whiteSpace="pre";b.appendChild(e)')
    var f=function(x){w.webContents.executeJavaScript('e.textContent+='+JSON.stringify(x+'\n')+
                                                      ';b.scrollTop=b.scrollHeight')}
    f(cn.getLog().filter(function(x){return x}).join('\n'))
    cn.addLogListener(f);w.on('closed',function(){delete D.logw;cn.rmLogListener(f)})
  },
  TIP:function(){var w=D.ide.focusedWin,u=w.cm.getCursor();w.vt.show({line:u.line,ch:Math.max(0,u.ch-1)},1)},
  AO:function(cm){ //add comment
    if(cm.getOption('readOnly'))return
    if(!cm.somethingSelected()){var l=cm.getCursor().line,p={line:l,ch:0}
                                cm.replaceRange('⍝',p,p,'D');cm.setCursor({line:l,ch:1});return}
    cm.replaceSelections(cm.getSelections().map(function(s){return s.replace(/^/gm,'⍝').replace(/\n⍝$/,'\n')}),'around')
  },
  DO:function(cm){ //delete comment
    if(cm.getOption('readOnly'))return
    if(!cm.somethingSelected()){
      var l=cm.getCursor().line,s=cm.getLine(l)
      cm.replaceRange(s.replace(/^( *)⍝/,'$1'),{line:l,ch:0},{line:l,ch:s.length},'D');cm.setCursor({line:l,ch:0})
      return
    }
    cm.replaceSelections(cm.getSelections().map(function(s){return s.replace(/^⍝/gm,'')}),'around')
  },
  TGC:function(cm){ //toggle comment
    var b=cm.somethingSelected()?cm.getSelections().join('\n').split('\n').every(function(y){return !y||y[0]==='⍝'})
                                :cm.getLine(cm.getCursor().line)[0]==='⍝'
    cm.execCommand(b?'DO':'AO')
  },
  SC:CM.commands.find,
  RP:CM.commands.replace,
  PV:CM.commands.findPrev,
  NX:CM.commands.findNext
})
// function switchWin(x){var a=[],i=-1,wins=D.ide.wins;for(var k in wins){wins[k].hasFocus()&&(i=a.length);a.push(wins[k])}
//                       var j=i<0?0:(i+a.length+x)%a.length;a[j].focus();return!1} //x: +1 or -1

//pfkeys
function nop(){}
function fakeEvent(s){
  var e={type:'keydown',ctrlKey:false,shiftKey:false,altKey:false,preventDefault:nop,stopPropagation:nop}
  var h={C:'ctrlKey',A:'altKey',S:'shiftKey'}
  var s1=s.replace(/(\w+)-/g,function(_,type){e[h[type]||type.toLowerCase()+'Key']=true;return''})
  for(var k in CM.keyNames)if(CM.keyNames[k]===s1){e.keyCode=k;break}
  e.keyCode||fail('Unknown key:'+JSON.stringify(s))
  return e
}
for(var i=1;i<=12;i++)CM.commands['PF'+i]=function pfk(i){
  D.prf.pfkeys()[i].replace(/<(.+?)>|(.)/g,function(_,x,y){
    var w=D.ide.focusedWin;y?w.insert(y):CM.commands[x]?w.cm.execCommand(x):w.cm.triggerOnKeyDown(fakeEvent(x))
  })
}.bind(this,i)

//D.kbds.layouts[lc] contains four strings describing how keys map to characters:
// 0:normal  1:shifted
// 2:APL     3:APL shifted
//Each string can be indexed by scancode: http://www.abreojosensamblador.net/Productos/AOE/html/Pags_en/ApF.html
//"APL" and "APL shifted" are the defaults upon which the user can build customisations.
var bq //effective ` map as a dictionary, kept in sync with the prefs
function updBQ(){bq={};var lc=D.prf.kbdLocale(), l=D.kbds.layouts[lc]||D.kbds.layouts.en_US, n=l[0].length
                 for(var i=0;i<2;i++)for(var j=0;j<n;j++){var name=l[i][j];bq[name]||(bq[name]=l[2+i][j])}
                 var s=D.prf.prefixMaps()[lc];if(s)for(var i=0;i<s.length;i+=2)bq[s[i]]=s[i+1]}
updBQ();D.prf.prefixMaps(updBQ);D.prf.kbdLocale(updBQ)

//order: used to measure how "complicated" (for some made-up definition of the word) a shortcut is.
//Tooltips in the lbar show the simplest one.
var order='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
function complexity(x){return(1+order.indexOf(x))||(1+order.length+x.charCodeAt(0))}
D.getBQKeyFor=function(v){var r='',x,y;for(x in bq){y=bq[x];if(y===v&&(!r||complexity(r)>complexity(x)))r=x}
                          var pk=D.prf.prefixKey();return r===pk?pk+pk:r}

function bqChangeHandler(cm,o){ //o:changeObj
  if(!cm.dyalogBQ)return
  var l=o.from.line,c=o.from.ch
  if(o.origin!=='+input'||o.text.length!==1||o.text[0].length!==1){bqCleanUp(cm);return}
  var x=o.text[0],pk=D.prf.prefixKey()
  if(x!==pk){
    var y=x===' '?pk:bq[x]
    if(y){cm.replaceRange(y,{line:l,ch:c-1},{line:l,ch:c+1},'D')
          y==='∇'&&/^\s*∇/.test(cm.getLine(l))&&cm.getOption('smartIndent')&&cm.indentLine(l,'smart')}
    bqCleanUp(cm);return
  }
  var s=cm.getLine(l)
  if(s.slice(c-2,c)===pk+pk){cm.replaceRange(bq[pk]||'',{line:l,ch:c-2},{line:l,ch:c+1},'D');return} //``` for ⋄
  if(s[c-1]===pk){bqCleanUp(cm);bqbqHint(cm)}
}
function bqCleanUp(cm){
  delete cm.dyalogBQ;clearTimeout(ctid);var ca=cm.state.completionActive;ca&&ca.close&&ca.close()
  cm.setOption('autoCloseBrackets',!!D.prf.autoCloseBrackets()&&D.Ed.ACB_VALUE)
}
function bqbqHint(cm){
  var sel, pick=function(cm,m){return m.pick()}, c=cm.getCursor() //sel:selected completion object
  cm.showHint({completeOnSingleClick:true,
               extraKeys:{Right:pick,Space:pick,F1:function(){sel&&D.hlp[sel.text]&&D.openExternal(D.hlp[sel.text])}},
               hint:function(){var u=cm.getLine(c.line).slice(c.ch,cm.getCursor().ch),a=[]
                               for(var i=0;i<bqbqc.length;i++){var x=bqbqc[i];x.name.slice(0,u.length)===u&&a.push(x)}
                               var data={from:{line:c.line,ch:c.ch-2},to:cm.getCursor(),list:a}
                               CM.on(data,'select',function(x){sel=x});return data}})
}

var bqbqc=[] //backquote-backquote completions
for(var i=0;i<D.informal.length;i++){
  var a=D.informal[i].split(' ')
  for(var j=1;j<a.length;j++)bqbqc.push({name:a[j],text:a[0],render:
    (function(squiggle,name){ //bind squiggle=a[0] and name=a[j]
      return function(x){var key=D.getBQKeyFor(squiggle),pk=D.prf.prefixKey() //the actual .render() function
                         x.textContent=squiggle+' '+(key?pk+key:'  ')+' '+pk+pk+name}
    }(a[0],a[j]))
  })
}
//       0    1    2    3    4    5    6    7    8    9    A    B    C    D    E    F
var C=['QT','ER','TB','BT','EP','UC','DC','RC','LC','US','DS','RS','LS','UL','DL','RL', //00
       'LL','HO','CT','PT','IN','II','DI','DP','DB','RD','TG','DK','OP','CP','MV','FD', //10
       'BK','ZM','SC','RP','NX','PV','RT','RA','ED','TC','NB','NS','ST','EN','IF','HK', //20
       'FX','LN','MC','MR','JP','D1','D2','D3','D4','D5','U1','U2','U3','U4','U5','Lc', //30
       'Rc','LW','RW','Lw','Rw','Uc','Dc','Ll','Rl','Ul','Dl','Us','Ds','DD','DH','BH', //40
       'BP','AB','HT','TH','RM','CB','PR','SR',null,'TL','UA','AO','DO','GL','CH','PU', //50
       'PA',null,null,null,null,null,null,null,null,null,null,null,null,null,null,null, //60
       null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null, //70
       null,null,null,null,null,null,'TO','MO',null,null,null,null,null,'S1','S2','OS'] //80
function defCmd(x){var c=CM.commands;c[x]||(c[x]=function(cm){var h=cm.dyalogCmds;h&&h[x]&&h[x](cm)})}
('CBP MA AC VAL indentOrComplete downOrXline indentMoreOrAutocomplete STL TVO TVB'+
' TGC JBK JSC LOG WSE').split(' ').forEach(defCmd)
for(var i=0;i<C.length;i++)if(C[i]){defCmd(C[i]);CM.keyMap.dyalogDefault["'"+String.fromCharCode(0xf800+i)+"'"]=C[i]}

}())
