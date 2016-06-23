//About dialog
;(function(){

var d,ta //DOM elements for the dialog and the textarea
D.abt=function(){
  if(!d){
    d=document.getElementById('abt');D.util.initDlg(d)
    document.getElementById('abt_close').onclick=function(){d.hidden=1}
    document.getElementById('abt_copy').onclick=function(){D.el.clipboard.writeText(ta.value)}
    document.getElementById('abt_contact').onclick=
      function(x){if(x.target.nodeName==='A'&&/^http/.test(x.target.href)){D.openExternal(x.target.href);return!1}}
    ta=document.getElementById('abt_ta')
  }
  d.hidden=0
  var v=D.versionInfo,ri=D.remoteIdentification||{},u='unknown',db=D.db||localStorage,repr=JSON.stringify
  var s='';for(var i=0;i<db.length;i++){var x=db.key(i);s+=(i?',\n':'')+'    '+repr(x)+':'+repr(db.getItem(x))}
  ta.value='IDE:'+
    '\n  Version: '   +(v.version          ||u)+
    '\n  Platform: '  +(navigator.platform ||u)+
    '\n  Date: '      +(v.date             ||u)+
    '\n  Git commit: '+(v.rev              ||u)+
    '\n  User agent: '+(navigator.userAgent||u)+
    '\n  Settings:{\n'+s+'\n  }\n'+
    '\nInterpreter:'  +
    '\n  Version: '   +(ri.version         ||u)+
    '\n  Platform: '  +(ri.platform        ||u)+
    '\n  Edition: '   +(ri.arch            ||u)+
    '\n  Date: '      +(ri.date            ||u)+'\n'
  ta.focus();ta.select()
}

}())
