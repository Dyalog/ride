$.fn.splitter=function(args){ // methvin.com/splitter
  args=args||{}
  return this.each(function(){
    function startSplit(e){
      $p.css('-webkit-user-select','none');$m.addClass(o.activeClass);$a._posSplit=$a[0][o.pxSplit]-e[o.eventPos]
      $(document).bind('mousemove',doSplit).bind('mouseup',endSplit)
    }
    function doSplit(e){resplit($a._posSplit+e[o.eventPos])}
    function endSplit(e){
      $m.removeClass(o.activeClass);$p.css('-webkit-user-select','text')
      $(document).unbind('mousemove',doSplit).unbind('mouseup',endSplit)
    }
    function resplit(p){
      // Constrain new splitbar position to fit pane size limits
      p=Math.max($a._min,$s._DA-$b._max,Math.min(p,$a._max,$s._DA-$m._DA-$b._min))
      // Resize/position the two panes
      $m._DA=$m[0][o.pxSplit] // $m size may change during dock
      $m.css(o.origin,p).css(o.fixed,$s._DF)
      $a.css(o.origin,0).css(o.split,p).css(o.fixed,$s._DF)
      $b.css(o.origin,p+$m._DA).css(o.split,$s._DA-$m._DA-p).css(o.fixed,$s._DF)
      $p.resize()
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
    var $m=$($p[2]||'<div>').insertAfter($a).append($f).addClass('hv'[vh]+'splitbar').attr({unselectable:'on'})
      .css({zIndex:100,cursor:'en'[vh]+'-resize',position:'absolute','user-select':'none',
            '-webkit-user-select':'none','-khtml-user-select':'none','-moz-user-select':'none'})
      .bind('mousedown',startSplit)
    // Cache several dimensions for speed, rather than re-querying constantly
    $m._DA=$m[0][o.pxSplit]
    $s._PBF=$.boxModel?dimSum($s,['border'+o.side3+'Width','border'+o.side4+'Width']):0
    $s._PBA=$.boxModel?dimSum($s,['border'+o.side1+'Width','border'+o.side2+'Width']):0
    $a._pane=o.side1
    $b._pane=o.side2
    $.each([$a,$b],function(){
      this._min=o['min'+this._pane]||dimSum(this,['min-'+o.split])
      this._max=o['max'+this._pane]||dimSum(this,['max-'+o.split])||9999
    })
    var p0=vh?$a.height:$a.width() // initial position
    if(isNaN(p0))p0=Math.round(($s[0][o.pxSplit]-$s._PBA-$m._DA)/2) // Solomon's algorithm
    $s.resize(function(e,size){
      if(e.target!=this)return
      $s._DF=$s[0][o.pxFixed]-$s._PBF;$s._DA=$s[0][o.pxSplit]-$s._PBA // Determine new width/height of splitter container
      if($s._DF<=0||$s._DA<=0)return // Bail if splitter isn't visible or content isn't there yet
      // Re-divvy the adjustable dimension; maintain size of the preferred pane
      resplit(!isNaN(size)?size:$a[0][o.pxSplit])
    }).trigger('resize',[p0])
    $(window).resize(function(e){e.target===window&&$s.resize()})
  })
}
