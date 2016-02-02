$.fn.splitter=function(args){ // methvin.com/splitter
  args=args||{}
  return this.each(function(){
    var $z // $z:zombie, left-behind splitbar for outline resizes
    function startSplitMouse(e){
      if(o.outline)$z=$z||$m.clone(false).insertAfter($a)
      $p.css('-webkit-user-select','none');$m.addClass(o.activeClass);$a._posSplit=$a[0][o.pxSplit]-e[o.eventPos]
      $(document).bind('mousemove',doSplitMouse).bind('mouseup',endSplitMouse)
    }
    function doSplitMouse(e){
      var p=$a._posSplit+e[o.eventPos]
      if(o.outline){p=Math.max(0,Math.min(p,$s._DA-$m._DA));$m.css(o.origin,p)}else{resplit(p)}
    }
    function endSplitMouse(e){
      $m.removeClass(o.activeClass);var p=$a._posSplit+e[o.eventPos]
      if(o.outline){$z.remove();$z=null;resplit(p)}
      $p.css('-webkit-user-select','text')
      $(document).unbind('mousemove',doSplitMouse).unbind('mouseup',endSplitMouse)
    }
    function resplit(p){
      // Constrain new splitbar position to fit pane size limits
      p=Math.max($a._min,$s._DA-$b._max,Math.min(p,$a._max,$s._DA-$m._DA-$b._min))
      // Resize/position the two panes
      $m._DA=$m[0][o.pxSplit] // $m size may change during dock
      $m.css(o.origin,p).css(o.fixed,$s._DF)
      $a.css(o.origin,0).css(o.split,p).css(o.fixed,$s._DF)
      $b.css(o.origin,p+$m._DA).css(o.split,$s._DA-$m._DA-p).css(o.fixed,$s._DF)
      $p.trigger('resize')
    }
    function dimSum(jq,dims){var r=0;for(var i=0;i<dims.length;i++)r+=Math.max(0,+jq.css(dims[i])||0);return r}
    // Determine settings based on incoming o, element classes, and defaults
    var vh=+(args.type==='h')
    var o=$.extend({activeClass:'active'},
      vh?{
        eventPos:'pageY',origin:'top',
        split:'height',pxSplit:'offsetHeight',side1:'Top' ,side2:'Bottom',
        fixed:'width' ,pxFixed:'offsetWidth' ,side3:'Left',side4:'Right'
      }:{
        eventPos:'pageX',origin:'left',
        split:'width' ,pxSplit:'offsetWidth' ,side1:'Left',side2:'Right',
        fixed:'height',pxFixed:'offsetHeight',side3:'Top' ,side4:'Bottom'
      },
      args
    )
    var $s=$(this),$p=$('>*',$s).css({position:'absolute',zIndex:1,'-moz-outline-style':'none'}) // $s:splitter,$p:panes
    var $a=$p.eq(0),$b=$p.eq(1) // $a:left/top,$b:right/bottom
    var $f=$('<a href=javascript:void(0)></a>') // focuser element, provides keyboard support
      .attr({tabIndex:0})
      .focus(function(){this.focus();$m.addClass(o.activeClass)})
      .keydown(function(e){
        var k=e.which,d=(k===o[vh?40:39])-(k===o[vh?38:37]);d&&resplit($a[0][o.pxSplit]+8*d)
      })
      .blur(function(){$m.removeClass(o.activeClass)})
    // Splitbar element, can be already in the doc or we create one
    var $m=$($p[2]||'<div>')
      .insertAfter($a).css('zIndex',100).append($f)
      .attr({'class':'hv'[vh]+'splitbar',unselectable:'on'})
      .css({position:'absolute','user-select':'none',
            '-webkit-user-select':'none','-khtml-user-select':'none','-moz-user-select':'none'})
      .bind('mousedown',startSplitMouse)
    $m.css('cursor',vh?'n-resize':'e-resize')
    // Cache several dimensions for speed, rather than re-querying constantly
    $m._DA=$m[0][o.pxSplit]
    $s._PBF=$.boxModel?dimSum($s,['border'+o.side3+'Width','border'+o.side4+'Width']):0
    $s._PBA=$.boxModel?dimSum($s,['border'+o.side1+'Width','border'+o.side2+'Width']):0
    $a._pane=o.side1
    $b._pane=o.side2
    $.each([$a,$b],function(){
      this._min=o['min'+this._pane]||dimSum(this,['min-'+o.split])
      this._max=o['max'+this._pane]||dimSum(this,['max-'+o.split])||9999
      this._init=o['size'+this._pane]===true?parseInt($.curCSS(this[0],o.split)):o['size'+this._pane]
    })
    // Determine initial position, get from cookie if specified
    var p0=$a._init
    if(!isNaN($b._init))p0=$s[0][o.pxSplit]-$s._PBA-$b._init-$m._DA // initial $b size as offset from top or left
    if(isNaN(p0))p0=Math.round(($s[0][o.pxSplit]-$s._PBA-$m._DA)/2) // Solomon's algorithm
    $s.bind('resize',function(e,size){
      if(e.target!=this)return
      // Determine new width/height of splitter container
      $s._DF=$s[0][o.pxFixed]-$s._PBF
      $s._DA=$s[0][o.pxSplit]-$s._PBA
      // Bail if splitter isn't visible or content isn't there yet
      if($s._DF<=0||$s._DA<=0)return
      // Re-divvy the adjustable dimension; maintain size of the preferred pane
      resplit(!isNaN(size)?size:(!(o.sizeRight||o.sizeBottom)?$a[0][o.pxSplit]:$s._DA-$b[0][o.pxSplit]-$m._DA))
    }).trigger('resize',[p0])
    $(window).bind('resize',function(e){e.target===window&&$s.trigger('resize')})
  })
}
