// This module implements the Preferences dialog.
// The actual content of tabs is in separate modules: prefs-*.js
// Each of them can export the following properties:
//   name       a string used as the tab's title
//   init()     called only once, when Preferences is opened for the first time
//   load()     called every time Preferences is opened
//   validate() should return a {message,element} object on failure
//   save()     called when Save is pressed
//   resize()   called when the Preferences dialog is resized or the tab is selected
// All tabs' validate() methods are invoked, if they exist, before any attempt to call save()
var tabs=[
  require('./prefs-layout'   ),
  require('./prefs-shortcuts'),
  require('./prefs-code'     ),
  require('./prefs-colours'  ),
  require('./prefs-title'    ),
  require('./prefs-menu'     )
]
function safe(s){return s.toLowerCase().replace(/[^a-z\-]/g,'-')} // make a string suitable for a DOM id
var $d // dialog instance, lazily initialized
function ok(){apply()&&$d.dialog('close')}
function apply(){ // returns 0 on failure and 1 on success
  var v
  for(var i=0;i<tabs.length;i++)if(v=tabs[i].validate&&tabs[i].validate()){
    setTimeout(function(){$.alert(v.message,'Error',v.element?function(){v.element.focus()}:null)},1)
    return 0
  }
  for(var i=0;i<tabs.length;i++)tabs[i].save&&tabs[i].save()
  return 1
}
this.showDialog=function(tabName){
  if(!$d){
    $d=$(
      '<div id=prefs>'+
        '<ul id=prefs-tabs-nav>'+
          tabs.map(function(t){return'<li><a href=#prefs-tab-'+safe(t.name)+'>'+t.name+'</a></li>'}).join('')+
        '</ul>'+
        tabs.map(function(t){return'<div id=prefs-tab-'+safe(t.name)+'></div>'}).join('')+
      '</div>'
    )
      .tabs({activate:function(e,ui){var t=tabs[$(ui.newTab).index()];t.resize&&t.resize()}})
      .keydown(function(e){if(e.which===13&&!e.shiftKey&&e.ctrlKey&&!e.altKey){ok();return false}})
      .on('dragstart',function(){return false})
      .dialog({
        autoOpen:0,title:'Preferences',width:600,minWidth:600,height:450,minHeight:450,
        resize:function(){for(var i=0;i<tabs.length;i++)tabs[i].resize&&tabs[i].resize()},
        buttons:[
          {text:'OK',    click:function(){ok();return false}},
          {text:'Apply', click:function(){apply();return false}},
          {text:'Cancel',click:function(){$d.dialog('close')}}
        ]
      })
    for(var i=0;i<tabs.length;i++)tabs[i].init&&tabs[i].init($('#prefs-tab-'+safe(tabs[i].name)))
  }
  $d.dialog('option','position',{at:'center'}).dialog('open')
  tabName&&$d.tabs({active:$("#prefs-tabs-nav a[href='#prefs-tab-#{tabName}']").parent().index()})
  for(var i=0;i<tabs.length;i++)tabs[i].load&&tabs[i].load()
}
