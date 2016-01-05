// original: http://methvin.com/splitter/
$.fn.splitter=function(args){
  'use strict';args=args||{};var browser={}
  return this.each(function(){
    var $zombie // left-behind splitbar for outline resizes
    function startSplitMouse(e){
      if(o.outline)$zombie=$zombie||$bar.clone(false).insertAfter($a)
      $panes.css('-webkit-user-select','none') // Safari selects $a/$b text on a move
      $bar.addClass(o.activeClass)
      $a._posSplit=$a[0][o.pxSplit]-e[o.eventPos]
      $(document).bind('mousemove',doSplitMouse).bind('mouseup',endSplitMouse)
    }
    function doSplitMouse(e){
      var newPos=$a._posSplit+e[o.eventPos]
      if(o.outline){newPos=Math.max(0,Math.min(newPos,$e._DA-$bar._DA));$bar.css(o.origin,newPos)}
      else{resplit(newPos)}
    }
    function endSplitMouse(e){
      $bar.removeClass(o.activeClass)
      var newPos=$a._posSplit+e[o.eventPos]
      if(o.outline){$zombie.remove();$zombie=null;resplit(newPos)}
      $panes.css('-webkit-user-select','text') // let Safari select text again
      $(document).unbind('mousemove',doSplitMouse).unbind('mouseup',endSplitMouse)
    }
    function resplit(newPos){
      newPos=Math.max($a._min,$e._DA-$b._max,Math.min(newPos,$a._max,$e._DA-$bar._DA-$b._min)) // fit splitbar in pane
      $bar._DA=$bar[0][o.pxSplit] // bar size may change during dock
      $bar.css(o.origin,newPos).css(o.fixed,$e._DF)
      $a.css(o.origin,0).css(o.split,newPos).css(o.fixed,$e._DF)
      $b.css(o.origin,newPos+$bar._DA).css(o.split,$e._DA-$bar._DA-newPos).css(o.fixed,$e._DF)
      browser.msie||$panes.trigger('resize')
    }
    function dimSum($x,dims){ // Opera returns -1 for missing min/max width, turn into 0
      var s=0;for(var i=1;i<arguments.length;i++)s+=Math.max(parseInt($x.css(arguments[i]))||0,0);return s
    }

    var o=$.extend(
      {activeClass:'active',pxPerKey:8,tabIndex:0,accessKey:''},
      !args.type||args.type==='v'
        ?{
          keyLeft:39,keyRight:37,cursor:'e-resize',splitbarClass:'vsplitbar',outlineClass:'voutline',
          type:'v',eventPos:'pageX',origin:'left',
          split:'width',pxSplit:'offsetWidth',side1:'Left',side2:'Right',
          fixed:'height',pxFixed:'offsetHeight',side3:'Top',side4:'Bottom'
        }
        :{
          keyTop:40,keyBottom:38,cursor:'n-resize',splitbarClass:'hsplitbar',outlineClass:'houtline',
          type:'h',eventPos:'pageY',origin:'top',
          split:'height',pxSplit:'offsetHeight',side1:'Top',side2:'Bottom',
          fixed:'width',pxFixed:'offsetWidth',side3:'Left',side4:'Right'
        },
      args
    )
    var $e=$(this).css({position:'relative'})
    var $panes=$('>*',$e).css({position:'absolute',zIndex:1,'-moz-outline-style':'none'})
    var $a=$panes.eq(0),$b=$panes.eq(1) // $a:left or top, $b:right or bottom
    var $focuser=$('<a href=javascript:void(0)></a>') // focuser
      .attr({accessKey:o.accessKey,tabIndex:o.tabIndex,title:o.splitbarClass})
      .bind(browser.opera?'click':'focus',function(){this.focus();$bar.addClass(o.activeClass)})
      .keydown(function(e){
        var key=e.which||e.keyCode,dir=key==o['key'+o.side1]?1:key==o['key'+o.side2]?-1:0
        dir&&resplit($a[0][o.pxSplit]+dir*o.pxPerKey,false)
      })
      .blur(function(){$bar.removeClass(o.activeClass)})
    var $bar=$($panes[2]||'<div>')
      .insertAfter($a).css('zIndex',100).append($focuser).attr({'class':o.splitbarClass,unselectable:'on'})
      .css({position:'absolute','user-select':'none',
            '-webkit-user-select':'none','-khtml-user-select':'none','-moz-user-select':'none'})
      .mousedown(startSplitMouse)
    // Use our cursor unless the style specifies a non-default cursor
    ;/^(auto|default|)$/.test($bar.css('cursor'))&&$bar.css('cursor',o.cursor)

    // Cache several dimensions for speed, rather than re-querying constantly
    $bar._DA=$bar[0][o.pxSplit]
    $e._PBF=$.boxModel?dimSum($e,'border'+o.side3+'Width','border'+o.side4+'Width'):0
    $e._PBA=$.boxModel?dimSum($e,'border'+o.side1+'Width','border'+o.side2+'Width'):0
    $a._pane=o.side1
    $b._pane=o.side2
    ;[$a,$b].forEach(function($x){
      $x._min=o['min'+$x._pane]||dimSum($x,'min-'+o.split)
      $x._max=o['max'+$x._pane]||dimSum($x,'max-'+o.split)||Infinity
      $x._init=o['size'+$x._pane]===true?parseInt($.curCSS($x[0],o.split)):o['size'+$x._pane]
    })

    var initPos=$a._init
    if(!isNaN($b._init))initPos=$e[0][o.pxSplit]-$e._PBA-$b._init-$bar._DA // recalc initial $b size as an offset from the top or left side
    if(isNaN(initPos))initPos=Math.round(($e[0][o.pxSplit]-$e._PBA-$bar._DA)/2)

    if(o.anchorToWindow){
      $e._hadjust=dimSum($e,'borderTopWidth','borderBottomWidth','marginBottom')
      $e._hmin=Math.max(dimSum($e,'minHeight'),20)
      $(window).resize(function(){
        var top=$e.offset().top
        $e.css('height',Math.max($(window).height()-top-$e._hadjust,$e._hmin)+'px')
        if(!browser.msie)$e.trigger('resize')
      }).resize()
    }else if(o.resizeToWidth&&!browser.msie){
      $(window).resize(function(){$e.trigger('resize')})
    }
    $e.bind('resize',function(e,size){
      if(e.target!=this)return // Custom events bubble in jQuery 1.3; don't get into a Yo Dawg
      $e._DF=$e[0][o.pxFixed]-$e._PBF;$e._DA=$e[0][o.pxSplit]-$e._PBA // new width/height of splitter container
      if($e._DF<=0||$e._DA<=0)return // Bail if splitter isn't visible or content isn't there yet
      // Re-divvy the adjustable dimension; maintain size of the preferred pane
      resplit(!isNaN(size)?size:(!(o.sizeRight||o.sizeBottom)?$a[0][o.pxSplit]:$e._DA-$b[0][o.pxSplit]-$bar._DA))
    }).trigger('resize',[initPos])
  })
}
