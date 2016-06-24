//a kitchen sink for small generic functions and jQuery plugins
'use strict'
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
      t=e.timeStamp;x=e.clientX;y=e.clientY})},
  initDlg:function(d){
    D.util.showDlg(d)
    d.onclick=function(e){if(e.target.className==='dlg_close'){d.hidden=1;return!1}}
    d.addEventListener('keydown',
        function(e){if(e.which===27&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&!e.metaKey){d.hidden=1;return!1}})
    var t=d.querySelector('.dlg_title')
    if(t){
      var dx,dy,mx,my //dx,dy:dialog position corrected for mouse; mx,my:maximum coords of dialog in window
      t.onmousedown=function(e){dx=d.offsetLeft-e.clientX;dy=d.offsetTop-e.clientY
                                mx=innerWidth-d.clientWidth;my=innerHeight-d.clientHeight
                                document.addEventListener('mousemove',move);e.preventDefault();
                                return!1}
      t.onmouseup=function(e){document.removeEventListener('mousemove',move)}
      var move=function(e){d.style.left=Math.min(mx,Math.max(0,dx+e.clientX))+'px'
                           d.style.top =Math.min(my,Math.max(0,dy+e.clientY))+'px'
                           e.preventDefault();return!1}}},
  showDlg:function(d){d.hidden=0
                      d.style.left=(0|(innerWidth -d.clientWidth )/2)+'px'
                      d.style.top =(0|(innerHeight-d.clientHeight)/2)+'px'}}
$.alert=function(m,t,f){ //m:message, t:title, f:callback
  if(D.el){D.el.dialog.showMessageBox(D.elw,{message:m,title:t,buttons:['OK']});f&&f()}
  else{$('<p>').text(m)
         .dialog({modal:1,title:t,buttons:[{html:'<u>O</u>K',click:function(){$(this).dialog('close');f&&f()}}]})}}
$.err=function(m,t,f){
  if(typeof t==='function'){f=t;t=''}
  t=t||'Error'
  if(D.el){D.el.dialog.showMessageBox(D.elw,{type:'error',message:m,title:t,buttons:['OK']});f&&f()}
  else{$('<p>').text(m)
         .dialog({modal:1,title:t,buttons:[{html:'<u>O</u>K',click:function(){$(this).dialog('close');f&&f()}}]})}}
$.confirm=function(m,t,f){
  if(D.el){f(1-D.el.dialog.showMessageBox(D.elw,{message:m,title:t,type:'question',buttons:['Yes','No'],cancelId:1}))}
  else{var r;$('<p>').text(m).dialog({modal:1,title:t,close:function(){f&&f(r)},buttons:[
                                        {html:'<u>Y</u>es',click:function(){r=1;$(this).dialog('close')}},
                                        {html:'<u>N</u>o' ,click:function(){r=0;$(this).dialog('close')}}]})}}
$.fn.insert=function(s){ //replace selection in an <input> or <textarea> with s
  return this.each(function(){
    if(!$(this).is(':text,textarea')||this.readOnly)return
    var e=this,i=e.selectionStart,j=e.selectionEnd  //TODO: IE
    if(i!=null&&j!=null){e.value=e.value.slice(0,i)+s+e.value.slice(j);e.selectionStart=e.selectionEnd=i+s.length}})}
$.fn.elastic=function(){ //as you type in an <input>, it stretches as necessary to accommodate the text
  return this.each(function(){
    var m=$(this).data('minSize')
    m||$(this).data('minSize',m=+this.size||1).on('keyup keypress change',function(){$(this).elastic()})
    this.size=Math.max(m,this.value.length+1)})}
