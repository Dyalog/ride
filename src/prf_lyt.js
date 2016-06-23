;(function(){'use strict'

var layouts=D.kbds.layouts,geom=D.kbds.geom
var NK=58     //number of scancodes we are concerned with
var model={}  //dictionary: locale→[arrayOfAPLGlyphs,arrayOfShiftedAPLGlyphs]
var q={},g=[] //q:DOM elements, g[i][j]:the DOM elements for key i and group j
function tip(x){return x===' '?'Click to\nconfigure':'U+'+('000'+x.charCodeAt(0).toString(16).toUpperCase()).slice(-4)}
D.prf_tabs.lyt={
  name:'Layout',
  init:function(t){
    var sk={15:'←',16:'↹',30:'Caps',43:'↲',44:'⇧',57:'⇧'} //special keys
    var a=t.querySelectorAll('[id^="lyt_"]');for(var i=0;i<a.length;i++)q[a[i].id.replace(/^lyt_/,'')]=a[i]
    var s='';for(var i=1;i<NK;i++)s+='<span id=k'+i+' class=key>'+(sk[i]||'<span class=g2></span><input class=g3><br>'+
                                                                          '<span class=g0></span><input class=g1>')+'</span>'
    q.kbd.innerHTML=s;q.lc.innerHTML='<option>'+Object.keys(layouts).sort().join('<option>')
    $(t)
      .on('focus','.key input',function(){var e=this;setTimeout(function(){e.select()},1)})
      .on('blur','.key input',function(){
        var i=+$(this).hasClass('g3'),
            j=+$(this).closest('.key').prop('id').slice(1),
            v=model[q.lc.value][i][j]=$(this).val().slice(-1)||' '
        this.value=v;this.title=tip(v)
      })
      .on('mouseover mouseout','.key input',function(e){$(this).toggleClass('hover',e.type==='mouseover')})
    for(var i=1;i<NK;i++){g[i]=[];var e=document.getElementById('k'+i)
                          for(var j=0;j<4;j++)g[i][j]=e.querySelector('.g'+j)}
    D.win&&$(t).append('<label id=lyt_ime_wr><input type=checkbox id=lyt_ime> '+
                       'Also enable Dyalog IME (requires RIDE restart)</label>')
    if(!layouts[D.prf.kbdLocale()]){
      var s=navigator.language, l=s.slice(0,2).toLowerCase(), c=s.slice(3,5).toUpperCase() //language&country
      var d=Object.keys(layouts).filter(function(x){return x.slice(3,5)===c}).sort()[0] //default layout for country c
      D.prf.kbdLocale(D.mac&&layouts[l+'_'+c+'_Mac']?l+'_'+c+'_Mac':layouts[l+'_'+c]?l+'_'+c:d?d:'en_US')
    }
    q.rst.onclick=function(){var lc=q.lc.value;q.pfx.value=D.prf.prefixKey.getDefault()//;updLegend()
                             model[lc]=[layouts[lc][2].split(''),layouts[lc][3].split('')];updGlyphs()}
    q.lc.onchange=updGlyphs
    //var updLegend=q.pfx.onchange=q.pfx.onkeyup=function(){$('#lyt_lgnd .pfx2').text($(this).val().slice(-1))}
    q.pfx.onfocus=function(){setTimeout(function(){$(q.pfx).select()},1)}
  },
  load:function(){
    q.lc.value=D.prf.kbdLocale();q.pfx.value=D.prf.prefixKey();/*updLegend();*/model={}
    for(var lc in layouts){var l=layouts[lc];model[lc]=[l[2].split(''),l[3].split('')]}
    var pm=D.prf.prefixMaps()
    for(var lc in pm){
      var v=pm[lc]
      if(layouts[lc])for(var i=0;i<v.length;i+=2)for(var j=0;j<2;j++){
        var ix=layouts[lc][j].indexOf(v[i]);ix>=0&&(model[lc][j][ix]=v[i+1])
      }
    }
    updGlyphs();if(D.win)q.ime.checked=!!D.prf.ime()
  },
  validate:function(){if(q.pfx.value.length!==1)return{msg:'Invalid prefix key',el:q.pfx}},
  save:function(){
    D.prf.prefixKey(q.pfx.value);D.prf.kbdLocale(q.lc.value)
    var h={}
    for(var lc in model){
      var m=model[lc],l=layouts[lc],s='',xs=l[0]+l[1],ys=m[0].concat(m[1]).join(''),YS=l[2]+l[3]
      for(var i=0;i<xs.length;i++){var x=xs[i],y=ys[i],Y=YS[i];if(y!==Y)s+=x+y}
      s&&(h[lc]=s)
    }
    D.prf.prefixMaps(h);D.win&&D.prf.ime(q.ime.checked)
  }
}
//Every geometry (aka "mechanical layout") has a CSS class specifying the precise key arrangement.
function updGlyphs(){ //apply model values to the DOM
  var lc=q.lc.value,l=layouts[lc],m=model[lc]; if(!l)return
  q.kbd.className='lyt_geom_'+(geom[lc]||geom._)
  for(var i=1;i<NK;i++){
    var g0=l[0][i],g1=m[0][i],g2=l[1][i],g3=m[1][i]
    if(g[i][0])g[i][0].textContent=g0;if(g[i][1]){g[i][1].value=g1;g[i][1].title=tip(g1)}
    if(g[i][2])g[i][2].textContent=g2;if(g[i][3]){g[i][3].value=g3;g[i][3].title=tip(g3)}
  }
}

}())
