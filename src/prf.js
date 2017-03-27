//Preferences API:
//  D.prf.foo()                              // getter
//  D.prf.foo(123)                           // setter
//  D.prf.foo(function(newValue,oldValue){}) // add "on change" listener
//  D.prf.foo.toggle()                       // convenience function for booleans (numbers 0 and 1)
//  D.prf.foo.getDefault()                   // retrieve default value
'use strict'
D.prf={}
;[//name                 default (type is determined from default value; setter enforces type and handles encoding)
  ['autoCloseBlocks',    1], //whether to insert :end after :if,:for,etc when Enter is pressed
  ['autoCloseBlocksEnd', 0], //0: close blocks with ":EndIf",":EndFor",etc;  1: close blocks only with ":End"
  ['autoCloseBrackets',  1], //whether to insert {}[]() in pairs
  ['autocompletion',     1],
  ['blockCursor',        0], // use block cursor selection?
  ['blinkCursor',        1], // cursor blinking
  ['autocompletionDelay',500],
  ['colourScheme',       'Default'], //name of the active colour scheme
  ['colourSchemes',      []],//objects describing user-defined colour schemes
//  ['favs',               [{type:'connect'}]],
  ['floating',           0], //floating editor and tracer windows
  ['floatOnTop',         0], //try to keep floating windows on top of the session
  ['fold',               1], //code folding
  ['ime',                1], //switch to dyalog IME when RIDE starts (Windows-only)
  ['indent',             4], //-1 disables autoindent
  ['indentComments',     0], //whether to touch comment-only lines at all
  ['indentMethods',      -1],//-1 makes methods use the same indent as all other blocks
  ['indentOnOpen',       1], //whether to re-indent source code on editor open
  ['kbdLocale',          ''],//e.g. "US", "GB"
  ['keys',               {}],//a mapping between commands and keystrokes, only diffs from the defaults
  ['lbar',               1], //show language bar
  ['lbarOrder',          D.lb.order],
  ['lineNums',           1],
  ['matchBrackets',      1], //whether to highlight matching brackets
  ['ilf',                1], //when re-formating use ODE style (interpreter level formatting)
  ['otherExe',           ''],//content of the "exe" text box when "Other..." is selected in the Connect page
  ['prefixKey',          '`'],
  ['prefixMaps',         {}],//per-locale strings of pairs of characters - diffs from the default map for that locale
  ['pfkeys',             ['','','','','','','','','','','','','']], //command strings for pfkeys
  ['selectedExe',        ''],//which interpreter is selected in dropdown in the Connect page?
  ['title',              '{WSID}'], //a.k.a. "caption"
  ['valueTips',          1], //value tips
  ['dbg',                0], //show debug panel
  ['sqp',                1], //show quit prompt
  ['squiggleTips',       1],
  ['wrap',               0], //line wrapping in session
  ['wse',                0], //show workspace explorer?
  ['zoom',               0],
  ['menu',
    '# see below for syntax'+
    '\n'+
    '\nDyalog                          {mac}'+
    '\n  About Dyalog             =ABT'+
    '\n  -'+
    '\n  Preferences              =PRF'+
    '\n  -                            '+
    '\n  &Quit                    =QIT'+
    '\n&File                           {!browser}'+
    '\n  New &Session             =NEW'+
    '\n  &Connect...              =CNC'+
    '\n  -                             {!mac}'+
    '\n  &Quit                    =QIT {!mac}'+
    '\n&Edit'+
    '\n  Undo                     =UND {!browser}'+
    '\n  Redo                     =RDO {!browser}'+
    '\n  -                             {!browser}'+
    '\n  Cut                      =CT  {!browser}'+
    '\n  Copy                     =CP  {!browser}'+
    '\n  Paste                    =PT  {!browser}'+
    '\n  Select All               =SA  {mac}'+
    '\n  -                             {!mac&&!browser}'+
    '\n  Preferences              =PRF {!mac}'+
    '\n&View'+
    '\n  Show Language Bar        =LBR'+
    '\n  Show Workspace Explorer  =WSE'+
    '\n  Show Debug               =DBG'+
//  '\n  Floating Edit Windows    =FLT'+
//  '\n  Editors on Top           =TOP {!browser}'+
    '\n  Line Wrapping in Session =WRP'+
    '\n  -                             {!browser}'+
    '\n  Increase Font Size       =ZMI {!browser}'+
    '\n  Decrease Font Size       =ZMO {!browser}'+
    '\n  Reset Font Size          =ZMR {!browser}'+
    '\n  -                             {!browser}'+
    '\n  Toggle Full Screen            {!browser}'+
    '\n&Window'+
    '\n  Close All Windows        =CAW'+
    '\n&Action'+
    '\n  Edit                     =ED'+
    '\n  Trace                    =TC'+
    '\n  Weak Interrupt           =WI'+
    '\n  Strong Interrupt         =SI'+
    '\n&Help'+
    '\n  Dyalog Help              =http://help.dyalog.com/'+
    '\n  Documentation Centre     =http://dyalog.com/documentation.htm'+
    '\n  -'+
    '\n  Dyalog Website           =http://dyalog.com/'+
    '\n  MyDyalog                 =https://my.dyalog.com/'+
    '\n  -'+
    '\n  Dyalog Forum             =http://www.dyalog.com/forum'+
    '\n  -                             {!mac}'+
    '\n  About                    =ABT {!mac}'+
    '\n'+
    '\n# Syntax:'+
    '\n#   &x   access key, alt+x'+
    '\n#   =CMD command code; some are special:'+
    '\n#          LBR FLT WRP TOP WSE render as checkboxes'+
    '\n#   =http://example.com/  open a URL'+
    '\n#   {}   conditional display, a boolean expression'+
    '\n#          operators: && || ! ( )'+
    '\n#          variables: browser mac win'+
    '\n#   -    separator (when alone)'+
    '\n#   #    comment'+
    '\n'+
    '\n# The =PRF ("Preferences") menu item must be present.'
  ]
].forEach(function(kd){
  var k=kd[0], d=kd[1], t=typeof d, l=[], //k:preference name (key), d:default value, t:type, l:listeners
      str=t==='object'?JSON.stringify:function(x){return''+x}, //stringifier function
      sd=str(d),
      p=D.prf[k]=function(x){
        if(typeof x==='function'){l.push(x);return} //add listener
        if(!arguments.length){var r=D.db.getItem(k);return r==null?d:t==='number'?+r:t==='object'?JSON.parse(r):r} //get
        //set:
        x=t==='number'?+x:t==='string'?(''+x):(typeof x==='string'?JSON.parse(x):x) //coerce x to type t
        var sx=str(x);if(sx===sd)sx=''           //convert to a string; if default, use ''
        var sy=D.db.getItem(k)||''               //old value, stringified
        if(sx===sy)return x
        if(l.length)var y=p()                    //old value as an object (only needed if we have any listeners)
        sx?D.db.setItem(k,sx):D.db.removeItem(k) //store
        for(var i=0;i<l.length;i++)l[i](x,y)     //notify listeners
        return x
      }
  p.getDefault=function(){return d}
  p.toggle=function(){return p(!p())}
})

