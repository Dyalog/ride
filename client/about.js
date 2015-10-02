'use strict'
this.showDialog=function(){
  var v=D.versionInfo,i=D.remoteIdentification||{},u='unknown'
  var info='IDE:'+
    '\n  Version: '   +(v.version          ||u)+
    '\n  Platform: '  +(navigator.platform ||u)+
    '\n  Date: '      +(v.date             ||u)+
    '\n  Git commit: '+(v.rev              ||u)+
    '\n  User agent: '+(navigator.userAgent||u)+
    '\n  Settings: '  +(JSON.stringify(localStorage))+
    '\n'              +
    '\nInterpreter:'  +
    '\n  Version: '   +(i.version          ||u)+
    '\n  Platform: '  +(i.platform         ||u)+
    '\n  Edition: '   +(i.arch             ||u)+
    '\n  Date: '      +(i.date             ||u)
  var btns=[]
  D.clipboardCopy&&btns.push({text:'Copy',click:function(){D.clipboardCopy($('textarea',this).val(),'text')}})
  btns.push({text:'Close',click:function(){$(this).dialog('close')}})
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
    .on('click','a[href^=http]',function(){D.openExternal($(this).attr('href'));return false})
    .find('textarea').val(info).select()
}
