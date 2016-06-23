//About dialog
D.abt=function(){
  var v=D.versionInfo,ri=D.remoteIdentification||{},u='unknown',db=D.db||localStorage,repr=JSON.stringify
  var s='';for(var i=0;i<db.length;i++){var x=db.key(i);s+=(i?',\n':'')+'    '+repr(x)+':'+repr(db.getItem(x))}
  var info='IDE:'+
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
  var abt=document.getElementById('abt')
  var ta =document.getElementById('abt_ta')
  var btns=[{html:'C<u>l</u>ose',click:function(){$(abt).dialog('close')}}]
  D.el&&btns.unshift({html:'<u>C</u>opy',click:function(){D.el.clipboard.writeText(ta.value)}})
  $(abt).dialog({title:'About',width:520,height:410,buttons:btns,open:function(){ta.focus()}})
  abt.onclick=function(x){if(x.target.nodeName==='A'&&/^http/.test(x.target.href)){D.openExternal(x.target.href);return!1}}
  ta.value=info;ta.select()
}
