'use strict'
var prefs=require('./prefs'),esc=require('./util').esc
this.name='Colours'
var G=[],H={} // G:syntax highlighting groups {t,s,c,ctrls}; H:reverse lookup dict for G
D.addSyntaxGroups=function(x){G=G.concat(x);H={};for(var i=0;i<G.length;i++)H[G[i].t]=i;builtInSchemes&&updateStyle()}
D.addSyntaxGroups([
  // t: token type, a short key for storing customisations in localStorage
  // s: string to display in the UI
  // c: css selector
  // ctrls: what UI controls should be shown or hidden for this group (other than the default ones)
  {t:'norm',s:'normal',          c:'.cm-s-default,.CodeMirror-gutters'},
  {t:'num', s:'number',          c:'.cm-apl-num' },
  {t:'str', s:'string',          c:'.cm-apl-str' },
  {t:'zld', s:'zilde',           c:'.cm-apl-zld' },
  {t:'var', s:'name',            c:'.cm-apl-var' },
  {t:'glb', s:'global name',     c:'.cm-apl-glb' },
  {t:'quad',s:'quad name',       c:'.cm-apl-quad'},
  {t:'fn',  s:'function',        c:'.cm-apl-fn'  },
  {t:'op1', s:'monadic operator',c:'.cm-apl-op1' },
  {t:'op2', s:'dyadic operator', c:'.cm-apl-op2' },
  {t:'ns',  s:'namespace',       c:'.cm-apl-ns'  },
  {t:'asgn',s:'assignment',      c:'.cm-apl-asgn'},
  {t:'diam',s:'diamond',         c:'.cm-apl-diam'},
  {t:'par', s:'parenthesis',     c:'.cm-apl-par' },
  {t:'sqbr',s:'bracket',         c:'.cm-apl-sqbr'},
  {t:'semi',s:'semicolon',       c:'.cm-apl-semi'},
  {t:'dfn', s:'dfn',             c:'.cm-apl-dfn' },
  {t:'dfn1',s:'dfn level 1',     c:'.cm-apl-dfn1'},
  {t:'dfn2',s:'dfn level 2',     c:'.cm-apl-dfn2'},
  {t:'dfn3',s:'dfn level 3',     c:'.cm-apl-dfn3'},
  {t:'dfn4',s:'dfn level 4',     c:'.cm-apl-dfn4'},
  {t:'dfn5',s:'dfn level 5',     c:'.cm-apl-dfn5'},
  {t:'trad',s:'tradfn',          c:'.cm-apl-trad'},
  {t:'kw',  s:'keyword',         c:'.cm-apl-kw'  },
  {t:'lbl', s:'label',           c:'.cm-apl-lbl' },
  {t:'idm', s:'idiom',           c:'.cm-apl-idm' },
  {t:'com', s:'comment',         c:'.cm-apl-com' },
  {t:'scmd',s:'system command',  c:'.cm-apl-scmd'},
  {t:'err', s:'error',           c:'.cm-apl-err' },
  {t:'lnum',s:'line number',     c:'.CodeMirror-linenumber'},
  {t:'cur', s:'cursor',          c:'div.CodeMirror-cursor', ctrls:{lb:1,fg:0,bg:0,BIU:0}},
  {t:'mtch',s:'matching bracket',c:'.CodeMirror-matchingbracket'},
  {t:'srch',s:'search match',    c:'.cm-searching'},
  {t:'mod', s:'modified line',   c:'.modified'},
  {t:'sel', s:'selection',       c:'.CodeMirror-selected,.CodeMirror-focused .CodeMirror-selected', ctrls:{fg:0,BIU:0}},
  {t:'tc',  s:'tracer',          c:'.tracer .CodeMirror,.tracer .CodeMirror .CodeMirror-gutter-wrapper'}
])
// Colour schemes have two representations:
//   in memory                 in localStorage
//     {                         {
//       "name": "MyScheme",       "name": "MyScheme",
//       "group1": {               "styles": "group1=fg:f00,B group2=bg:f00 ..."
//         "fg": "f00",          }
//         "B": 1
//       },
//       "group2": {
//         "bg": "f00"
//       },
//       ...
//     }
// encodeScheme() and decodeScheme() convert between them
function encodeScheme(x){
  var s=''
  for(var g in x)if(g!=='name'){
    var u='';for(var p in x[g]){var v=x[g][p];u+=','+p;if('BIU'.indexOf(p)<0||!v)u+=':'+v}
    u&&(s+=' '+g+'='+u.slice(1))
  }
  return{name:x.name,styles:s.slice(1)}
}
function decodeScheme(x){           // x:for example "num=fg:345,bg:f,B,U,bgo:.5 str=fg:2,I com=U"
  var r={name:x.name}               // r:this will be the result
  var a=(x.styles||'').split(/\s+/) // a:for example ["num=fg:345,bg:f,B,U,bgo:.5","str=fg:2,I","com=U"]
  for(var i=0;i<a.length;i++)if(a[i]){
    var b=a[i].split('='),g=b[0],c=b[1].split(','),h=r[g]={}  // b:["num","fg:345,bg:f,B,U,bgo:.5"]  g:"num" (the group)
    for(var j=0;j<c.length;j++){                              // c:["fg:345","bg:f","B","U","bgo:.5"]
      var pv=c[j].split(':'),p=pv[0],v=pv[1];h[p]=v!=null?v:1 // p:"fg" v:"345"  or  p:"B" v:undefined
    }
    h.bgo!=null&&(h.bgo=+h.bgo)     // if .bgo (background opacity) is present, convert it to a number
  }
  return r
}
var builtInSchemes=[
  {name:'Default',styles:'asgn=fg:00f com=fg:088 dfn=fg:00f diam=fg:00f err=fg:f00 fn=fg:008 idm=fg:00f kw=fg:800 '+
    'lnum=fg:008,bg:f,bgo:1 mod=bg:e,bgo:1 mtch=bg:ff8,bgo:.5 norm=bg:f,bgo:1 ns=fg:8 num=fg:8 op1=fg:00f op2=fg:00f '+
    'par=fg:00f quad=fg:808 sel=bg:ddf,bgo:.5 semi=fg:00f sqbr=fg:00f srch=bg:f80,bgo:.5 str=fg:088 tc=bg:d,bgo:1 '+
    'trad=fg:8 var=fg:8 zld=fg:008 scmd=fg:00f'},
  {name:'Francisco Goya',styles:'asgn=fg:ff0 com=fg:b,I:1 cur=lb:f00 dfn2=fg:eb4 dfn3=fg:c79 dfn4=fg:cd0 dfn5=fg:a0d '+
    'dfn=fg:a7b diam=fg:ff0 err=fg:f00,bg:822,bgo:.5,B:1,U:1 fn=fg:0f0 glob=B:1 idm=B:1 kw=fg:aa2 '+
    'lbl=U:1,bg:642,bgo:.5 lnum=fg:b94,bg:010,bgo:1 mod=bg:1,bgo:1 mtch=fg:0,bg:ff8,bgo:.75 norm=fg:9c7,bg:0,bgo:1 '+
    'num=fg:a8b op1=fg:d95 op2=fg:fd6 sel=bg:048,bgo:.5 semi=fg:8 sqbr=fg:8 srch=bg:b96,bgo:.75,fg:0 str=fg:dae '+
    'tc=bg:1,bgo:1 zld=fg:d9f,B:1 scmd=fg:0ff'},
  {name:'Albrecht Dürer',styles:'com=I:1 diam=B:1 err=fg:f,bg:0,bgo:.5,B:1,I:1,U:1 glb=I:1 idm=U:1,bg:e,bgo:.5 kw=B:1 '+
    'lnum=bg:f,bgo:1 mod=bg:e,bgo:1 mtch=bg:c,bgo:.5 norm=bg:f,bgo:1 ns=fg:8 num=fg:8 quad=fg:8 srch=bg:c,bgo:.5 '+
    'str=fg:8 tc=bg:e,bgo:1 zld=fg:8'},
  {name:'Kazimir Malevich',styles:''}
].map(decodeScheme).map(function(x){x.frozen=1;return x})
var schemes // all schemes (built-in and user-defined) as objects
var scheme  // the active scheme object
var $cm,cm  // DOM element and CodeMirror instance for displaying sample code
var sel     // the selected group's token type (.t)
function renderCSS(scheme,rp){ // rp: css rule prefix
  return G.map(function(g){var h=scheme[g.t];return!h?'':
    g.c.split(',').map(function(x){return(rp||'')+' '+x}).join(',')+'{'+
      (h.fg?'color:'+expandRGB(h.fg)+';'           :'')+
      (h.bg?'background-color:'+expandRGB(h.bg)+';':'')+
      (h.B ?'font-weight:bold;'                    :'')+
      (h.I ?'font-style:italic;'                   :'')+
      (h.U ?'text-decoration:underline;'           :'')+
      (h.lb?'border-color:'+expandRGB(h.lb)+';'    :'')+
      (h.bg?'background-color:'+expandRGBA(h.bg,h.bgo==null?.5:h.bgo):'')+'}'
  }).join('')
}
function expandRGB(s){var n=(s||'').length;return n===6?'#'+s:n===3?'#'+s.replace(/(.)/g,'$1$1'):n===1?'#'+s+s+s+s+s+s:s}
function expandRGBA(s,a){s=expandRGB(s);return'rgba('+[+('0x'+s.slice(1,3)),+('0x'+s.slice(3,5)),+('0x'+s.slice(5,7)),a]+')'}
function shrinkRGB(s){
  if(!/^#.{6}$/.test(s))return s
  var r=s[1],R=s[2],g=s[3],G=s[4],b=s[5],B=s[6];return r!==R||g!==G||b!==B?s.slice(1):r===g&&g===b?r:r+g+b
}
function updateStyle(){ // update global style from what's in localStorage
  var name=prefs.colourScheme(),a=builtInSchemes.concat(prefs.colourSchemes().map(decodeScheme))
  for(var i=0;i<a.length;i++)if(a[i].name===name){$('#col-style').text(renderCSS(a[i],'.ride-win'));break}
}
$(updateStyle);prefs.colourScheme(updateStyle);prefs.colourSchemes(updateStyle)
function chooseUniqueSchemeName(s){ // s: suggested root
  var h={};for(var i=0;i<schemes.length;i++)h[schemes[i].name]=1
  var r=s;if(h[s]){s=s.replace(/ \(\d+\)$/,'');var i=1;while(h[r=s+' ('+i+')'])i++};return r
}
var SEARCH_MATCH='search match' // sample text to illustrate it
this.init=function($e){
  var u=[],fg;for(var g in scheme)(fg=scheme[g].fg)&&u.indexOf(fg)<0&&u.push(fg);u.sort() // u: unique colours
  $e.html(
    '<div id=col-top>'+
      '<label>Scheme: <select id=col-scheme></select></label>'+
      '<input id=col-new-name class=text-field>'+
      '<button id=col-clone  data-accesskey=c><u>C</u>lone</button>'+
      '<button id=col-rename data-accesskey=r><u>R</u>ename</button>'+
      '<button id=col-delete data-accesskey=d><u>D</u>elete</button>'+
    '</div>'+
    '<div id=col-cm></div>'+
    '<div id=col-settings>'+
      '<datalist id=col-list>'+u.map(function(c){return'<option value='+c+'>'}).join('')+'</datalist>'+
      '<select id=col-group>'+G.map(function(g,i){return'<option value='+i+'>'+g.s}).join('')+'</select>'+
      '<p id=col-fg-p><label><input type=checkbox id=col-fg-cb>Foreground</label> <input type=color id=col-fg list=col-list>'+
      '<p id=col-bg-p><label><input type=checkbox id=col-bg-cb>Background</label> <input type=color id=col-bg list=col-list>'+
      '<div id=col-bgo title=Transparency></div>'+
      '<p id=col-BIU-p>'+
        '<label><input type=checkbox id=col-B><b>B</b></label>'+
        '<label><input type=checkbox id=col-I><i>I</i></label>'+
        '<label><input type=checkbox id=col-U><u>U</u></label>'+
      '<p id=col-lb-p><label><input type=checkbox id=col-lb-cb>Cursor colour</label> <input type=color id=col-lb>'+
    '</div>'
  )
  $('#col-scheme').change(function(){
    scheme=schemes[+this.selectedIndex];updateSampleStyle()
    $('#prefs-tab-colours').toggleClass('frozen',!!scheme.frozen);cm.setSize($cm.width(),$cm.height())
  })
  $('#col-new-name').blur(function(){
    var newName=$(this).val();if(!newName)return
    scheme.name='';scheme.name=chooseUniqueSchemeName(newName)
    $('#prefs-tab-colours').removeClass('renaming');updateSchemes()
  }).keydown(function(e){switch(e.which){ // todo
    case 13:$(this)                 .blur();return!1 // enter
    case 27:$(this).val(scheme.name).blur();return!1 // esc
  }})
  $('#col-clone').click(function(){
    var x={};schemes.push(x);for(var k in scheme)x[k]=$.extend({},scheme[k]) // x:the new scheme
    x.name=chooseUniqueSchemeName(scheme.name);delete x.frozen;scheme=x;updateSchemes()
  })
  $('#col-rename').click(function(){
    $('#col-new-name').width($('#col-scheme').width()).val(scheme.name).select()
    $('#prefs-tab-colours').addClass('renaming')
    setTimeout(function(){$('#col-new-name').focus()},0)
  })
  $('#col-delete').click(function(){
    var i=$('#col-scheme')[0].selectedIndex;schemes.splice(i,1)
    scheme=schemes[Math.min(i,schemes.length-1)];updateSchemes();return!1
  })
  $cm=$('#col-cm')
  cm=CodeMirror($cm[0],{
    lineNumbers:true,firstLineNumber:0,lineNumberFormatter:function(i){return'['+i+']'},
    indentUnit:4,scrollButtonHeight:12,matchBrackets:true,autoCloseBrackets:{pairs:'()[]{}',explode:'{}'}
  })
  cm.addOverlay({token:function(stream){
    var i=stream.string.slice(stream.pos).indexOf(SEARCH_MATCH)
    if(!i){stream.pos+=SEARCH_MATCH.length;return'searching'}
    i>0?(stream.pos+=i):stream.skipToEnd()
  }})
  cm.on('gutterClick',function(){selectGroup('lnum')})
  cm.on('cursorActivity',function(){
    var t
    selectGroup(
      cm.somethingSelected()?'sel':
      cm.getLine(cm.getCursor().line).indexOf(SEARCH_MATCH)>=0?'srch':
      (t=cm.getTokenTypeAt(cm.getCursor(),1))?
        (t=t.split(' ').sort(function(x,y){return y.length-x.length})[0].replace(/^apl-/,'')):
      'norm'
    )
  })
  $('#col-group').change(function(){selectGroup(G[+this.value].t)})
  ;['fg','bg','lb'].forEach(function(p){
    $('#col-'+p).change(function(){(scheme[sel]||(scheme[sel]={}))[p]=this.value;updateSampleStyle()})
    $('#col-'+p+'-cb').click(function(){
      $('#col-'+p).toggle(this.checked)
      var h=scheme[sel]||(scheme[sel]={});this.checked?h[p]=shrinkRGB($('#col-'+p).val()):delete h[p]
      updateSampleStyle()
    })
  })
  $('#col-bg-cb').click(function(){$('#col-bgo').toggle(this.checked)})
  $('#col-bgo').slider({range:'min',value:.5,min:0,max:1,step:.25,slide:function(e,ui){
    (scheme[sel]||(scheme[sel]={})).bgo=ui.value;updateSampleStyle()
  }})
  ;['B','I','U'].forEach(function(p){
    $('#col-'+p).click(function(){
      var h=scheme[sel]||(scheme[sel]={});this.checked?h[p]=1:delete h[p];updateSampleStyle()
    })
  })
  cm.setValue(
    '{R}←{X}tradfn(Y Z);local\n'+
    'dfn←{ ⍝ comment\n'+
    '  0 ¯1.2e¯3j¯.45 \'string\' ⍬\n'+
    '  +/-⍣(×A):⍺∇⍵[i;j]\n'+
    '  {{{{nested ⍺:∇⍵}⍺:∇⍵}⍺:∇⍵}⍺:∇⍵}\n'+
    '}\n'+
    'label:\n'+
    ':For i :In ⍳X ⋄ :EndFor\n'+
    ':If condition\n'+
    '  {⍵[⍋⍵]} ⋄ global←local←0\n'+
    '  ⎕error ) ] } :error \'unclosed\n'+
    ':EndIf\n'+
    SEARCH_MATCH+'\n'
  )
}
function updateSchemes(){
  $('#col-scheme').html(schemes.map(function(x){x=esc(x.name);return'<option value="'+x+'">'+x}).join('')).val(scheme.name)
  $('#prefs-tab-colours').toggleClass('frozen',!!scheme.frozen);cm.setSize($cm.width(),$cm.height())
  updateSampleStyle();selectGroup('norm',1)
}
this.load=function(){
  var a=schemes=builtInSchemes.concat(prefs.colourSchemes().map(decodeScheme))
  var s=prefs.colourScheme();scheme=a[0];for(var i=0;i<a.length;i++)if(a[i].name===s){scheme=a[i];break}
  updateSchemes();$('#prefs-tab-colours').removeClass('renaming');cm.setSize($cm.width(),$cm.height())
}
this.save=function(){
  prefs.colourSchemes(schemes.filter(function(x){return!x.frozen}).map(encodeScheme))
  prefs.colourScheme(scheme.name)
}
this.resize=function(){cm.setSize($cm.width(),$cm.height())}
function updateSampleStyle(){$('#col-sample-style').text(renderCSS(scheme,'#col-cm'))}
function selectGroup(t,forceRefresh){
  if(scheme&&(sel!==t||forceRefresh)){
    var i=H[t],h=scheme[t]||{};$('#col-group').val(i)
    var ps=['fg','bg','lb']
    for(var i=0;i<ps.length;i++){
      var p=ps[i];$('#col-'+p+'-cb').prop('checked',!!h[p]);$('#col-'+p).val(expandRGB(h[p])||'#000000').toggle(!!h[p])
    }
    var ps='BIU';for(var i=0;i<ps.length;i++){var p=ps[i];$('#col-'+p).prop('checked',!!h[p])}
    $('#col-bgo').slider('value',h.bgo==null?.5:h.bgo)
    var c=(G[i]||G[0]).ctrls||{}
    $('#col-fg-p' ).toggle(c.fg==null||!!c.fg)
    $('#col-bg-p' ).toggle(c.bg==null||!!c.bg)
    $('#col-bgo'  ).toggle(!!h.bg)
    $('#col-BIU-p').toggle(c.BIU==null||!!c.BIU)
    $('#col-lb-p' ).toggle(!!c.lb)
    sel=t
  }
}
