'use strict'
require('./menu')
var prefs=require('./prefs'),prefsUI=require('./prefs-ui'),parseMenuDSL=require('./prefs-menu').parseMenuDSL,
    editor=require('./editor'),Editor=editor.Editor,ACB_VALUE=editor.ACB_VALUE,Session=require('./session').Session,
    keymap=require('./keymap'),util=require('./util'),esc=util.esc,throttle1=util.throttle1,
    cmds=require('./cmds').cmds,lbar=require('./lbar'),wse=require('./wse'),vtips=require('./vtips')
function parseId(s){return+s.replace(/^.*?(\d+)$/,'$1')}
this.IDE=function(){
  var ide=D.ide=this
  document.body.innerHTML=
    '<div class=lbar style=display:none><a class=lbar-prefs href=#></a>'+lbar.html+'</div>'+
    '<div class=lbar-tip style=display:none><div class=lbar-tip-desc></div><pre class=lbar-tip-text></pre></div>'+
    '<div class=lbar-tip-triangle style=display:none></div>'+
    '<div class=ide>'+
      '<div class="ui-layout-west wse">Workspace Explorer</div>'+
      '<div class=ui-layout-center></div>'+
      '<div class=ui-layout-east ><ul></ul></div>'+
      '<div class=ui-layout-south><ul></ul></div>'+
    '</div>'+
    '<div class=sbar></div>'
  ide.$ide=$('.ide')
  ide.pending=[] // lines to execute: AtInputPrompt consumes one item from the queue, HadError empties it
  ide.exec=function(l,tc){ // l:lines, tc:trace
    if(l&&l.length){tc||(ide.pending=l.slice(1));ide.emit('Execute',{trace:tc,text:l[0]+'\n'})}
  }
  ide.host=ide.port=ide.wsid='';prefs.title(ide.updTitle.bind(ide))
  D.wins=ide.wins={0:new Session(ide,$('.ui-layout-center'),{id:0,emit:ide.emit.bind(ide),exec:ide.exec.bind(ide)})}
  ide.focusedWin=ide.wins[0] // last focused window, it might not have the focus right now

  // tab management
  ide.tabOpts={heightStyle:'fill',activate:(function(_,ui){
    var w=ide.wins[parseId(ui.newTab.prop('id'))];w.updSize();w.focus();w.updGutters()
  })}
  ide.$tabs=$('.ui-layout-east,.ui-layout-south').tabs(ide.tabOpts)
  ide.refreshTabs=function(){
    $('.ui-layout-east  li',ide.$ide).length||ide.layout.close('east')
    $('.ui-layout-south li',ide.$ide).length||ide.layout.close('south')
    ide.$tabs.tabs('refresh')
  }
  ide.$tabs.find('ul')
    .on('click','.tab-close',function(){var w=ide.wins[parseId($(this).closest('a').prop('href'))];w&&w.EP(w.cm)})
    .sortable({cursor:'move',containment:'parent',tolerance:'pointer',axis:'x',revert:true,
               // $().sortable changes z-indices after dragging, so we fix those in stop()
               stop:function(_,ui){ide.refreshTabs();$('[role=tab]',ide.$tabs).attr('style','')}})
    .each(function(){$(this).data('ui-sortable').floating=true}) // workaround bugs.jqueryui.com/ticket/6702#comment:20
  var handlers=this.handlers={ // for RIDE protocol messages
    '*connected':function(x){ide.setHostAndPort(x.host,x.port)},
    '*error':function(x){ide.die();setTimeout(function(){$.alert(x.msg,'Error')},100)},
    '*spawnedExited':function(x){
      if(x.code){ide.die();setTimeout(function(){$.alert('Interpreter process exited with code '+x.code,'Error')},100)}
      if(D.process&&!x.code){D.process.exit(0)}
    },
    '*disconnected':function(){if(!ide.dead){$.alert('Interpreter disconnected','Error');ide.die()}},
    Identify:function(x){D.remoteIdentification=x;ide.updTitle();ide.connected=1;ide.wins[0].updPW(1)},
    Disconnect:function(x){
      if(ide.dead)return
      ide.die()
      if(x.message==='Dyalog session has ended'){try{close()}catch(e){};(D.process||{}).exit&&D.process.exit(0)}
      else $.alert(x.message,'Interpreter disconnected')
    },
    SysError:function(x){$.alert(x.text,'SysError');ide.die()},
    InternalError:function(x){$.alert('An error ('+x.error+') occurred processing '+x.message,'Internal Error')},
    NotificationMessage:function(x){$.alert(x.message,'Notification')},
    UpdateDisplayName:function(a){ide.wsid=a.displayName;ide.updTitle()},
    EchoInput:function(x){ide.wins[0].add(x.input)},
    AppendSessionOutput:function(x){var r=x.result;ide.wins[0].add(typeof r==='string'?r:r.join('\n'))},
    SetPromptType:function(x){
      var t=x.type;t&&ide.pending.length?ide.emit('Execute',{trace:0,text:ide.pending.shift()+'\n'}):ide.wins[0].prompt(t)
      t===4&&ide.wins[0].focus() // ⍞ input
    },
    HadError:function(){ide.pending.splice(0,ide.pending.length)},
    FocusWindow:throttle1(function(x){$('#wintab'+x.win+' a').click();var w=ide.wins[x.win];w&&w.focus()}),
    WindowTypeChanged:function(x){return ide.wins[x.win].setTracer(x.tracer)},
    ReplyGetAutocomplete:function(x){var w=ide.wins[x.token];w&&w.processAutocompleteReply(x)},
    ValueTip:function(x){ide.wins[x.token].vt.processReply(x)},
    SetHighlightLine:function(x){ide.wins[x.win].highlight(x.line)},
    UpdateWindow:function(x){$('#wintab'+x.token+' a').text(x.name);ide.wins[x.token].open(x)},
    ReplySaveChanges:function(x){var w=ide.wins[x.win];w&&w.saved(x.err)},
    CloseWindow:function(x){
      $('#wintab'+x.win+',#win'+x.win).remove();ide.$tabs.tabs('destroy').tabs(ide.tabOpts);ide.refreshTabs()
      var w=ide.wins[x.win];if(w){w.closePopup&&w.closePopup();w.vt.clear()}
      delete ide.wins[x.win];ide.wins[0].focus()
    },
    OpenWindow:ide.openWindow.bind(ide),
    ShowHTML:ide.showHTML.bind(ide),
    OptionsDialog:function(x){
      var i=-1;function f(e){i=$(e.target).closest('.ui-button').index();$(this).dialog('close')} // i:clicked index
      $('<p>').text(typeof x.text==='string'?x.text:x.text.join('\n')).dialog({ // todo: clean up after transition to json protocol
        modal:1,title:x.title,buttons:x.options.map(function(s){return{text:s,click:f}}),
        close:function(){ide.emit('ReplyOptionsDialog',{index:i,token:x.token})}
      })
    },
    StringDialog:function(x){
      var ok,$i=$('<input>').val(x.initialValue||'')
      $('<p>').text(x.text||'').append('<br>').append($i).dialog({
        modal:1,title:x.title,buttons:[
          {html:'<u>O</u>K'    ,click:function(){ok=1;$(this).dialog('close')}},
          {html:'<u>C</u>ancel',click:function(){     $(this).dialog('close')}}
        ],
        close:function(){ide.emit('ReplyStringDialog',{value:ok?$i.val():x.defaultValue||null,token:x.token})}
      })
    },
    TaskDialog:function(x){
      var i=-1 // the result
      var $d=$('<div class=task-dialog><p>'+esc(x.text||'')+'<p class=subtext>'+esc(x.subtext||'')+'<div>'+
                 x.buttonText.map(function(s){return'<button class=task>'+esc(s)+'</button>'}).join('')+
               '</div><p class=footer>'+esc(x.footer||'')+'</div>')
      $d.on('click','.task',function(e){i=100+$(e.target).index();$d.dialog('close')})
        .dialog({modal:1,title:x.title,close:function(){ide.emit('ReplyTaskDialog',{index:i,token:x.token})},
                 buttons:x.options.map(function(s){return{text:s,click:function(e){
                   i=$(e.target).closest('.ui-button').index();$d.dialog('close')
                 }}})})
    },
    ReplyTreeList:function(x){ide.wse.replyTreeList(x)},
    StatusOutput:function(x){$('.sbar').text(x.text)},
    UnknownRIDECommand:function(){}, // todo
    UnknownCommand:function(){}
  }
  // We need to be able to temporarily block the stream of messages coming from socket.io
  // Creating a floating window can only be done asynchronously and it's possible that a message
  // for it comes in before the window is ready.
  var mq=[],blk=0,tid=0,last=0 // mq:message queue, blk:blocked?, tid:timeout id, last:when last rundown finished
  function rd(){ // run down the queue
    ide.wins[0].cm.operation(function(){
      while(mq.length&&!blk){
        var a=mq.shift(),f=handlers[a[0]];f?f.apply(ide,a.slice(1)):ide.emit('UnknownCommand',{name:a[0]})
      }
      last=+new Date;tid=0
    })
  }
  function rrd(){tid||(new Date-last<20?(tid=setTimeout(rd,20)):rd())} // request rundown
  D.socket.onevent=function(h){mq.push(h.data);rrd()}
  ide.block=function(){blk++}
  ide.unblock=function(){--blk||rrd()}

  // language bar
  $('.lbar-prefs').click(function(){prefsUI.showDialog('layout')})
  var $tip=$('.lbar-tip'),$tipDesc=$('.lbar-tip-desc'),$tipText=$('.lbar-tip-text'),$tipTriangle=$('.lbar-tip-triangle')
  var ttid=null // tooltip timeout id
  function requestTooltip(e,desc,text){ // e:element
    clearTimeout(ttid);var $t=$(e.target),p=$t.position()
    ttid=setTimeout(function(){
      ttid=null;$tipDesc.text(desc);$tipText.text(text)
      $tipTriangle.css({left:3+p.left+($t.width()-$tipTriangle.width())/2,top:p.top+$t.height()+2}).show()
      var x0=p.left-21,x1=x0+$tip.width(),y0=p.top+$t.height()
      $tip.css(x1>$(document).width()?{left:'',right:0,top:y0}:{left:Math.max(0,x0),right:'',top:y0}).show()
    },200)
  }
  $('.lbar')
    .on('mousedown',function(){return!1})
    .on('mousedown','b',function(e){var c=$(this).text(),w=ide.focusedWin;(w.hasFocus()?w:$(':focus')).insert(c);return!1})
    .on('mouseout','b,.lbar-prefs',function(){clearTimeout(ttid);ttid=null;$tip.add($tipTriangle).hide()})
    .on('mouseover','b',function(e){
      var c=$(this).text(),k=keymap.getBQKeyFor(c),s=k&&c.charCodeAt(0)>127?'Keyboard: '+prefs.prefixKey()+k+'\n\n':''
      var h=lbar.tips[c]||[c,''];requestTooltip(e,h[0],s+h[1])
    })
    .on('mouseover','.lbar-prefs',function(e){
      var h=prefs.keys(),s=''
      for(var i=0;i<cmds.length;i++){
        var code=cmds[i][0],desc=cmds[i][1],defaults=cmds[i][2],important=cmds[i][3]
        if(important){
          var pad=Array(Math.max(0,25-desc.length)).join(' '),ks=h[code]||defaults
          s+=code+':'+desc+':'+pad+' '+(ks[ks.length-1]||'none')+'\n'
        }
      }
      requestTooltip(e,'Keyboard Shortcuts',s+'...')
    })
  var layout=ide.layout=ide.$ide.layout({
    fxName:'',defaults:{enableCursorHotkey:0},
    west: {spacing_closed:0,resizable:1,togglerLength_open:0,size:'0%'},
    east: {spacing_closed:0,resizable:1,togglerLength_open:0,size:'0%'},
    south:{spacing_closed:0,resizable:1,togglerLength_open:0,size:'0%'},
    center:{onresize:function(){
      for(var k in ide.wins)ide.wins[k].updSize()
      var st=ide.layout.state
      var w=st.east .innerWidth ;!st.east .isClosed&&w>1&&prefs.editorWidth (w)
      var h=st.south.innerHeight;!st.south.isClosed&&h>1&&prefs.tracerHeight(h)
    }}
  })
  function updTopBtm(){
    ide.$ide.css({top:(prefs.lbar()?$('.lbar').height():0)+(D.mac?5:22),bottom:prefs.sbar()?$('.sbar').height():0})
    layout&&layout.resizeAll()
  }
  $('.lbar').toggle(!!prefs.lbar());$('.sbar').toggle(!!prefs.sbar());updTopBtm();$(window).resize(updTopBtm)
  layout.close('west');layout.close('east');layout.close('south');ide.wins[0].updSize()
  prefs.lbar(function(x){$('.lbar').toggle(!!x);updTopBtm()})
  prefs.sbar(function(x){$('.sbar').toggle(!!x);updTopBtm()})
  try{
    D.installMenu(parseMenuDSL(prefs.menu()))
  }catch(e){
    $.alert('Invalid menu configuration -- the default menu will be used instead','Warning')
    console.error(e);D.installMenu(parseMenuDSL(prefs.menu.getDefault()))
  }
  function eachWin(f){for(var k in ide.wins){var w=ide.wins[k];w.cm&&f(w)}}
  prefs.autoCloseBrackets(function(x){eachWin(function(w){w.cm.setOption('autoCloseBrackets',!!x&&ACB_VALUE)})})
  prefs.indent(function(x){eachWin(function(w){if(w.id){w.cm.setOption('smartIndent',x>=0);w.cm.setOption('indentUnit',x)}})})
  prefs.fold(function(x){eachWin(function(w){if(w.id){w.cm.setOption('foldGutter',!!x);w.updGutters()}})})
  prefs.matchBrackets(function(x){eachWin(function(w){w.cm.setOption('matchBrackets',!!x)})})
  var updWSE=function(){
    if(!prefs.wse()){ide.layout.close('west');return}
    ide.layout.sizePane('west',180);ide.layout.open('west')
    ide.wse||(ide.wse=new wse.WSE($('.wse'),ide));ide.wse.refresh()
  }
  prefs.wse(updWSE);prefs.wse()&&setTimeout(updWSE,500)
  D.mac&&setTimeout(function(){ide.wins[0].focus()},500) // OSX is stealing our focus.  Let's steal it back!  Bug #5
}
this.IDE.prototype={
  setHostAndPort:function(h,p){this.host=h;this.port=p;this.updTitle()},
  emit:function(x,y){this.dead||D.socket.emit(x,y)},
  die:function(){ // don't really, just pretend
    if(this.dead)return
    this.dead=1;this.connected=0;this.$ide.addClass('disconnected');for(var k in this.wins)this.wins[k].die()
  },
  updTitle:function(){ // change listener for prefs.title
    var ide=this,ri=D.remoteIdentification||{},v=D.versionInfo
    D.setTitle(prefs.title().replace(/\{\w+\}/g,function(x){var X=x.toUpperCase();return(
      X==='{WSID}'?ide.wsid:
      X==='{HOST}'?ide.host:
      X==='{PORT}'?ide.port:
      X==='{PID}'?ri.pid:
      X==='{CHARS}'?(ri.arch||'').split('/')[0]:
      X==='{BITS}' ?(ri.arch||'').split('/')[1]:
      X==='{VER_A}'?(ri.version||'').split('.')[0]:
      X==='{VER_B}'?(ri.version||'').split('.')[1]:
      X==='{VER_C}'?(ri.version||'').split('.')[2]:
      X==='{VER}'?ri.version:
      X==='{RIDE_VER_A}'?(v.version||'').split('.')[0]:
      X==='{RIDE_VER_B}'?(v.version||'').split('.')[1]:
      X==='{RIDE_VER_C}'?(v.version||'').split('.')[2]:
      X==='{RIDE_VER}'?v.version:
      x
    )||''})||'Dyalog')
  },
  showHTML:function(x){
    var ide=this
    var init=function(){
      ide.w3500.document.body.innerHTML=x.html
      ide.w3500.document.getElementsByTagName('title')[0].innerHTML=esc(x.title||'3500⌶')
    }
    if(ide.w3500&&!ide.w3500.closed){ide.w3500.focus();init()}
    else{ide.w3500=open('empty.html','3500 I-beam','width=800,height=500');ide.w3500.onload=init}
  },
  openWindow:function(ee){
    var ide=this
    if(!ee['debugger']&&D.openInExternalEditor){
      D.openInExternalEditor(ee,function(s){
        ide.emit('SaveChanges',{win:ee.token,text:s.split('\n'),stop:ee.stop,trace:ee.trace,monitor:ee.monitor})
        ide.emit('CloseWindow',{win:ee.token})
      })
      return
    }
    var w=ee.token, done, editorOpts={id:w,name:ee.name,tracer:ee['debugger'],emit:this.emit.bind(this)}
    if(prefs.floating()&&!D.floating&&!this.dead){
      var p=ee['debugger']?prefs.posTracer():prefs.posEditor()
      if(!p[4]){var delta=32*(ee.token-1);p[0]+=delta;p[1]+=delta}
      var ph={x:p[0],y:p[1],width:p[2],height:p[3]}
      var url='ed.html?win='+w+'&x='+p[0]+'&y='+p[1]+'&width='+p[2]+
              '&height='+p[3]+'&maximized='+(p[4]||0)+'&token='+w+'&tracer='+(+!!ee['debugger'])
      if(D.open(url,$.extend({title:ee.name},ph))){
        this.block() // the popup will create D.wins[w] and unblock the message queue
        ;(D.pendingEditors=D.pendingEditors||{})[w]={editorOpts:editorOpts,ee:ee,ide:this};done=1
      }else{
        $.alert('Popups are blocked.')
      }
    }
    if(!done){
      var dir=ee['debugger']?'south':'east', size=ee['debugger']?prefs.tracerHeight():prefs.editorWidth()
      this.layout.sizePane(dir,size||'50%');this.layout.open(dir)
      var $li=$('<li id=wintab'+w+'><a href=#win'+w+'><span class=tab-name></span>'+
                                   '<span class=tab-close title="Save and close">×</span></a>')
        .appendTo('.ui-layout-'+dir+' ul')
        .click(function(e){var win=D.ide.wins[w];e.which===2&&win&&win.EP&&win.EP(win.cm)}) // middle click
      $li.find('.tab-name').text(ee.name)
      var $tabContent=$('<div class=win id=win'+w+'>').appendTo('.ui-layout-'+dir)
      ;(this.wins[w]=new Editor(this,$tabContent,editorOpts)).open(ee)
      $('.ui-layout-'+dir).tabs('refresh').tabs({active:-1})
        .data('ui-tabs').panels.off('keydown') // prevent jQueryUI tabs from hijacking <C-Up>
    }
  },
  focusMRUWin:function(){ // most recently used
    var t=0,w;for(var k in this.wins){var x=this.wins[k];if(x.id&&t<=x.focusTimestamp){w=x;t=x.focusTimestamp}}
    w&&w.focus()
  },
  LBR:prefs.lbar      .toggle,
  FLT:prefs.floating  .toggle,
  WRP:prefs.wrap      .toggle,
  TOP:prefs.floatOnTop.toggle,
  THM:function(){},
  UND:function(){this.focusedWin.cm.undo()},
  RDO:function(){this.focusedWin.cm.redo()},
  getUnsaved:function(){
    var r={};for(var k in this.wins){var cm=this.wins[k].cm,v=cm.getValue();if(+k&&v!==cm.oText)r[k]=v}
    return r
  }
}
CodeMirror.commands.WSE=function(){prefs.wse.toggle()}
