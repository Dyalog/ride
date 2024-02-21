//generic jQuery list with accessible selectable items
;(function($){'use strict'
  var L='list',S='list_sel',F='list_focus' //css classes
  var ES='list-selection-changed',EO='list-order-changed' //event names
  function pg($l){var $c=$('>',$l);return~~($l.height()/($c.eq(1).position().top-$c.position().top))} //page size
  function idx($l){return $('>.'+F,$l).index()} //index of focused item
  var methods={
    init:function(){
      return(this.addClass(L)
        .on('click','>:not(.ui-sortable-helper)',function(e){
          if(e.altKey||e.metaKey)return
          var $a=$(this),$l=$a.parent()
          e.ctrlKey&&!e.shiftKey ? $a.toggleClass(S) : $l.list('select',$a.index(),e.ctrlKey,e.shiftKey)
          $l.trigger(ES);return!1
        })
        .on('focus','*',function(){$(this).parentsUntil('.'+L).addBack().eq(0).   addClass(F)})
        .on('blur' ,'*',function(){$(this).parentsUntil('.'+L).addBack().eq(0).removeClass(F)})
        .keydown(function(e){
          var $l=$(this),ck=e.ctrlKey,sk=e.shiftKey,ak=e.altKey;if(e.metaKey)return
          if(!ak){
            switch(e.which){
              /*C-a */case 65:if(ck){$l.children().addClass(S).eq(0).focus();$l.trigger(ES);return!1};break
              /*up  */case 38:case 63232:$l.list('select',idx($l)-1         ,ck,sk);return!1
              /*down*/case 40:case 63233:$l.list('select',idx($l)+1         ,ck,sk);return!1
              /*home*/case 36:case 63273:$l.list('select',0                 ,ck,sk);return!1
              /*end */case 35:case 63275:$l.list('select',$('>',$l).length-1,ck,sk);return!1
              /*pgup*/case 33:case 63276:$l.list('select',idx($l)-pg($l)    ,ck,sk);return!1
              /*pgdn*/case 34:case 63277:$l.list('select',idx($l)+pg($l)    ,ck,sk);return!1
            }
          }else if(!ck&&!sk){
            switch(e.which){
              /*A-up*/case 38:case 63232:$l.list('move',-1);return!1
              /*A-dn*/case 40:case 63233:$l.list('move', 1);return!1
            }
          }
        })
      )
    },
    select:function(i,ctrl,shift){
      return this.each(function(){
        var $l=$(this),$a=$l.children(),n=$a.length
        i=i<0?0:i>=n?n-1:i // todo: this is modifying "i" in the outer scope, may cause trouble for $('#l1,#l2').list('select',...)
        if(!ctrl){$a.removeClass(S).eq(i).addClass(S)}
        if(shift){var an=$l.data('list-anchor')||0,m=i<an?i:an,M=i+an-m;$a.slice(m,M+1).addClass(S)}
        else{$l.data('list-anchor',i)}
        var $f=$a.eq(i),q='a,:input';($f.is(q)?$f:$f.find(q).eq(0)).focus() // q:query for focusable elements
        $l.trigger(ES)
      })
    },
    move:function(d){d=Math.sign(d)||1
      return this.each(function(){
        var $l=$(this),$s=$l.find('>.'+S); if($s.length!==1)return // todo: support multiple selection
        d<0?$s.prev().before($s):$s.next().after($s)
        var q='a,:input';($s.is(q)?$s:$s.find(q).eq(0)).focus() // q:query for focusable elements
        $l.trigger(EO)
      })
    }
  }
  $.fn.list=function(x){
    if(typeof x!=='string')return methods.init.apply(this,arguments)
    if(methods[x])return methods[x].apply(this,[].slice.call(arguments,1))
    console.error('Method '+x+' does not exist on jQuery.list')
  }
}(jQuery))
