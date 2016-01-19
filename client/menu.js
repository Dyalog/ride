'use strict'
var prefs=require('./prefs'),cmds=require('./cmds').cmds

// This is a generic menu for a browser or NW.js
// There's an alternative implementation for NW.js in ../init-nw.js
// For the concrete content in the menu, see ide.coffee
D.installMenu=D.installMenu||function(arg){
  // DOM structure:
  // ┌.menu───────────────────────────────────────────┐
  // │┌div.m-sub────────────────────────────────┐     │
  // ││            ┌div.m-box──────────────────┐│     │
  // ││┌a.m-opener┐│┌a─────┐┌a─────┐┌div.m-sub┐││     │
  // │││┌span┐    │││┌span┐││┌span┐││         │││     │
  // ││││File│    ││││Open││││Save│││   ...   │││ ... │
  // │││└────┘    │││└────┘││└────┘││         │││     │
  // ││└──────────┘│└──────┘└──────┘└─────────┘││     │
  // ││            └───────────────────────────┘│     │
  // │└─────────────────────────────────────────┘     │
  // └────────────────────────────────────────────────┘
  // Top-level ".m-opener"-s also have class ".m-top"
  function render(x){
    if(!x)return
    if(x['']==='-')return $('<hr>')
    var acc // access key
    var name=x[''].replace(/_(.)/g,function(_,k){return acc||k==='_'?k:'<u>'+(acc=k)+'</u>'})
    var $a=$('<a href=#><span>'+name+'</span></a>')
    acc&&$a.attr('accessKey',acc.toLowerCase())
    x.cmd&&$a.append('<span class=m-shortcut data-cmd='+x.cmd+'>')
    if(x.group){
      $a.addClass('m-group-'+x.group)
      $a.toggleClass('m-checked',!!x.checked)
        .on('mousedown mouseup click',function(e){
          $(this).closest('.menu').find('.m-group-'+x.group).removeClass('m-checked')
          $(this).addClass('m-checked');mFocus(null);x.action&&x.action();return!1
        })
    }else if(x.checkBoxPref){
      x.checkBoxPref(function(v){$a.toggleClass('m-checked',!!v)})
      $a.toggleClass('m-checked',!!x.checkBoxPref())
        .on('mousedown mouseup click',function(e){
          mFocus(null);x.action&&x.action($(this).hasClass('m-checked'));return!1
        })
    }else{
      x.action&&$a.on('mousedown mouseup click',function(e){mFocus(null);x.action();return!1})
    }
    if(!x.items)return $a
    var $b=$('<div class=m-box>');
    return $('<div class=m-sub>').append($a.addClass('m-opener'),$b.append.apply($b,x.items.map(render)));
  }

  var $o // original focused element
  function mFocus(anchor){
    $m.find('.m-open').removeClass('m-open')
    if(anchor){
      $o||($o=$(':focus'));var $a=$(anchor);$a.parentsUntil('.menu').addClass('m-open');$a.focus()
    }else{
      if($o){$o.focus();$o=null}
    }
  }
  function leftRight(d,$e){ // d: +1 or -1, $e: target element
    if(d===1&&$e.is('.m-opener')){
      mFocus($e.next('.m-box').find('a').first())
    }else if(d===-1&&!$e.is('.m-opener')&&$e.parents('.m-sub').length>1){
      mFocus($e.closest('.m-sub').find('.m-opener').first())
    }else{
      var $t=$m.children(),i=$e.parentsUntil('.menu').last().index() // Which top-level menu are we under?
      var n=$t.length;mFocus($t.eq((i+d+n)%n).find('a').eq(1))
    }
    return!1
  }
  function upDown(d,$e){ // d: +1 or -1, $e: target element
    if($e.is('.m-top')){
      mFocus($e.parent().find(':not(hr)').eq(1))
    }else{
      var $s=$e.closest('.m-box').children(':not(hr)'),i=$s.index($e),n=$s.length,$f=$s.eq((i+d+n)%n)
      mFocus($f.is('a')?$f:$f.find('a').first())
    }
    return!1
  }
  var $m=$('<div class=menu>').prependTo('body').empty().addClass('menu').append(arg.map(render))
  $m.find('>.m-sub>.m-opener').addClass('m-top')
  $m.on('mouseover','a',function(){$(this).closest('.menu').children().is('.m-open')&&mFocus(this)})
    .on('mousedown','a',function(){mFocus($(this).parentsUntil('.menu').last().is('.m-open')?null:this);return!1})
    .on('click',    'a',function(){return!1})
    .keydown(function(e){
      switch(CodeMirror.keyNames[e.which]){
        case'Left' :leftRight(-1,$(e.target));break
        case'Right':leftRight( 1,$(e.target));break
        case'Up'   :upDown   (-1,$(e.target));break
        case'Down' :upDown   ( 1,$(e.target));break
        case'Esc':case'F10':mFocus(null);return!1
      }
    })
  function isAccessKeyEvent(e){return e.altKey&&!e.ctrlKey&&!e.shiftKey&&65<=e.which&&e.which<=90}
  $(document)
    .on('keyup keypress',function(e){return !isAccessKeyEvent(e)}) // prevent default action for access key events
    .mousedown(function(e){$(e.target).closest('.menu').length||mFocus(null)})
    .keydown(function(e){
      if(isAccessKeyEvent(e)){
        var $x=$m.find('[accessKey='+String.fromCharCode(e.which).toLowerCase()+']:visible')
        if($x.length){$x.mousedown();$x.parent().find('a').eq(1).focus();return!1}
      }
    })
  // todo: is mapping F10 in CodeMirror really necessary?
  //   CodeMirror.keyMap.default.F10 = -> $m.children().eq(0).addClass('m-open').find('a').eq(1).focus(); false
  updateMenuShortCuts(prefs.keys())
}

function updateMenuShortCuts(h){
  var k={};for(var i=0;i<cmds.length;i++){var c=cmds[i][0],d=cmds[i][2];k[c]=(h[c]||d)[0]} // c:code, d:defaults
  $('.m-shortcut').each(function(){$(this).text(k[$(this).data('cmd')]||'')})
}
prefs.keys(updateMenuShortCuts)
