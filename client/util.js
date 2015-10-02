'use strict'
// a kitchen sink for small generic functions and jQuery plugins
this.inherit=function(x){var F=function(){};F.prototype=x;return new F} // JavaScript's prototypal inheritance
this.cat=function(x){return[].concat.apply([],x)} // array concatenation, like ⊃,/ in APL
this.dict=function(a){var r={};for(var i=0;i<a.length;i++)r[a[i][0]]=a[i][1];return r} // dictionary from key-value pairs
this.zip=function(a,b){var n=Math.min(a.length,b.length),r=[];for(var i=0;i<n;i++)r.push([a[i],b[i]]);return r} // like zip() in Python or ,¨ in APL
this.hex=function(x,n){var s=x.toString(16);if(n)while(s.length<n)s='0'+s;return s.toUpperCase()}
this.spc=function(n){return Array(n+1).join(' ')}

var H={'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}
this.esc=function(s){return s.replace(/[<>&'"]/g,function(x){return H[x]})}

this.onCodeMirrorDoubleClick=function(cm,f){
  // CodeMirror supports 'dblclick' events but they are unreliable and seem to require rather a short time between the two clicks
  // So, let's track clicks manually:
  var t=0,x=0,y=0 // last click's timestamp and coordinates
  cm.on('mousedown',function(cm,e){
    e.timeStamp-t<400&&Math.abs(x-e.x)+Math.abs(y-e.y)<10&&!$(e.target).closest('.CodeMirror-gutter-wrapper').length&&f(e)
    t=e.timeStamp;x=e.x;y=e.y
  })
}
this.throttle1=function(f,dt){ // f: a 1-arg function that doesn't return a result; dt: minimum time between invocations
  var next=0,tid=0 // next: the earliest time f can be called again; tid: id returned by setTimeout
  dt==null&&(dt=500)
  return function(x){
    if(+new Date<next){clearTimeout(tid);tid=setTimeout(function(){tid=0;next=+new Date+dt;f(x)},dt);next=+new Date+dt}
    else{next=+new Date+dt;f(x)}
  }
}
$.alert=function(m,t,f){ // m:message, t:title, f:callback
  $('<p>').text(m).dialog({modal:1,title:t,buttons:[{text:'OK',click:function(){$(this).dialog('close');f&&f()}}]})
}
$.fn.insert=function(s){ // replace selection in an <input> or <textarea> with s
  return this.each(function(){
    if(!this.readOnly){
      var e=this,i=e.selectionStart,j=e.selectionEnd  // TODO: IE
      if(i!=null&&j!=null){e.value=e.value.slice(0,i)+s+e.value.slice(j);e.selectionStart=e.selectionEnd=i+s.length}
    }
  })
}
