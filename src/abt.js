// About dialog
;(function(){

var d,ta //DOM elements for the dialog and the textarea
D.abt=function(){
  if(!d){
    d=I.abt
    I.abt_close.onclick=function(){d.hidden=1}
    I.abt_copy.onclick=function(){
      if (D.el) {
        D.el.clipboard.writeText(ta.value)
      } else {
        ta.select();
        document.execCommand('copy');
        ta.selectionEnd=0;
      }
    }
    I.abt_copy.hidden = !D.el && !document.queryCommandSupported('copy');
    I.abt_contact.onclick=
      function(x){if(x.target.nodeName==='A'&&/^http/.test(x.target.href)){D.openExternal(x.target.href);return!1}}
    ta=I.abt_ta
  }
  D.util.dlg(d,{w:600,h:450})
  var v=D.versionInfo||{},ri=D.remoteIdentification||{},u='unknown',db=D.db||localStorage,repr=JSON.stringify
  var s='';for(var i=0;i<db.length;i++){var x=db.key(i);s+=(i?',\n':'')+'    '+repr(x)+':'+repr(db.getItem(x))}
  ta.value='IDE:'+
    '\n  Version: '   +(v.version          ||u)+
    '\n  Platform: '  +(navigator.platform ||u)+
    '\n  Date: '      +(v.date             ||u)+
    '\n  Git commit: '+(v.rev              ||u)+
    '\n  Preferences:{\n'+s+'\n  }\n'+
    '\nInterpreter:'  +
    '\n  Version: '   +(ri.version         ||u)+
    '\n  Platform: '  +(ri.platform        ||u)+
    '\n  Edition: '   +(ri.arch            ||u)+
    '\n  Date: '      +(ri.date            ||u).replace(/^Created: /,'')+'\n'
  ta.scrollTop=ta.selectionStart=ta.selectionEnd=0;(!I.abt_copy.hidden?I.abt_copy:I.abt_close).focus()
}

}())
