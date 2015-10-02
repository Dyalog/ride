'use strict'
var prefs=require('./prefs')
var layouts=D.kbds.layouts

this.name='Layout'

var $pfx,$lc // DOM elements for "Prefix" and "Locale"
var NK=58    // number of scancodes we are concerned with
var model={} // dictionary: locale→[arrayOfAPLGlyphs,arrayOfShiftedAPLGlyphs]

function U(c){return'U+'+('000'+c.charCodeAt(0).toString(16).toUpperCase()).slice(-4)} // fmt Unicode char as "U+0123"

this.init=function($e){
  var sk={15:'←',16:'↹',30:'Caps',43:'↲',44:'⇧',57:'⇧'} // special keys
  $e.html(
    '<label id=layout-pfx-label>Prefix: <input id=layout-pfx class=text-field size=1></label>'+
    '<a href=# id=layout-reset>Reset</a>'+
    '<table id=layout-legend class=key'+
          ' title="Prefix followed by shift+key produces the character in red.\n'+
                  'Prefix followed by an unshifted key produces the character in blue.">'+
      '<tr><td class=g2>⇧x</td><td class=g3><span class=pfx2>`</span>&nbsp;⇧x</td></tr>'+
      '<tr><td class=g0>x</td><td class=g1><span class=pfx2>`</span>&nbsp;x</td></tr>'+
    '</table>'+
    '<label id=layout-lc-label>Locale:'+
    '  <select id=layout-lc>'+
        ((function(){var r=[];for(var lc in layouts)r.push('<option>'+lc);return r})()).sort().join('')+
    '  </select>'+
    '</label>'+
    '<div id=layout-kbd>'+
      (function(){
        var s='';for(var i=1;i<NK;i++)s+=
          '<span id=k'+i+' class=key>'+
            (sk[i]||'<span class=g2></span><input class=g3><br><span class=g0></span><input class=g1>')+
          '</span>'
        return s
      }())+
    '</div>'
  )
    .on('focus','.key input',function(){var e=this;setTimeout(function(){$(e).select()},1)})
    .on('blur','.key input',function(){
      var i=+$(this).hasClass('g3'),
          j=+$(this).closest('.key').prop('id').slice(1),
          v=model[$lc.val()][i][j]=$(this).val().slice(-1)||' '
      $(this).val(v).prop('title',U(v))
    })
    .on('mouseover mouseout','.key input',function(e){$(this).toggleClass('hover',e.type==='mouseover')})
  D.win&&$e.append(
    '<label id=layout-ime-wrapper><input type=checkbox id=layout-ime>Select Dyalog IME as the active keyboard</label>'
  )
  if(!prefs.kbdLocale()){
    var l=navigator.language||'',xx=l.slice(0,2).toUpperCase()
    prefs.kbdLocale(l==='en-GB'?'UK':
                    l==='da'||l==='da_DK'?(D.mac?'DK-Mac':'DK'):
                    geom[xx]?xx:'US')
  }
  $('#layout-reset').button().click(function(){
    var lc=$lc.val()
    $pfx.val(prefs.prefixKey.getDefault()).change()
    model[lc]=[layouts[lc][2].split(''),layouts[lc][3].split('')]
    updateGlyphs()
    return false
  })
  $lc=$('#layout-lc').change(updateGlyphs)
  $pfx=$('#layout-pfx')
    .on('change keyup',function(){$('#layout-legend .pfx2').text($(this).val().slice(-1))})
    .focus(function(){setTimeout(((function(_this){return function(){$(_this).select()}})(this)),1)})
}
this.load=function(){
  $lc.val(prefs.kbdLocale());$pfx.val(prefs.prefixKey()).change();model={}
  for(var lc in layouts){var l=layouts[lc];model[lc]=[l[2].split(''),l[3].split('')]}
  var pm=prefs.prefixMaps()
  for(var lc in pm){
    var v=pm[lc]
    for(var i=0;i<v.length;i+=2)for(var j=0;j<2;j++){
      var ix=layouts[lc][j].indexOf(v[i]);ix>=0&&(model[lc][j][ix]=v[i+1])
    }
  }
  updateGlyphs()
  D.win&&$('#layout-ime').prop('checked',!!prefs.ime())
}

// Every geometry (aka "mechanical layout") has a CSS class specifying the precise key arrangement.
var geom={US:'ansi',_:'iso'} // _ is the default

function updateGlyphs(){ // apply model values to the DOM
  var lc=$lc.val(),l=layouts[lc],m=model[lc]
  $('#layout-kbd').removeClass('geom-ansi geom-iso').addClass('geom-'+(geom[$lc.val()]||geom._))
  for(var i=1;i<NK;i++){
    var g0=l[0][i];if(g0!=='☠'){$('#k'+i+' .g0').text(g0);var g1=m[0][i];$('#k'+i+' .g1').val(g1).prop('title',U(g1))}
    var g2=l[1][i];if(g2!=='☠'){$('#k'+i+' .g2').text(g2);var g3=m[1][i];$('#k'+i+' .g3').val(g3).prop('title',U(g3))}
  }
}
this.validate=function(){if($pfx.val().length!==1)return{message:'Invalid prefix key',element:$pfx}}
this.save=function(){
  prefs.prefixKey($pfx.val());prefs.kbdLocale($lc.val())
  var h={}
  for(var lc in model){
    var m=model[lc],l=layouts[lc],s='',xs=l[0]+l[1],ys=m[0].concat(m[1]).join(''),YS=l[2]+l[3]
    for(var i=0;i<xs.length;i++){var x=xs[i],y=ys[i],Y=YS[i];if(x!=='☠'&&y!=='☠'&&y!==Y)s+=x+y}
    s&&(h[lc]=s)
  }
  prefs.prefixMaps(h);D.win&&prefs.ime($('#layout-ime').is(':checked'))
}
