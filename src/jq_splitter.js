$.fn.splitter=function(args){'strict mode' //based on http://methvin.com/splitter (which is dual-licensed MIT,GPL)
  args=args||{}
  var A='active' //css class
  var h=+(args.type==='h') //horizontal?
  var TL=h?'Top':'Left',BR=h?'Bottom':'Right',tl=h?'top':'left',wh=h?'width':'height',hw=h?'height':'width'
  var pyx=h?'pageY':'pageX',mhw='min-'+hw,Mhw='max-'+hw,vhsb=h?'vsplitbar':'hsplitbar',rsz='en'[h]+'-resize'
  var owh=h?'offsetWidth':'offsetHeight',ohw=h?'offsetHeight':'offsetWidth'
  return this.each(function(){
    function startSplit(e){$p.css('-webkit-user-select','none');$m.addClass(A);$a._posSplit=$a[0][ohw]-e[pyx]
                           $(document).bind('mousemove',doSplit).bind('mouseup',endSplit)}
    function doSplit(e){resplit($a._posSplit+e[pyx])}
    function endSplit(e){$m.removeClass(A);$p.css('-webkit-user-select','text')
                         $(document).unbind('mousemove',doSplit).unbind('mouseup',endSplit)}
    function resplit(p){
      p=Math.max($a._min,$s._DA-$b._max,Math.min(p,$a._max,$s._DA-$m._DA-$b._min)) //fit pane size limits
      //resize/position the two panes:
      $m._DA=$m[0][ohw]
      $m.css(tl,p).css(wh,$s._DF)
      $a.css(tl,0).css(hw,p).css(wh,$s._DF)
      $b.css(tl,p+$m._DA).css(hw,$s._DA-$m._DA-p).css(wh,$s._DF)
      $p.resize()
    }
    function dimSum(jq,dims){var r=0;for(var i=0;i<dims.length;i++)r+=Math.max(0,+jq.css(dims[i])||0);return r}
    var $s=$(this),$p=$('>*',$s).css({position:'absolute',zIndex:1,'-moz-outline-style':'none'}) //$s:splitter,$p:panes
    var $a=$p.eq(0),$b=$p.eq(1) //$a:left/top,$b:right/bottom
    var $f=$('<a href=javascript:void(0)></a>') //focuser element, provides keyboard support
      .attr({tabIndex:0})
      .focus(function(){this.focus();$m.addClass(A)})
      .keydown(function(e){var k=e.which,d=(k===h?40:39)-(k===h?38:37);d&&resplit($a[0][ohw]+8*d)})
      .blur(function(){$m.removeClass(A)})
    //splitbar element, can be already in the doc or we create one
    var $m=$($p[2]||'<div>').insertAfter($a).append($f).addClass(vhsb).attr({unselectable:'on'})
      .bind('mousedown',startSplit).css({zIndex:100,cursor:rsz,position:'absolute','user-select':'none'})
    //cache several dimensions for speed, rather than re-querying constantly
    $m._DA=$m[0][ohw];$s._PBF=$s._PBA=0;$a._pane=TL;$b._pane=BR
    $.each([$a,$b],function(){this._min=dimSum(this,[mhw]);this._max=dimSum(this,[Mhw])||9999})
    var p0=$a[hw]() //initial position
    if(isNaN(p0))p0=Math.round(($s[0][ohw]-$s._PBA-$m._DA)/2) //Solomon's algorithm
    $s.resize(function(e,size){
      if(e.target!=this)return
      $s._DF=$s[0][owh]-$s._PBF;$s._DA=$s[0][ohw]-$s._PBA //determine new width/height of splitter container
      if($s._DF<=0||$s._DA<=0)return //bail if splitter isn't visible or content isn't there yet
      resplit(!isNaN(size)?size:$a[0][ohw]) //re-divvy the adjustable dimension; maintain size of the preferred pane
    }).trigger('resize',[p0])
    $(window).resize(function(e){e.target===window&&$s.resize()})
  })
}
