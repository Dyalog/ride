// NW.js-specific initialisation
if(typeof process!=='undefined'){
  var gui=require('nw.gui'),fs=require('fs'),nomnom=require('./nomnom'),
      path=require('path'),spawn=require('child_process').spawn,proxy=require('./proxy')

  // Detect platform
  //   https://nodejs.org/api/process.html#process_process_platform
  //   https://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
  D.nwjs=1;D.win=/^win/i.test(process.platform);D.mac=process.platform=='darwin';D.floating=!!opener

  console.log=function(s){try{process.stdout.write(s+'\n')}catch(_){console.log=function(){}}}
  D.opts=nomnom.options({
    connect:{abbr:'c',flag:true,metavar:'HOST[:PORT]'},
    listen:{abbr:'l',flag:true},
    spawn:{abbr:'s',flag:true,'default': // "default" depends on whether we are a standalone RIDE
      D.win?false:
      D.mac?fs.existsSync(path.dirname(process.execPath)+'/../../../../Resources/Dyalog/mapl'):
      fs.existsSync(path.dirname(process.execPath)+'/../mapl')
    },
    version:{abbr:'v',flag:true,help:'print version and exit'}
  }).parse(gui.App.argv)

  if(D.opts.version){console.log(D.versionInfo.version);process.exit(0)}

  // switch IME locale as early as possible
  if(D.win&&(!localStorage.ime||localStorage.ime==='1')){
    var setImeExe=process.execPath.replace(/[^\\\/]+$/,'set-ime.exe')
    fs.existsSync(setImeExe)&&spawn(setImeExe,[process.pid],{stdio:['ignore','ignore','ignore']})
  }

  function segmOverlap(a,b,c,d){return a<d&&c<b} // do the two segments ab and cd overlap?
  function rectOverlap(r0,r1){ // a rectangle is {x,y,width,height}; do the two overlap?
    return segmOverlap(r0.x,r0.x+r0.width, r1.x,r1.x+r1.width)&&
           segmOverlap(r0.y,r0.y+r0.height,r1.y,r1.y+r1.height)
  }
  function segmFit(a,b,A,B){ // nudge and/or squeeze "ab" as necessary so it fits into "AB"
    return(b-a>B-A)?[A,B]:a<A?[A,A+b-a]:b>B?[B-b+a,B]:[a,b]
  }
  function rectFit(r,R){ // like segmFit() but for for rectangles
    var u=segmFit(r.x,r.x+r.width ,R.x,R.x+R.width ),x=u[0],x1=u[1]
    var v=segmFit(r.y,r.y+r.height,R.y,R.y+R.height),y=v[0],y1=v[1]
    return{x:x,y:y,width:x1-x,height:y1-y}
  }
  function restoreWindow(w,r){ // w: NWJS window, r: rectangle
    var a=gui.Screen.screens // find a screen that overlaps with "r" and fit "w" inside it:
    for(var i=0;i<a.length;i++)if(rectOverlap(a[i].work_area,r)){
      r.maximized||(r=rectFit(r,a[i].work_area));w.moveTo(r.x,r.y);w.resizeTo(r.width,r.height)
      process.nextTick(function(){
        w.dx=w.x-r.x;w.dy=w.y-r.y;w.dw=w.width-r.width;w.dh=w.height-r.height;r.maximized&&w.maximize()
      })
      break
    }
  }

  if(D.mac&&!process.env.DYALOG_IDE_INTERPRETER_EXE){
    process.env.DYALOG_IDE_INTERPRETER_EXE=D.lastSpawnedExe=path.resolve(process.cwd(),'../Dyalog/mapl')
  }
  process.chdir(process.env.PWD||process.env.HOME||'.') // see https://github.com/nwjs/nw.js/issues/648
  D.process=process;gui.Screen.Init();var nww=D.nww=gui.Window.get()

  var urlParams={},a=(location+'').replace(/^[^\?]*($|\?)/,'').split('&')
  for(var i=0;i<a.length;i++){var kv=/^([^=]*)=?(.*)$/.exec(a[i]);urlParams[unescape(kv[1]||'')]=unescape(kv[2]||'')}

  ;(function(){ // restore window state:
    if(D.floating){
      opener.D.floatingWindows.push(nww)
      restoreWindow(nww,{
        x:        +urlParams.x,
        y:        +urlParams.y,
        width:    +urlParams.width,
        height:   +urlParams.height,
        maximized:+urlParams.maximized
      })
    }else{
      D.floatingWindows=[];D.floatOnTop=0
      var aot=function(x){ // aot(x) sets "always on top" for all windows to x
        var w=D.floatingWindows;for(var i=0;i<w.length;i++)if(x!==!!w[i].aot){w[i].aot=x;w[i].setAlwaysOnTop(x)}
      }
      nww.on('focus',function(){aot(!!D.floatOnTop)})
      nww.on('blur',function(){aot(false)})
      if(localStorage.pos){
        try{
          var p=JSON.parse(localStorage.pos)
          restoreWindow(nww,{x:p[0],y:p[1],width:p[2],height:p[3],maximized:p[4]||0})
        }catch(_){}
      }
    }
  }())
  nww.show();nww.focus() // focus() is needed for the Mac

  // To "throttle" a function is to make it execute no more often than once every X milliseconds.
  function throttle(f){var t;return function(){t=t||setTimeout(function(){f();t=0},500)}}

  var saveWindowState=throttle(function(){
    var posArr=[nww.x-(nww.dx||0),nww.y-(nww.dy||0),nww.width-(nww.dw||0),nww.height-(nww.dh||0)]
    nww.maximized&&posArr.push(1)
    var p=!D.floating?'pos':+urlParams.tracer?'posTracer':urlParams.token==='1'?'posEditor':'' // name of pref
    p&&(localStorage[p]=JSON.stringify(posArr))
  })
  nww.on('move',  saveWindowState)
  nww.on('resize',saveWindowState)
  nww.on('maximize',  function(){nww.maximized=1;saveWindowState()})
  nww.on('unmaximize',function(){nww.maximized=0;saveWindowState()})

  nww.on('close',function(){
    if(D.forceClose){
      var fw=opener.D.floatingWindows;fw.splice(fw.indexOf(nww),1)
      process.nextTick(function(){nww.close(true)})
    }else{
      var f=window.onbeforeunload;f&&f()
      D.floating||process.nextTick(function(){process.exit(0)})
    }
  })

  D.forceCloseNWWindow=function(){nww.close(true)} // used to close floating windows after session is dead

  // Context menu
  opener&&(D.ide=opener.D.ide)
  var items=[].concat(
    ['Cut','Copy','Paste'].map(function(x){return{label:x,click:function(){document.execCommand(x)}}}),
    [{type:'separator'}],
    ['Undo','Redo'].map(function(x){return{label:x,click:function(){
      var u=D.ide;u&&(u=u.focusedWin)&&(u=u.cm)&&(u=u[x.toLowerCase()])&&u()
    }}})
  )
  var cmenu=new gui.Menu;for(var i=0;i<items.length;i++)cmenu.append(new gui.MenuItem(items[i]))
  $(document).contextmenu(function(e){cmenu.popup(e.clientX,e.clientY);return false})

  D.readFile=fs.readFile // needed for presentation mode

  D.createSocket=function(){
    function LS(){} // local socket, imitating socket.io's API
    LS.prototype={
      emit:function(){var a=1<=arguments.length?[].slice.call(arguments,0):[];return this.other.onevent({data:a})},
      onevent:function(x){var a=this[x.data[0]]||[];for(var i=0;i<a.length;i++)a[i].apply(null,x.data.slice(1))},
      on:function(e,f){(this[e]=this[e]||[]).push(f);return this}
    }
    var x=new LS,y=new LS;x.other=y;y.other=x;proxy.Proxy()(y);return x
  }

  var execPath=process.execPath;D.mac&&(execPath=execPath.replace(/(\/Contents\/).*$/,'$1MacOS/nwjs'))
  D.rideConnect=function(){spawn(execPath,['--no-spawn'],{detached:true,stdio:['ignore','ignore','ignore']})}
  D.rideNewSession=function(){
    if(D.lastSpawnedExe){
      var env={};for(var k in process.env)env[k]=process.env[k]
      env.DYALOG_IDE_INTERPRETER_EXE=D.lastSpawnedExe
      spawn(execPath,['-s'],{detached:true,stdio:['ignore','ignore','ignore'],env:env})
    }else{
      $.alert('The current session is remote. To connect elsewhere or launch a local interpreter, '+
              'please use "Connect..." instead.','Cannot Start New Session')
    }
  }

  D.quit=function(){gui.Window.get().close()}
  D.clipboardCopy=function(s){gui.Clipboard.get().set(s)}

  // Debugging utilities
  $(document).keydown(function(e){
    if(e.which===123&&!e.altKey&&!e.shiftKey){ // F12
      e.ctrlKey?showProtocolLog():nww.showDevTools().setAlwaysOnTop(1);return false
    }
  })
  function showProtocolLog(){
    var lw=window.lw=open('empty.html')
    function wr(s){
      if(!lw||lw.closed||!lw.document||!lw.document.createTextNode){
        var i=proxy.log.listeners.indexOf(wr);i>=0&&proxy.log.listeners.splice(i,1);lw=null
      }else{
        var b=lw.document.body,atEnd=b.scrollTop==b.scrollHeight-b.clientHeight
        b.appendChild(lw.document.createTextNode(s));atEnd&&(b.scrollTop=b.scrollHeight-b.clientHeight)
      }
    }
    lw.onload=function(){
      lw.document.body.innerHTML='<style>body{font-family:monospace;margin:0;padding:0;white-space:pre;'+
                                             'position:absolute;top:0;bottom:0;left:0;right:0;overflow:scroll}</style>'
      lw.document.title='RIDE Protocol Log';wr(proxy.log.get().join(''));proxy.log.listeners.push(wr)
    }
    return false
  }

  // expandStackString inserts snippets of code next to each file:///filename.js:123:45
  function expandStackString(s){ // s: the string from  new Error().stack
    var C=2 // how many lines of context above and below
    return s.replace(/\(file:\/\/([^\n\r\)]+):(\d+):(\d+)\)/g,function(m,f,l,c){ // m:whole match,f:file,l:line,c:col
      if(f.indexOf('/')>=0||f.indexOf('\\')>=0){
        try{
          l-- // make "l" a 0-based line number
          var lines=fs.readFileSync(f,'utf8').split(/\r?\n/)
          var l0=Math.max(l-C,0),l1=Math.min(l+C,lines.length),fr=lines.slice(l0,l1-1) // fragment to show
          var ok=1;for(var i=0;i<fr.length;i++)if(fr[i].length>200){ok=0;break}
          if(ok){ // if the fragment doesn't contain lines that are too long
            fr=fr.map(function(x){return'            '+x})
            fr[l-l0]='>'+fr[l-l0].slice(1)
            m+='\n'+fr.join('\n')
          }
        }catch(_){}
      }
      return m
    })
  }

  // Error handling
  if(!D.floating){
    var htmlChars={'&':'&amp;','<':'&lt;','>':'&gt;'}
    var htmlEsc=function(s){return s.replace(/./g,function(x){return htmlChars[x]||x})}
    process.on('uncaughtException',function(e){
      window&&(window.lastError=e)
      var info=
        'IDE: '+JSON.stringify(D.versionInfo)+
        '\nInterpreter: '+JSON.stringify(D.remoteIdentification||null)+
        '\nlocalStorage: '+JSON.stringify(localStorage)+
        '\n\n'+expandStackString(e.stack)+
        '\n\nProxy log:'+proxy.log.get().join('')
      var excuses=[
        'Oops... it broke!',
        'Congratulations, you found a ... THE bug.',
        'Users-Developers 1:0',
        'According to our developers this is impossible.',
        'This bug was caused by cosmic radiation randomly flipping bits.',
        'You don\'t find bugs. Bugs find you.'
      ]
      document.write(
        '<html>'+
          '<head><title>Error</title></head>'+
          '<body>'+
            '<h3>'+excuses[Math.floor(excuses.length*Math.random())]+'</h3>'+
            '<h3 style=font-family:apl,monospace>'+
              '<a href="mailto:support@dyalog.com?subject='+escape('RIDE crash')+
                              '&body='+escape('\n\n'+info)+'">support@dyalog.com</a>'+
            '</h3>'+
            '<textarea autofocus style=width:100%;height:90% nowrap>'+htmlEsc(info)+'</textarea>'+
          '</body>'+
        '<html>'
      )
      return false
    })
  }

  D.open=function(url,o){o.icon='D.png';o.toolbar==null&&(o.toolbar=false);!!gui.Window.open(url,o)} // o:options
  D.openExternal=gui.Shell.openExternal

  if(D.mac&&!D.floating){ // todo: clean this up and test on Mac
    var groups,render
    groups={}
    render=function(x){
      var h, i, j, len, mi, name, ref, y;
      if (!x) {
        return;
      }
      if (x[''] === '-') {
        return new gui.MenuItem({
          type: 'separator'
        });
      }
      h = {
        label: x[''].replace(/_/g, ''),
        key: (i = x[''].indexOf('_')) >= 0 ? x[i + 1] : void 0,
        type: x.group || x.checkBoxPref ? 'checkbox' : 'normal'
      };
      if (x.group) {
        h.checked = !!x.checked;
        h.click = function() {
          groups[x.group].forEach(function(sibling) {
            sibling.checked = sibling === mi;
          });
          if (typeof x.action === "function") {
            x.action();
          }
        };
      } else if (x.checkBoxPref) {
        h.checked = !!x.checkBoxPref();
        h.click = function() {
          if (typeof x.action === "function") {
            x.action(mi.checked);
          }
        };
        x.checkBoxPref(function(v) {
          mi.checked = !!v;
        });
      } else {
        h.click = function() {
          if (typeof x.action === "function") {
            x.action();
          }
        };
      }
      if (x.items) {
        h.submenu = new gui.Menu;
        ref = x.items;
        for (j = 0, len = ref.length; j < len; j++) {
          y = ref[j];
          h.submenu.append(render(y));
        }
      }
      mi = new gui.MenuItem(h);
      if (x.group) {
        (groups[name = x.group] != null ? groups[name] : groups[name] = []).push(mi);
      }
      return mi;
    }
    D.installMenu=function(m){
      var ix, iy, j, k, l, len, len1, len2, len3, mb, n, ourMenu, ref, ref1, theirMenu, x, y, ys;
      mb = new gui.Menu({
        type: 'menubar'
      });
      mb.createMacBuiltin('Dyalog');
      mb.items[0].submenu.removeAt(0);
      mb.items[1].submenu.removeAt(7);
      mb.items[1].submenu.removeAt(2);
      mb.items[1].submenu.removeAt(1);
      mb.items[1].submenu.removeAt(0);
      for (ix = j = 0, len = m.length; j < len; ix = ++j) {
        x = m[ix];
        if ((ref = x[''].replace(/_/, '')) === 'Edit' || ref === 'Help') {
          x[''] += ' ';
        }
        ourMenu = render(x);
        if (ix) {
          theirMenu = null;
          ref1 = mb.items;
          for (k = 0, len1 = ref1.length; k < len1; k++) {
            y = ref1[k];
            if (!(y.label === ourMenu.label.replace(/\ $/, ''))) {
              continue;
            }
            theirMenu = y;
            break;
          }
        } else {
          theirMenu = mb.items[0];
        }
        if (theirMenu) {
          if (theirMenu.label === 'Edit') {
            ys = (function() {
              var l, len2, ref2, results;
              ref2 = theirMenu.submenu.items;
              results = [];
              for (iy = l = 0, len2 = ref2.length; l < len2; iy = ++l) {
                y = ref2[iy];
                results.push(y);
              }
              return results;
            })();
            for (l = 0, len2 = ys.length; l < len2; l++) {
              y = ys[l];
              theirMenu.submenu.remove(y);
            }
            for (iy = n = 0, len3 = ys.length; n < len3; iy = ++n) {
              y = ys[iy];
              ourMenu.submenu.insert(y, iy);
            }
          } else {
            ourMenu.submenu.append(new gui.MenuItem({
              type: 'separator'
            }));
            while (theirMenu.submenu.items.length) {
              y = theirMenu.submenu.items[0];
              theirMenu.submenu.remove(y);
              ourMenu.submenu.append(y);
            }
          }
          mb.remove(theirMenu);
        }
        mb.insert(ourMenu, ix);
      }
      nww.menu=mb
    }
  }

  // Hacks to make the window title repaint on Windows. This is a workaround for:
  //   https://github.com/nwjs/nw.js/issues/2895
  //   https://github.com/nwjs/nw.js/issues/2896
  //   https://github.com/nwjs/nw.js/issues/3589
  //   https://github.com/nwjs/nw.js/issues/3658
  if(D.win){
    var repaintTitle=function(){nww.resizeBy(0,1);nww.resizeBy(0,-1)}
    $(window).on('focus blur',repaintTitle)
    D.setTitle=function(s){document.title=s;repaintTitle()}
  }

  // support loading extra js
  if(process.env.DYALOG_IDE_JS){
    var js=process.env.DYALOG_IDE_JS.split(path.delimiter)
    for(var i=0;i<js.length;i++)js[i]&&$.getScript('file://'+path.resolve(process.cwd(),js[i]))
  }
}
