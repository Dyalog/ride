// Preferences API -- localStorage should be accessed only through it
//   Only ../init-nw.coffee bypasses this API because it can't require() it.
// Usage:
//   prefs.foo()                 // getter
//   prefs.foo(123)              // setter
//   prefs.foo (newValue) -> ... // add "on change" listener
//   prefs.foo.toggle()          // convenience function for booleans (numbers 0 and 1)
//   prefs.foo.getDefault()      // retrieve default value
D.prefs=this;
[ // name             default (type is determined from default value; setter enforces type and handles encoding)
  ['autoCloseBrackets',  1],  // whether to insert {}[]() in pairs
  ['autoCloseBlocks',    1],  // whether to insert :end after :if,:for,etc when Enter is pressed
  ['autoCloseBlocksEnd', 0],  // 0: close blocks with ":EndIf",":EndFor",etc;  1: close blocks only with ":End"
  ['autocompletion',     1],
  ['autocompletionDelay',500],
  ['colourScheme',       'Default'], // name of the active colour scheme
  ['colourSchemes',      []], // objects describing user-defined colour schemes
  ['favs',               [{host:'127.0.0.1',port:4502}]],
  ['floating',           0],  // floating editor and tracer windows
  ['floatOnTop',         0],  // try to keep floating windows on top of the session
  ['fold',               1],  // code folding
  ['ime',                1],
  ['indent',             4],  // -1 disables autoindent
  ['indentComments',     0],  // whether to touch comment-only lines at all
  ['indentMethods',      -1], // -1 makes methods use the same indent as all other blocks
  ['indentOnOpen',       1],  // whether to re-indent source code on editor open
  ['keys',               {}], // a mapping between commands and keystrokes, only diffs from the defaults
  ['kbdLocale',          ''], // e.g. "US", "GB"
  ['lineNumsTracer',     0],
  ['lineNumsEditor',     1],
  ['matchBrackets',      1],  // whether to highlight matching brackets
  ['pos',                null], // [x,y,w,h,maximized] of the main window, used in ../init-nw.coffee; maximized is optional
  ['posEditor',          [32,32,1000,618]], // [x,y,w,h,maximized]
  ['posTracer',          [32,32,1000,618]], // [x,y,w,h,maximized]
  ['prefixKey',          '`'],
  ['prefixMaps',         {}], // per-locale strings of pairs of characters -- diffs from the default ` map for that locale
  ['selectedExe',        ''], // Which interpreter is selected in the Connect page?
  ['otherExe',           ''], // What is filled in in the text box when "Other..." is selected in the Connect page?
  ['editorWidth',        0], // width of a docked editor
  ['tracerHeight',       0], // height of a docked tracer
  ['wrap',               0], // line wrapping in session
  ['lbar',               1], // show language bar
  ['theme',              ''],
  ['title',              '{WSID}'], // a.k.a. "caption"
  ['zoom',               0],
  ['menu',
    '# see below for syntax'+
    '\n'+
    '\nDyalog                          {mac}'+
    '\n  About Dyalog             =ABT'+
    '\n  -'+
    '\n  Preferences              =PRF'+
    '\n_File                           {!browser}'+
    '\n  New _Session             =NEW'+
    '\n  _Connect...              =CNC'+
    '\n  -                             {!mac}'+
    '\n  _Quit                    =QIT {!mac}'+
    '\n_Edit'+
    '\n  Cut                      =CT  {!mac&&!browser}'+
    '\n  Copy                     =CP  {!mac&&!browser}'+
    '\n  Paste                    =PT  {!mac&&!browser}'+
    '\n  Undo                     =UND {!browser}'+
    '\n  Redo                     =RDO {!browser}'+
    '\n  -                             {!mac&&!browser}'+
    '\n  Preferences              =PRF {!mac}'+
    '\n  Select All               =SA  {mac}'+
    '\n_View'+
    '\n  Show Language Bar        =LBR'+
    '\n  Float New Editors        =FLT'+
    '\n  Editors on Top           =TOP {!browser}'+
    '\n  Line Wrapping in Session =WRP'+
    '\n  -                             {!browser}'+
    '\n  Increase Font Size       =ZMI {!browser}'+
    '\n  Decrease Font Size       =ZMO {!browser}'+
    '\n  Reset Font Size          =ZMR {!browser}'+
    '\n  -'+
    '\n  Theme                    =THM'+
    '\n_Actions'+
    '\n  Weak Interrupt           =WI'+
    '\n  Strong Interrupt         =SI'+
    '\n_Window                         {mac}'+
    '\n_Help'+
    '\n  About                    =ABT {!mac}'+
    '\n  -                             {!mac}'+
    '\n  Dyalog Help              =http://help.dyalog.com/'+
    '\n  Documentation Centre     =http://dyalog.com/documentation.htm'+
    '\n  -'+
    '\n  Dyalog Website           =http://dyalog.com/'+
    '\n  MyDyalog                 =https://my.dyalog.com/'+
    '\n  -'+
    '\n  Dyalog Forum             =http://www.dyalog.com/forum'+
    '\n'+
    '\n# Syntax:'+
    '\n#   _x   access key, alt+x'+
    '\n#   =CMD command code; some are special:'+
    '\n#          LBR FLT WRP TOP render as checkboxes'+
    '\n#          THM ("Theme") renders its own submenu'+
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
  var k=kd[0],    // preference name (key)
      d=kd[1],    // default value
      t=typeof d, // type
      l=[],       // listeners
      str=t==='object'?JSON.stringify:function(x){return''+x}, // stringifier function
      sd=str(d),  // default value "d" converted to a string
      p=D.prefs[k]=function(x){
        if(typeof x==='function'){
          l.push(x)
        }else if(arguments.length){
          x=t==='number'?(+x):t==='string'?(''+x):x // coerce "x" to type "t"
          var sx=str(x) // sx: "x" converted to a string; localStorage values can only be strings
          if(l.length)old=p()
          sx===sd?delete localStorage[k]:(localStorage[k]=sx) // avoid recording if it's at its default
          for(var i=0;i<l.length;i++)l[i](x,old) // notify listeners
          return x
        }else{
          var r=localStorage[k];return r==null?d:t==='number'?(+r):t==='object'?JSON.parse(r):r
        }
      }
  p.getDefault=function(){return d}
  p.toggle=function(){return p(!p())}
})
