// support for presentations
var lines=[],index=-1
var $i // $i:an <input type=file> used to open the file chooser dialog
function move(d){if(0<=index+d&&index+d<lines.length){index+=d;D.ide.wins[0].loadLine(lines[index])}}

// Key display mode:
var $p // DOM element for the pending key or null if key display mode is off
function keyInfo(e){ // returns a pair of the key name and an "is complete" flag
  var s='' // key name
  e.shiftKey&&e.which&&(s+='Shift-');e.ctrlKey&&(s+='Ctrl-');e.altKey&&(s+='Alt-')
  k=CodeMirror.keyNames[e.which]||'['+e.which+']'
  c=!!e.which&&k!=='Shift'&&k!=='Ctrl'&&k!=='Alt' // c: is the key combination complete?
  c&&(s+=k);return[s,c]
}
function keyDownHandler(e){$p.text(s=keyInfo(e)[0]).toggle(!!s)}
function keyUpHandler(e){
  var h=keyInfo(e),s=h[0],c=h[1]
  if(c){$p.hide();$k=$('<span>').text(s).insertBefore($p);setTimeout(function(){$k.fadeOut(1000)},2000)}
  else{$p.text(s).toggle(!!s)}
}
$.extend(CodeMirror.commands,{
  DMN:function(){move( 1)}, // next line
  DMP:function(){move(-1)}, // prev line
  DMR:function(){ // run demo script
    if(D.nwjs&&!D.floating){
      ($i=$i||$('<input id=demo-input type=file style=display:none>').appendTo('body'))
        .trigger('click').change(function(){
          if(this.value){
            D.readFile(this.value,'utf8',function(err,s){
              if(err){console&&console.error&&console.error(err);$.alert('Cannot load demo file')}
              else{lines=s.replace(/^[\ufeff\ufffe]/,'').split(/\r?\n/);index=-1}
            })
          }
        })
    }
  },
  DMK:function(){ // toggle key display mode
    if(!$p){
      $('body').append($('<div id=demo-keys>').append($p=$('<span>').hide()))
      $(document).on('keyup.demo',keyUpHandler).on('keydown.demo',keyDownHandler)
    }else{
      $(document).off('.demo');$('#demo-keys').remove();$p=null
    }
  }
})
