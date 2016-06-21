;(function(){'use strict'

var layouts=D.kbds.layouts,geom=D.kbds.geom
var NK=58    //number of scancodes we are concerned with
var model={} //dictionary: locale→[arrayOfAPLGlyphs,arrayOfShiftedAPLGlyphs]
var pfxE,lcE //DOM elements for "Prefix" and "Locale"
var grp=[]   //grp[i][j] is the DOM elements for keys i and group j
function tip(x){return x===' '?'Click to\nconfigure':'U+'+('000'+x.charCodeAt(0).toString(16).toUpperCase()).slice(-4)}
D.prf_tabs.push({
  name:'Layout',id:'layout',
  init:function($e){
    var sk={15:'←',16:'↹',30:'Caps',43:'↲',44:'⇧',57:'⇧'} //special keys
    $e.html(
//    '<table id=layout-legend class=key>'+
//      '<tr><td class=g2>⇧x</td><td class=g3><span class=pfx2>`</span>&nbsp;⇧x</td></tr>'+
//      '<tr><td class=g0>x</td><td class=g1><span class=pfx2>`</span>&nbsp;x</td></tr>'+
//    '</table>'+
      '<div id=layout-help>'+
        'To insert a blue glyph, type Prefix followed by the corresponding black character.<br>'+
        'To insert a red glyph, type Prefix followed by Shift+the black character.'+
      '</div>'+
      '<hr>'+
      '<div id=layout-controls>'+
        '<button id=layout-rst><u>R</u>eset</button>'+
        '<label id=layout-pfx-label><u>P</u>refix: <input id=layout-pfx size=1></label>'+
        '<label id=layout-lc-label><u>L</u>ocale: '+
          '<select id=layout-lc><option>'+Object.keys(layouts).sort().join('<option>')+'</select>'+
        '</label>'+
      '</div>'+
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
            v=model[lcE.value][i][j]=$(this).val().slice(-1)||' '
        $(this).val(v).prop('title',tip(v))
      })
      .on('mouseover mouseout','.key input',function(e){$(this).toggleClass('hover',e.type==='mouseover')})
    for(var i=1;i<NK;i++)
      {grp[i]=[];var e=document.getElementById('k'+i);for(var j=0;j<4;j++)grp[i][j]=e.querySelector('.g'+j)}
    D.win&&$e.append('<label id=layout-ime-wrapper><input type=checkbox id=layout-ime> '+
                     'Also enable Dyalog IME (requires RIDE restart)</label>')
    if(!layouts[D.prf.kbdLocale()]){
      var s=navigator.language, l=s.slice(0,2).toLowerCase(), c=s.slice(3,5).toUpperCase() //language&country
      var d=Object.keys(layouts).filter(function(x){return x.slice(3,5)===c}).sort()[0] //default layout for country c
      D.prf.kbdLocale(D.mac&&layouts[l+'_'+c+'_Mac']?l+'_'+c+'_Mac':layouts[l+'_'+c]?l+'_'+c:d?d:'en_US')
    }
    $('#layout-rst').click(function(){
      var lc=lcE.value;pfxE.value=D.prf.prefixKey.getDefault()//;updLegend()
      model[lc]=[layouts[lc][2].split(''),layouts[lc][3].split('')];updGlyphs()
    })
    lcE=document.getElementById('layout-lc');lcE.onchange=updGlyphs
    pfxE=document.getElementById('layout-pfx')
    //var updLegend=pfxE.onchange=pfxE.onkeyup=function(){$('#layout-legend .pfx2').text($(this).val().slice(-1))}
    pfxE.onfocus=function(){var t=this;setTimeout(function(){$(t).select()},1)}
  },
  load:function(){
    lcE.value=D.prf.kbdLocale();pfxE.value=D.prf.prefixKey();/*updLegend();*/model={}
    for(var lc in layouts){var l=layouts[lc];model[lc]=[l[2].split(''),l[3].split('')]}
    var pm=D.prf.prefixMaps()
    for(var lc in pm){
      var v=pm[lc]
      if(layouts[lc])for(var i=0;i<v.length;i+=2)for(var j=0;j<2;j++){
        var ix=layouts[lc][j].indexOf(v[i]);ix>=0&&(model[lc][j][ix]=v[i+1])
      }
    }
    updGlyphs();D.win&&$('#layout-ime').prop('checked',!!D.prf.ime())
  },
  validate:function(){if(pfxE.value.length!==1)return{msg:'Invalid prefix key',el:$(pfxE)}},
  save:function(){
    D.prf.prefixKey(pfxE.value);D.prf.kbdLocale(lcE.value)
    var h={}
    for(var lc in model){
      var m=model[lc],l=layouts[lc],s='',xs=l[0]+l[1],ys=m[0].concat(m[1]).join(''),YS=l[2]+l[3]
      for(var i=0;i<xs.length;i++){var x=xs[i],y=ys[i],Y=YS[i];if(y!==Y)s+=x+y}
      s&&(h[lc]=s)
    }
    D.prf.prefixMaps(h);D.win&&D.prf.ime($('#layout-ime').is(':checked'))
  }
})
//Every geometry (aka "mechanical layout") has a CSS class specifying the precise key arrangement.
function updGlyphs(){ //apply model values to the DOM
  var lc=lcE.value,l=layouts[lc],m=model[lc]; if(!l)return
  $('#layout-kbd').removeClass('geom-ansi geom-iso').addClass('geom-'+(geom[lc]||geom._))
  for(var i=1;i<NK;i++){
    var g0=l[0][i],g1=m[0][i],g2=l[1][i],g3=m[1][i]
    if(grp[i][0])grp[i][0].textContent=g0;if(grp[i][1]){grp[i][1].value=g1;grp[i][1].title=tip(g1)}
    if(grp[i][2])grp[i][2].textContent=g2;if(grp[i][3]){grp[i][3].value=g3;grp[i][3].title=tip(g3)}
  }
}

}())
