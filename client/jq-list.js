// generic jQuery list with accessible selectable items
;(function($){'use strict'
  var L='list'                   // css class
  var S='list-selection'         // css class
  var F='list-focus'             // css class
  var E='list-selection-changed' // event name
  var methods={
    init:function(){
      return(this.addClass(L)
        .on('click','>*:not(.ui-sortable-helper)',function(e){
          var $a=$(this),$l=$a.parent()
          e.ctrlKey?$a.toggleClass(S):$l.list('select',$a.index(),e.ctrlKey,e.shiftKey)
          $l.trigger(E)
          return!1
        })
        .on('focus','*',function(){$(this).parentsUntil('.'+L).andSelf().eq(0).   addClass(F)})
        .on('blur' ,'*',function(){$(this).parentsUntil('.'+L).andSelf().eq(0).removeClass(F)})
        .keydown(function(e){
          if(e.altKey||e.modKey)return
          var $l=$(this)
          switch(e.which){
            /*C-a */case 65:if(e.ctrlKey){$l.children().addClass(S).eq(0).focus();$l.trigger(E);return!1};break
            /*spc */case 32:$l.children('.list-focus').toggleClass(S);$l.trigger(E);return!1
            /*up  */case 38:case 63232:$l.list('select',$l.children('.list-focus').index()-1,e.ctrlKey,e.shiftKey);return!1
            /*down*/case 40:case 63233:$l.list('select',$l.children('.list-focus').index()+1,e.ctrlKey,e.shiftKey);return!1
            /*home*/case 36:case 63273:$l.list('select',0                                   ,e.ctrlKey,e.shiftKey);return!1
            /*end */case 35:case 63275:$l.list('select',$l.children().length-1              ,e.ctrlKey,e.shiftKey);return!1
          }
        })
      )
    },
    select:function(i,ctrl,shift){
      return this.each(function(){
        var $l=$(this),$a=$l.children(),n=$a.length
        i=i<0?0:i>=n?n-1:i
        if(!ctrl){$a.removeClass(S).eq(i).addClass(S)}
        if(shift){var an=$l.data('list-anchor')||0,m=i<an?i:an,M=i+an-m;$a.removeClass(S).slice(m,M+1).addClass(S)}
        else{$l.data('list-anchor',i)}
        var $f=$a.eq(i),q='a,:input';($f.is(q)?$f:$f.find(q).eq(0)).focus() // q:query for focusable elements
        $(this).trigger(E)
      })
    }
  }
  $.fn.list=function(x){
    if(typeof x!=='string')return methods.init.apply(this,arguments)
    if(methods[x])return methods[x].apply(this,[].slice.call(arguments,1))
    console.error('Method '+x+' does not exist on jQuery.list')
  }
}(jQuery));
