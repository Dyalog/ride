'use strict'
var prefs=require('./prefs'),letter=require('./cm-apl-mode').letter
var re=RegExp('['+letter+']*$')
this.setUp=function(win){ // win: an instance of Editor or Session
  var tid,cm=win.cm
  cm.on('change',function(){
    var mode=cm.getOption('mode')
    if(prefs.autocompletion()&&(mode==='apl'||mode=='aplsession')&&cm.getCursor().line){
      clearTimeout(tid)
      tid=setTimeout(function(){
        tid=null;var c=cm.getCursor(),s=cm.getLine(c.line),i=c.ch
        if(i&&s[i-1]!==' '&&s.slice(0,i).replace(re,'').slice(-1)!==prefs.prefixKey()&&
                  win.promptType!==4){ // don't autocomplete in ⍞ input
          win.autocompleteWithTab=0;win.emit('GetAutoComplete',{line:s,pos:i,token:win.id})
        }
      },prefs.autocompletionDelay())
    }
  })
  return function(skip,options){
    if(prefs.autocompletion()&&options.length&&cm.hasFocus()&&cm.getWrapperElement().ownerDocument.hasFocus()){
      var c=cm.getCursor(),from={line:c.line,ch:c.ch-skip},sel=''
      if(options.length===1&&win.autocompleteWithTab){
        cm.replaceRange(options[0],from,c,'D')
      }else{
        cm.showHint({
          completeOnSingleClick:true,completeSingle:false,
          extraKeys:{
            Enter:function(cm,m){sel?m.pick():cm.execCommand('ER')},
            Right:function(cm,m){sel||m.moveFocus(1);m.pick()},
            'Shift-Tab':function(cm,m){m.moveFocus(-1)},
            Tab:function(cm,m){m.moveFocus(1);options.length===1&&m.pick()}
          },
          hint:function(){
            var to=cm.getCursor(),
                u=cm.getLine(from.line).slice(from.ch,to.ch).toLowerCase(), // completion prefix
                list=options.filter(function(o){return o.slice(0,u.length).toLowerCase()===u}).sort()
            list.length&&list.unshift('')
            var data={from:from,to:to,list:list};CodeMirror.on(data,'select',function(x){sel=x});return data
          }
        })
      }
    }
  }
}
