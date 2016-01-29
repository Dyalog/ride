'use strict'
// support for presentations
var lines=[], index=-1, $i // $i:an <input type=file> used to open the file chooser dialog
function move(d){if(0<=index+d&&index+d<lines.length){index+=d;D.ide.wins[0].loadLine(lines[index])}}

// Key display mode:
var $p // DOM element for the pending key or null if key display mode is off
function keyInfo(e){ // returns a pair of the key name and an "is complete" flag
  var s='' // key name
  e.shiftKey&&e.which&&(s+='Shift-');e.ctrlKey&&(s+='Ctrl-');e.altKey&&(s+='Alt-')
  var k=CodeMirror.keyNames[e.which]||'['+e.which+']'
  var c=!!e.which&&k!=='Shift'&&k!=='Ctrl'&&k!=='Alt' // c: is the key combination complete?
  c&&(s+=k);return[s,c]
}
function loadDemoScript(f){ // f:path to file, ignored if empty
  f&&D.readFile(f,'utf8',function(err,s){
    if(err){console.error(err);$.alert('Cannot load demo file');return}
    index=-1
    lines=s.replace(/^[\ufeff\ufffe]/,'').split(/\r?\n/)
           .filter(function(x){return!/^\s*(?:$|⍝⍝)/.test(x)})
           .map(function(x){return'      '+x})
  })
}
D.process&&loadDemoScript(D.process.env.RIDE_DEMO_SCRIPT)
$.extend(CodeMirror.commands,{
  DMN:function(){move( 1)}, // next line
  DMP:function(){move(-1)}, // prev line
  DMR:function(){ // load demo script
    if(D.nwjs&&!D.floating){
      ($i=$i||$('<input id=demo-input type=file style=display:none>').appendTo('body'))
        .trigger('click').change(function(){loadDemoScript(this.value)})
    }
  },
  DMK:function(){ // toggle key display mode
    if($p){$(document).off('.demo');$('#demo-keys').remove();$p=null;return}
    $('body').append($('<div id=demo-keys>').append($p=$('<span>').hide()))
    $(document)
      .on('keydown.demo',function(e){var s=keyInfo(e)[0];$p.text(s).toggle(!!s)})
      .on('keyup.demo',function(e){
        var h=keyInfo(e),s=h[0],c=h[1]
        if(c){$p.hide();var $k=$('<span>').text(s).insertBefore($p);setTimeout(function(){$k.fadeOut(1000)},2000)}
        else{$p.text(s).toggle(!!s)}
      })
  }
})
