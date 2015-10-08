'use strict'
var prefs=require('./prefs'),letter=require('./cm-apl-mode').letter
var re=RegExp('['+letter+']*$')
var ibeams=[
  {text:    '8⌶',displayText:    '8⌶ Inverted Table Index-of'},
  {text:   '85⌶',displayText:   '85⌶ Execute Expression'},
  {text:  '127⌶',displayText:  '127⌶ Overwrite Free Pockets'},
  {text:  '181⌶',displayText:  '181⌶ Unsqueezed Type'},
  {text:  '200⌶',displayText:  '200⌶ Syntax Colouring'},
  {text:  '219⌶',displayText:  '219⌶ Compress/Decompress Vector of Short Integers'},
  {text:  '220⌶',displayText:  '220⌶ Serialise/Deserialise Array'},
  {text:  '900⌶',displayText:  '900⌶ Called Monadically'},
  {text:  '950⌶',displayText:  '950⌶ Loaded Libraries'},
  {text: '1111⌶',displayText: '1111⌶ Number of Threads'},
  {text: '1112⌶',displayText: '1112⌶ Parallel Execution Threshold'},
  {text: '1159⌶',displayText: '1159⌶ Update Function Time and User Stamp'},
  {text: '2000⌶',displayText: '2000⌶ Memory Manager Statistics'},
  {text: '2002⌶',displayText: '2002⌶ Specify Workspace Available'},
  {text: '2010⌶',displayText: '2010⌶ Update DataTable'},
  {text: '2011⌶',displayText: '2011⌶ Read DataTable'},
  {text: '2015⌶',displayText: '2015⌶ Create Data Source'},
  {text: '2022⌶',displayText: '2022⌶ Flush Session Caption'},
  {text: '2023⌶',displayText: '2023⌶ Close all Windows'},
  {text: '2035⌶',displayText: '2035⌶ Set Dyalog Pixel Type'},
  {text: '2100⌶',displayText: '2100⌶ Export to Memory'},
  {text: '2101⌶',displayText: '2101⌶ Close .NET AppDomain'},
  {text: '2400⌶',displayText: '2400⌶ Set Workspace Save Options'},
  {text: '2401⌶',displayText: '2401⌶ Expose Root Properties'},
  {text: '2503⌶',displayText: '2503⌶ Mark Thread as Uninterruptible'},
  {text: '2520⌶',displayText: '2520⌶ Use Separate Thread For .NET'},
  {text: '3002⌶',displayText: '3002⌶ Disable Component Checksum Validation'},
  {text: '3500⌶',displayText: '3500⌶ Send Text to RIDE-embedded Browser'},
  {text: '3501⌶',displayText: '3501⌶ Connected to the RIDE'},
  {text: '3502⌶',displayText: '3502⌶ Enable RIDE in Run-time Interpreter'},
  {text: '4000⌶',displayText: '4000⌶ Fork New Task'},
  {text: '4001⌶',displayText: '4001⌶ Change User'},
  {text: '4002⌶',displayText: '4002⌶ Reap Forked Tasks'},
  {text: '4007⌶',displayText: '4007⌶ Signal Counts'},
  {text: '7159⌶',displayText: '7159⌶ JSON Import'},
  {text: '7160⌶',displayText: '7160⌶ JSON Export'},
  {text: '7161⌶',displayText: '7161⌶ JSON TrueFalse'},
  {text: '7162⌶',displayText: '7162⌶ JSON Translate Name'},
  {text:'16807⌶',displayText:'16807⌶ Random Number Generator'},
  {text:'50100⌶',displayText:'50100⌶ Line Count'}
]
this.setUp=function(win){ // win: an instance of Editor or Session
  var tid,cm=win.cm,r
  cm.on('change',function(){
    var mode=(cm.getOption('mode')||{}).name
    if(prefs.autocompletion()&&(mode==='apl'||mode==='apl-session')&&cm.getCursor().line){
      clearTimeout(tid)
      tid=setTimeout(function(){
        tid=null;var c=cm.getCursor(),s=cm.getLine(c.line),i=c.ch
        if(s[i-1]==='⌶'&&!/\d *$/.test(s.slice(0,i-1))){
          r(1,ibeams)
        }else if(i&&s[i-1]!==' '&&s.slice(0,i).replace(re,'').slice(-1)!==prefs.prefixKey()&&
                  win.promptType!==4){ // don't autocomplete in ⍞ input
          win.autocompleteWithTab=0;win.emit('GetAutoComplete',{line:s,pos:i,token:win.id})
        }
      },prefs.autocompletionDelay())
    }
  })
  return r=function(skip,options){
    console.info('options',options)
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
                list=u==='⌶'?options
                            :options.filter(
                                function(x){return typeof x==='string'&&x.slice(0,u.length).toLowerCase()===u}
                             ).sort()
            list.length&&list.unshift('')
            var data={from:from,to:to,list:list};CodeMirror.on(data,'select',function(x){sel=x});return data
          }
        })
      }
    }
  }
}
