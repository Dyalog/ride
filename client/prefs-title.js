var prefs=require('./prefs')
var $wt
this.name='Title'
this.init=function($e){
  $e.html(
    '<a href=# class=reset>Reset</a>'+
    'Window title: <input class=text-field>'+
    '<pre>'+
    '\n<a href=#>{WSID}</a>            workspace name'+
    '\n<a href=#>{HOST}</a>:<a href=#>{PORT}</a>     interpreter\'s TCP endpoint'+
    '\n<a href=#>{PID}</a>             PID of the interpreter process'+
    '\n<a href=#>{CHARS}</a>           Unicode or Classic'+
    '\n<a href=#>{BITS}</a>            64 or 32'+
    '\n<a href=#>{VER}</a>             interpreter version'+
    '\n  <a href=#>{VER_A}</a>           major'+
    '\n  <a href=#>{VER_B}</a>           minor'+
    '\n  <a href=#>{VER_C}</a>           svn revision'+
    '\n<a href=#>{RIDE_VER}</a>        RIDE version'+
    '\n  <a href=#>{RIDE_VER_A}</a>      major'+
    '\n  <a href=#>{RIDE_VER_B}</a>      minor'+
    '\n  <a href=#>{RIDE_VER_C}</a>      git commit number'+
    '</pre>'
  )
  $e.on('click','pre a',function(e){$wt.insert($(e.target).text())})
  $('pre a',$e).attr('title','Insert');$wt=$('input',$e)
  $('.reset',$e).button().click(function(){$wt.val(prefs.title.getDefault());return false})
}
this.load=function(){$wt.val(prefs.title())}
this.save=function(){prefs.title($wt.val())}
