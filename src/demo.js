//support for presentations
;(function(){'use strict'

var lines=[], index=-1, inp // inp:an <input type=file> used to open the file chooser dialog
function move(d){if(0<=index+d&&index+d<lines.length){index+=d;D.ide.wins[0].loadLine(lines[index])}}

//key display mode:
var $p //dom element for the pending key or null if key display mode is off
function keyInfo(e){ //returns a pair of the key name and an "is complete?" flag
  var s='';e.shiftKey&&e.which&&(s+='Shift-');e.ctrlKey&&(s+='Ctrl-');e.altKey&&(s+='Alt-');e.metaKey&&(s+='Cmd-')
  var k=CM.keyNames[e.which]||'['+e.which+']', c=!!e.which&&k!=='Shift'&&k!=='Ctrl'&&k!=='Alt'&&k!=='Cmd'
  c&&(s+=k);return[s,c] //s:key name,c:is the key combination complete?
}
function loadDemoScript(f){ //f:path to file, ignored if empty
  f&&node_require('fs').readFile(f,'utf8',function(err,s){
    if(err){console.error(err);$.err('Cannot load demo file');return}
    index=-1
    lines=s.replace(/^[\ufeff\ufffe]/,'').split(/\r?\n/)
           .filter(function(x){return!/^\s*(?:$|⍝⍝)/.test(x)})
           .map(function(x){return'      '+x})
  })
}
D.el&&loadDemoScript(process.env.RIDE_DEMO_SCRIPT)
$.extend(D.commands,{
  DMN:function(){move( 1)}, //next line
  DMP:function(){move(-1)}, //prev line
  DMR:function(){ //load demo script
    if(!D.el||D.prf.floating())return
    if(!inp){inp=document.createElement('input');inp.type='file';inp.hidden=1;document.body.appendChild(inp)
             inp.onchange=function(){loadDemoScript(inp.files[0].path)}}
    inp.value='';inp.click()
  },
  DMK:function(){ //toggle key display mode
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

}())
