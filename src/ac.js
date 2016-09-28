;(function(){'use strict'

//autocompletion
var re=RegExp('['+D.syn.letter+']*$')
var ibeamOptions=[];for(var x in D.ibeams)ibeamOptions.push({text:x+'⌶',displayText:x+'⌶ '+D.ibeams[x]})

D.ac=function(win){ //win:editor or session instance to set up autocompletion in
  var tid,cm=win.cm,r
  cm.on('change',function(){
    var mode=cm.getOption('mode');if(typeof mode==='object'&&mode!=null&&mode.name)mode=mode.name
    if(D.prf.autocompletion()&&(mode==='apl'||mode==='apl-session')&&cm.getCursor().line){
      clearTimeout(tid)
      tid=setTimeout(function(){
        tid=0;var c=cm.getCursor(),s=cm.getLine(c.line),i=c.ch
        if(s[i-1]==='⌶'&&!/\d *$/.test(s.slice(0,i-1))){
          r({skip:1,options:D.el&&+process.env.RIDE_IBEAM?ibeamOptions:[]})
        }else if(i&&(win.autocompleteWithTab||RegExp('['+D.syn.letter+'\\)\\]\\.]$').test(s.slice(0,i)))
                  &&s.slice(0,i).replace(re,'').slice(-1)!==D.prf.prefixKey()
                  &&win.promptType!==4){ //don't autocomplete in ⍞ input
          win.autocompleteWithTab=0;D.send('GetAutocomplete',{line:s,pos:i,token:win.id})
        }
      },D.prf.autocompletionDelay())
    }
  })
  return r=function(x){
    if(D.prf.autocompletion()&&x.options.length&&cm.hasFocus()&&cm.getWrapperElement().ownerDocument.hasFocus()){
      var c=cm.getCursor(),from={line:c.line,ch:c.ch-x.skip},sel=''
      if(x.options.length===1&&win.autocompleteWithTab){
        var v=x.options[0];cm.replaceRange(typeof v==='string'?v:v.text,from,c,'D')
      }else{
        cm.showHint({
          completeOnSingleClick:true,completeSingle:false,
          extraKeys:{
            Enter:function(cm,m){sel?m.pick():cm.execCommand('ER')},
            Right:function(cm,m){sel||m.moveFocus(1);m.pick()},
            'Shift-Tab':function(cm,m){m.moveFocus(-1)},
            Tab:function(cm,m){m.moveFocus(1);x.options.length===1&&m.pick()},
            F1:function(){sel&&sel.text&&D.hlp[sel.text]&&D.openExternal(D.hlp[sel.text])}
          },
          hint:function(){
            var to=cm.getCursor(),
                u=cm.getLine(from.line).slice(from.ch,to.ch).toLowerCase(), //completion prefix
                list=u==='⌶'?x.options
                            :x.options.filter(
                                function(s){return typeof s==='string'&&s.slice(0,u.length).toLowerCase()===u}
                             ).sort()
            list.length&&list.unshift('')
            var data={from:from,to:to,list:list};CM.on(data,'select',function(x){sel=x});return data
          }
        })
      }
    }
  }
}

}())
