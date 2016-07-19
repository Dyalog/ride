//a kitchen sink for small generic functions and jQuery plugins
'use strict'
var zCtr=100
D.util={
  dict:function(x){var r={};for(var i=0;i<x.length;i++)r[x[i][0]]=x[i][1];return r}, //dictionary from key-value pairs
  ESC:{'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'},
  esc:function(s){return s.replace(/[<>&'"]/g,function(x){return D.util.ESC[x]})},
  cmOnDblClick:function(cm,f){
    //CodeMirror supports 'dblclick' events but they are unreliable and seem to require rather a short time between the
    //two clicks.  So, let's track clicks manually:
    var t=0,x=0,y=0 //last click's timestamp and coordinates
    cm.on('mousedown',function(cm,e){
      e.timeStamp-t<400&&Math.abs(x-e.clientX)+Math.abs(y-e.clientY)<10&&
        !$(e.target).closest('.CodeMirror-gutter-wrapper').length&&f(e)
      t=e.timeStamp;x=e.clientX;y=e.clientY
    })
  },
  dlg:function(d,o){o=o||{}
    d.style.zIndex=zCtr++;d.hidden=0
    d.style.left=(0|(innerWidth -(o.w||d.clientWidth ))/2)+'px';if(o.w)d.style.width =o.w+'px'
    d.style.top =(0|(innerHeight-(o.h||d.clientHeight))/2)+'px';if(o.h)d.style.height=o.h+'px'
    o=null
    if(d.__dlg)return;d.__dlg=1
    d.onmousedown=function(){d.style.zIndex=zCtr++}
    d.onclick=function(e){if(e.target.className==='dlg_close'){d.hidden=1;return!1}}
    d.addEventListener('keydown',
        function(e){if(e.which===27&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&!e.metaKey){d.hidden=1;return!1}})
    var t=d.querySelector('.dlg_title')
    if(t){
      var dx,dy,mx,my //dx,dy:dialog position corrected for mouse; mx,my:maximum coords of dialog in window
      t.onmousedown=function(e){
        if(e.target.closest('.dlg_no_drag'))return
        dx=d.offsetLeft-e.clientX;dy=d.offsetTop-e.clientY;mx=innerWidth-d.clientWidth;my=innerHeight-d.clientHeight
        t.style.cursor='move';document.addEventListener('mousemove',move);e.preventDefault();return!1
      }
      t.onmouseup=function(e){document.removeEventListener('mousemove',move);t.style.cursor=''}
      var move=function(e){d.style.left=Math.min(mx,Math.max(0,dx+e.clientX))+'px'
                           d.style.top =Math.min(my,Math.max(0,dy+e.clientY))+'px'
                           e.preventDefault();return!1}
    }
  },
  elastic:function(inp){ //as you type in an <input>, it stretches as necessary to accommodate the text
    var m=inp.dataset.minSize
    if(!m){var f=function(){D.util.elastic(inp)};CM.on(inp,'keyup',f);CM.on(inp,'keypress',f);CM.on(inp,'change',f)
           inp.dataset.minSize=m=+inp.size||1}
    inp.size=Math.max(m,inp.value.length+1)
  },
  insert:function(x,y){ //replace selection in an <input> or <textarea> x with the string y
    if(!x||(x.nodeName!=='INPUT'&&x.nodeName!=='TEXTAREA')||x.readOnly||x.disabled)return
    var i=x.selectionStart,j=x.selectionEnd,v=x.value
    if(i!=null&&j!=null){x.value=v.slice(0,i)+y+v.slice(j);x.selectionStart=x.selectionEnd=i+y.length}
  }
}
$.alert=function(m,t,f){ //m:message, t:title, f:callback
  D.el?D.el.dialog.showMessageBox(D.elw,{message:m,title:t,buttons:['OK']}):alert(m);f&&f()
}
$.err=function(m,t,f){
  if(typeof t==='function'){f=t;t=''}
  t=t||'Error';D.el?D.el.dialog.showMessageBox(D.elw,{type:'error',message:m,title:t,buttons:['OK']}):alert(m);f&&f()
}
$.confirm=function(m,t,f){
  f(D.el?1-D.el.dialog.showMessageBox(D.elw,{message:m,title:t,type:'question',buttons:['Yes','No'],cancelId:1})
        :+confirm(m))
}