D.db=!node_require?localStorage:(function(){
  var rq=node_require,crypto=rq('crypto'),fs=rq('fs'),el=rq('electron').remote,elw=el.getGlobal('elw')
  //file-backed storage with API similar to that of localStorage
  var k=[],v=[] //keys and values
  // var iv=['wse'] //ignored vars (not saved to file)
  var db={key       :function(x)  {return k[x]},
          getItem   :function(x)  {var i=k.indexOf(x);return i<0?null:v[i]},
          setItem   :function(x,y){var i=k.indexOf(x);if(i<0){k.push(x);v.push(y)}else{v[i]=y};dbWrite()},
          removeItem:function(x)  {var i=k.indexOf(x);if(i>=0){k.splice(i,1);v.splice(i,1);dbWrite()}},
          _getAll   :function()   {var r={};for(var i=0;i<k.length;i++)r[k[i]]=v[i];return r}}
  Object.defineProperty(db,'length',{get:function(){return k.length}})
  var d=el.app.getPath('userData'), f=d+'/prefs.json'
  try{
    if(fs.existsSync(f)){var h=JSON.parse(fs.readFileSync(f,'utf8'));for(var x in h){k.push(x);v.push(h[x])}}
  }catch(e){console.error(e)}
  var dbWrite=function(){
    var s='{\n'+k.map(function(x,i){return'  '+JSON.stringify(x)+':'+JSON.stringify(v[i])}).sort().join(',\n')+'\n}\n'
    fs.writeFileSync(f,s)
  }
  return db
}())

if(D.win&&D.db.getItem('ime')!=='0'){
  var setImeExe=process.execPath.replace(/[^\\\/]+$/,'set-ime.exe')
  var fs=node_require('fs'),spawn=node_require('child_process').spawn
  fs.existsSync(setImeExe)&&spawn(setImeExe,[process.pid],{stdio:['ignore','ignore','ignore']})
}
