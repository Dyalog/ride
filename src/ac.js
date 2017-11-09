;(function(){'use strict'

//autocompletion
var rLetters=RegExp('['+D.syn.letter+']*$'), rCompletable=RegExp('['+D.syn.letter+'⎕\\)\\]\\.]$')
var ibeamOptions=[];for(var x in D.ibeams)ibeamOptions.push({text:x+'⌶',displayText:x+'⌶ '+D.ibeams[x]})

D.ac=function(win){ //win:editor or session instance to set up autocompletion in
  var tid, cm=win.cm, r //tid:timeout id, r:the result from D.ac(win) - a completer function
  cm.on('change',function(){
    var m=cm.getOption('mode');if(typeof m==='object'&&m!=null&&m.name)m=m.name
    if(!D.prf.autocompletion()||(m!=='apl'&&m!=='apl-session')||!cm.getCursor().line)return
    clearTimeout(tid)
    tid=setTimeout(function(){
      tid=0;var c=cm.getCursor(),s=cm.getLine(c.line),i=c.ch
      if(s[i-1]==='⌶'&&!/\d *$/.test(s.slice(0,i-1))){r({skip:1,options:D.el&&+process.env.RIDE_IBEAM?ibeamOptions:[]})
                                                      return}
      if(i&&(win.autocompleteWithTab||rCompletable.test(s.slice(0,i)))
          &&s.slice(0,i).replace(rLetters,'').slice(-1)!==D.prf.prefixKey()
          &&win.promptType!==4){ //don't autocomplete in ⍞ input (promptType=4)
        win.autocompleteWithTab=0;D.send('GetAutocomplete',{line:s,pos:i,token:win.id})
      }
    },D.prf.autocompletionDelay())
  })
  return r=function(x){
    if(!D.prf.autocompletion()||!cm.hasFocus()||
       !cm.getWrapperElement().ownerDocument.hasFocus()||
       !win.autocompleteWithTab&&!x.options.length)return
    var c=cm.getCursor(),from={line:c.line,ch:c.ch-x.skip},
        sel='' //sel keeps track of selection in the completion list, so F1 knows what help page to open
    if(win.autocompleteWithTab){
      if(x.options.length===0){cm.execCommand('insertSoftTab');return}
      if(x.options.length===1){
        var v=x.options[0]
        cm.replaceRange(typeof v==='string'?v:v.text,from,c,'D');return
      }
    }
    //There's an invisible (height=0) but selectable item at the front of the completion list.
    //Enter and Right both can complete the visible items, however they treat the invisible item differently.
    //Right completes with the first visible item instead of the invisible one; Enter does <ER>.
    //This is to reconcile habits of old users (Right) with expectations of new users (Enter).
    cm.showHint({
      completeOnSingleClick:1,completeSingle:0,
      extraKeys:{Enter:      function(cm,m){sel?m.pick():cm.execCommand('ER')},
                 Right:      function(cm,m){sel||m.moveFocus(1);m.pick()},
                 'Shift-Tab':function(cm,m){m.moveFocus(-1)},
                 Tab:        function(cm,m){m.moveFocus(1);x.options.length===1&&m.pick()},
                 F1:         function(){sel&&sel.text&&D.hlp[sel.text]&&D.openExternal(D.hlp[sel.text])}},
      hint:function(){
        var to=cm.getCursor(),
            p=cm.getLine(from.line).slice(from.ch,to.ch).toLowerCase(), //completion prefix
            o=x.options,
            l=p==='⌶'?o:o.filter(function(s){return typeof s==='string'&&s.slice(0,p.length).toLowerCase()===p}).sort()
        l.length&&l.unshift('');var d={from:from,to:to,list:l};CM.on(d,'select',function(x){sel=x});return d //d:data
      }
    })
  }
}

}())
