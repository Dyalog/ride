'use strict'
var repr=JSON.stringify
this.showDialog=function(){
  var v=D.versionInfo,ri=D.remoteIdentification||{},u='unknown',db=D.db||localStorage
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
    '\n  Date: '      +(ri.date            ||u)
  var btns=[]
  D.clipboardCopy&&btns.push({html:'<u>C</u>opy',click:function(){D.clipboardCopy($('textarea',this).val(),'text')}})
  btns.push({html:'C<u>l</u>ose',click:function(){$(this).dialog('close')}})
  $(
    '<div class=about>'+
      '<div class=logo>'+
        '<div class=contact-info>'+
          '<span title="Dyalog\'s UK phone number">+44 (0)1256 830030</span><br>'+
          '<a href="mailto:support@dyalog.com?subject=RIDE&body='+escape('\n--\n'+info)+'"'+
          '   title="Populate an email draft with the information below">support@dyalog.com</a><br>'+
          '<a href="http://www.dyalog.com/" target=_blank'+
          '   title="Open Dyalog\'s website in a new window">www.dyalog.com</a>'+
        '</div>'+
      '</div>'+
      '<div class=textarea-wrapper><textarea readonly wrap=off></textarea></div>'+
    '</div>'
  )
    .dialog({title:'About',width:520,height:410,buttons:btns,open:function(){$(this).find('textarea').focus()}})
    .on('click','a[href^=http]',function(){D.openExternal($(this).attr('href'));return!1})
    .find('textarea').val(info).select()
}
