;(function(){'use strict'

//autocompletion
var re=RegExp('['+D.syn.letter+']*$')
var ibeams=[ // source: http://help.dyalog.com/15.0/Content/Language/Primitive%20Operators/I%20Beam.htm
  [    8,'Inverted Table Index-of'],
  [   85,'Execute Expression'],
  [  127,'Overwrite Free Pockets'],
  [  180,'Canonical Representation'],
  [  181,'Unsqueezed Type'],
  [  200,'Syntax Colouring'],
  [  219,'Compress/Decompress Vector of Short Integers'],
  [  220,'Serialise/Deserialise Array'],
  [  400,'Compiler Control'],
  [  600,'Trap Control'],
  [  819,'Case Convert'],
  [  900,'Called Monadically'],
  [  950,'Loaded Libraries'],
  [ 1111,'Number of Threads'],
  [ 1112,'Parallel Execution Threshold'],
  [ 1159,'Update Function Time and User Stamp'],
  [ 1500,'Hash Array'],
  [ 2000,'Memory Manager Statistics'],
  [ 2002,'Specify Workspace Available'],
  [ 2010,'Update DataTable'],
  [ 2011,'Read DataTable'],
  [ 2014,'Remove Data Binding'],
  [ 2015,'Create Data Binding Source'],
  [ 2016,'Create .NET Delegate'],
  [ 2017,'Identify .NET Type'],
  [ 2022,'Flush Session Caption'],
  [ 2023,'Close all Windows'],
  [ 2035,'Set Dyalog Pixel Type'],
  [ 2100,'Export to Memory'],
  [ 2101,'Close .NET AppDomain'],
  [ 2400,'Set Workspace Save Options'],
  [ 2401,'Expose Root Properties'],
  [ 2501,'Discard thread on exit'],
  [ 2502,'Discard parked threads'],
  [ 2503,'Mark Thread as Uninterruptible'],
  [ 2520,'Use Separate Thread For .NET'],
  [ 3002,'Disable Component Checksum Validation'],
  [ 3500,'Send Text to RIDE-embedded Browser'],
  [ 3501,'Connected to the RIDE'],
  [ 3502,'Enable RIDE in Run-time Interpreter'],
  [ 4000,'Fork New Task'],
  [ 4001,'Change User'],
  [ 4002,'Reap Forked Tasks'],
  [ 4007,'Signal Counts'],
  [ 7159,'JSON Import'],
  [ 7160,'JSON Export'],
  [ 7161,'JSON TrueFalse'],
  [ 7162,'JSON Translate Name'],
  [16807,'Random Number Generator'],
  [50100,'Line Count']
]
var ibeamOptions=ibeams.map(function(x){return{text:x[0]+'⌶',displayText:x[0]+'⌶ '+x[1]}})
D.ac=function(win){ // win: an instance of Editor or Session
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
                  &&win.promptType!==4){ // don't autocomplete in ⍞ input
          win.autocompleteWithTab=0;win.emit('GetAutocomplete',{line:s,pos:i,token:win.id})
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
                u=cm.getLine(from.line).slice(from.ch,to.ch).toLowerCase(), // completion prefix
                list=u==='⌶'?x.options
                            :x.options.filter(
                                function(s){return typeof s==='string'&&s.slice(0,u.length).toLowerCase()===u}
                             ).sort()
            list.length&&list.unshift('')
            var data={from:from,to:to,list:list};CodeMirror.on(data,'select',function(x){sel=x});return data
          }
        })
      }
    }
  }
}

}())
