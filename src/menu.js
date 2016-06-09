//two menu implementations -- one native and one in html
'use strict'
D.installMenu=function(x){
  if(D.el){
    var render=function(x){
      if(x['']==='-')return new D.el.MenuItem({type:'separator'})
      var h={label:x[''],click:x.action}
      if(x.group){
        h.type='radio';h.checked=!!x.checked
      }else if(x.checkBoxPref){
        h.type='checkbox';h.checked=!!x.checkBoxPref()
        if(x.action)h.click=function(){x.action(mi.checked)}
        x.checkBoxPref(function(v){mi.checked=!!v})
      }
      if(x.items){h.submenu=new D.el.Menu;x.items.forEach(function(y){h.submenu.append(render(y))})}
      var mi=new D.el.MenuItem(h);return mi
    }
    var m=new D.el.Menu;x.forEach(function(y){m.append(render(y))});D.elw.setMenu(m)
  }else{
    var arg=x
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
      var acc,name=x[''].replace(/_(.)/g,function(_,k){return acc||k==='_'?k:'<u>'+(acc=k)+'</u>'}) // acc:access key
      var $a=$('<a href=#><span>'+name+'</span></a>')
      x.cmd&&$a.append('<span class=m-shc data-cmd='+x.cmd+'>')
      if(x.group){
        $a.addClass('m-group-'+x.group).toggleClass('m-checked',!!x.checked).on('mousedown mouseup click',function(e){
          $(this).closest('.menu').find('.m-group-'+x.group).removeClass('m-checked');$(this).addClass('m-checked')
          mFocus(null);x.action&&x.action();return!1
        })
      }else if(x.checkBoxPref){
        x.checkBoxPref(function(v){$a.toggleClass('m-checked',!!v)})
        $a.toggleClass('m-checked',!!x.checkBoxPref()).on('mousedown mouseup click',function(e){
          mFocus(null);x.action&&x.action($(this).hasClass('m-checked'));return!1
        })
      }else{
        x.action&&$a.on('mousedown mouseup click',function(e){mFocus(null);x.action();return!1})
      }
      if(!x.items)return $a
      var $b=$('<div class=m-box>')
      return $('<div class=m-sub>').append($a.addClass('m-opener'),$b.append.apply($b,x.items.map(render)))
    }
    var $o // original focused element
    function mFocus(anchor){
      $m.find('.m-open').removeClass('m-open');if(!anchor){$o&&$o.focus();$o=null;return}
      $o||($o=$(':focus'));var $a=$(anchor);$a.parentsUntil('.menu').addClass('m-open')
      $a.is('.m-top')?$a.closest('.m-sub').find('a').eq(1).focus():$a.focus()
    }
    function leftRight(d,$e){ // d: +1 or -1, $e: target element
      if(d>0&&$e.is('.m-opener')){
        mFocus($e.next('.m-box').find('a').first())
      }else if(d<0&&!$e.is('.m-opener')&&$e.parents('.m-sub').length>1){
        mFocus($e.closest('.m-sub').find('.m-opener').first())
      }else{
        var $t=$m.children(),n=$t.length,i=$e.parentsUntil('.menu').last().index();mFocus($t.eq((i+d+n)%n).find('a').eq(1))
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
      .on('mousedown click','a',function(e){
        mFocus($(this).parentsUntil('.menu').last().is('.m-open')&&e.type==='mousedown'?null:this);return!1
      })
      .keydown(function(e){
        switch(CodeMirror.keyNames[e.which]){
          case'Left' :leftRight(-1,$(e.target));break
          case'Right':leftRight( 1,$(e.target));break
          case'Up'   :upDown   (-1,$(e.target));break
          case'Down' :upDown   ( 1,$(e.target));break
          case'Esc':case'F10':mFocus(null);return!1
        }
      })
    $(document).mousedown(function(e){$(e.target).closest('.menu').length||mFocus(null)})
    updMenuShcs(D.prf.keys())
    function updMenuShcs(h){
      var k={};for(var i=0;i<D.cmds.length;i++){var c=D.cmds[i][0],d=D.cmds[i][2];k[c]=(h[c]||d)[0]} // c:code, d:defaults
      $('.m-shc').each(function(){$(this).text(k[$(this).data('cmd')]||'')})
    }
    D.prf.keys(updMenuShcs)
  }
}
