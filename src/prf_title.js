//Preferences > Title
;(function(){'use strict'

var wt //<input> element for Window Title
D.prf_tabs.title={
  name:'Title',
  init:function(t){
    wt=I.title_inp
    var subs=I.title_subs
    subs.onclick=function(x){x.target.nodeName==='A'&&D.util.insert(wt,x.target.textContent);wt.focus()}
    var a=subs.querySelectorAll('a');for(var i=0;i<a.length;i++){a[i].href='#';a[i].title='Click to insert'}
    I.title_rst.onclick=function(){wt.value=D.prf.title.getDefault();wt.focus();return!1}
  },
  activate:function(){wt.focus()},
  load:function(){wt.value=D.prf.title()},
  save:function(){D.prf.title(wt.value)}
}

}())
