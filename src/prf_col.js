//Preferences > Colours
//Here we generate CSS based on the user's preferences and put it in <style id=col_stl> (see ../index.html)
//Same for <style id=col_sample_stl> - this one controls the display of the sample text, before pressing Apply or OK.
;(function(){'use strict'
var G=[],H={} //G:syntax highlighting groups; H:reverse lookup dict for G
var q //dict of DOM elements whose ids start with "col_", keyed by the rest of the id
//D.addSynGrps(...) is the API for extensions, see ../sample-extensions/syntax-in-comments.js
D.addSynGrps=function(x){G=G.concat(x);H={};for(var i=0;i<G.length;i++)H[G[i].t]=i;SCMS&&updStl()}
D.addSynGrps([
  //t: token type, a short key for storing customisations
  //s: string to display in the UI
  //c: css selector -- will be prefixed with "#col_cm" or ".ride_win" unless /*noprefix*/ is present
  //ctrls: what UI controls should be shown or hidden for this group (other than the default ones)
  {s:'assignment'      ,t:'asgn',c:'.cm-apl-asgn'}, //←
  {s:'bracket'         ,t:'sqbr',c:'.cm-apl-sqbr'}, //[]
  //{s:'block cursor'    ,t:'bcr', c:'.CodeMirror-cursor',ctrls:{fg:1,bc:0,bg:0,BIU:0}},
  {s:'comment'         ,t:'com' ,c:'.cm-apl-com' }, //⍝
  {s:'block cursor'    ,t:'bcr' ,c:'.CodeMirror.cm-fat-cursor div.CodeMirror-cursor',ctrls:{bc:0,bg:1,BIU:0,fg:0}},
  {s:'cursor'          ,t:'cur' ,c:'div.CodeMirror-cursor'                          ,ctrls:{bc:1,bg:0,BIU:0,fg:0}},
  {s:'dfn level 1'     ,t:'dfn1',c:'.cm-apl-dfn.cm-apl-dfn1'}, //{}
  {s:'dfn level 2'     ,t:'dfn2',c:'.cm-apl-dfn.cm-apl-dfn2'},
  {s:'dfn level 3'     ,t:'dfn3',c:'.cm-apl-dfn.cm-apl-dfn3'},
  {s:'dfn level 4'     ,t:'dfn4',c:'.cm-apl-dfn.cm-apl-dfn4'},
  {s:'dfn level 5'     ,t:'dfn5',c:'.cm-apl-dfn.cm-apl-dfn5'}, //{1 {2 {3 {4 {5} } } } }
  {s:'dfn'             ,t:'dfn' ,c:'.cm-apl-dfn' },
  {s:'diamond'         ,t:'diam',c:'.cm-apl-diam'}, //⋄
  {s:'dyadic operator' ,t:'op2' ,c:'.cm-apl-op2' }, //⍣ ...
  {s:'error'           ,t:'err' ,c:'.cm-apl-err' },
  {s:'function'        ,t:'fn'  ,c:'.cm-apl-fn'  }, //+ ...
  {s:'global name'     ,t:'glb' ,c:'.cm-apl-glb' },
  {s:'idiom'           ,t:'idm' ,c:'.cm-apl-idm' }, //⊃⌽ ...
  {s:'keyword'         ,t:'kw'  ,c:'.cm-apl-kw'  }, //:If ...
  {s:'label'           ,t:'lbl' ,c:'.cm-apl-lbl' }, //L:
  {s:'line number'     ,t:'lnum',c:'.CodeMirror-linenumber'},
  {s:'matching bracket',t:'mtch',c:'.CodeMirror-matchingbracket'},
  {s:'modified line'   ,t:'mod' ,c:'.modified'   }, //in the session - lines queued for execution
  {s:'monadic operator',t:'op1' ,c:'.cm-apl-op1' }, //⌸ ...
  {s:'namespace'       ,t:'ns'  ,c:'.cm-apl-ns'  }, //#
  {s:'name'            ,t:'var' ,c:'.cm-apl-var' }, //a.k.a. identifier
  {s:'normal'          ,t:'norm',c:'.cm-s-default,.CodeMirror-gutters,/*noprefix*/#wse'},
  {s:'number'          ,t:'num' ,c:'.cm-apl-num' }, //0 ...
  {s:'parenthesis'     ,t:'par' ,c:'.cm-apl-par' }, //()
  {s:'quad name'       ,t:'quad',c:'.cm-apl-quad'}, //⎕XYZ
  {s:'search match'    ,t:'srch',c:'.cm-searching'},
  {s:'selection'       ,t:'sel' ,c:'.CodeMirror-selected,.CodeMirror-focused .CodeMirror-selected',ctrls:{fg:0,BIU:0}},
  {s:'semicolon'       ,t:'semi',c:'.cm-apl-semi'}, //as in A[B;C]
  {s:'string'          ,t:'str' ,c:'.cm-apl-str' }, //'a.k.a. character vector or scalar'
  {s:'system command'  ,t:'scmd',c:'.cm-apl-scmd'}, //)XYZ
  {s:'tracer'          ,t:'tc'  ,c:'.tracer .CodeMirror,.tracer .CodeMirror .CodeMirror-gutter-wrapper'},
  {s:'tradfn'          ,t:'trad',c:'.cm-apl-trad'}, //the header line (e.g. ∇{R}←A F B) or the closing ∇
  {s:'user command'    ,t:'ucmd',c:'.cm-apl-ucmd'}, //]XYZ
  {s:'value tip target',t:'vtt' ,c:'.vt_marker',ctrls:{bc:1,fg:0,BIU:0}}, //the rectangle around the token
  {s:'value tip'       ,t:'vtip',c:'/*noprefix*/#vt_bln,/*noprefix*/#vt_tri',ctrls:{bc:1}}, //the balloon
  {s:'zilde'           ,t:'zld' ,c:'.cm-apl-zld' }  //⍬
])
//Colour schemes have two representations:
// in memory (easier to manipulate)   in prefs.json (more compact)
//   {                                {
//     name:"MyScheme",                 "name":"MyScheme",
//     group1:{                         "styles":"group1=fg:f00,B group2=bg:f00 ..."
//       fg:"f00",                    }
//       B:1
//     },
//     group2:{
//       "bg":"f00"
//     },
//     ...
//   }
//encScm() and decScm() convert between them
function encScm(x){
  var s=''
  for(var g in x)if(g!=='name'){var u='';for(var p in x[g]){var v=x[g][p];u+=','+p;if('BIU'.indexOf(p)<0||!v)u+=':'+v}
                                u&&(s+=' '+g+'='+u.slice(1))}
  return{name:x.name,styles:s.slice(1)}
}
function decScm(x){                 //x:for example "num=fg:345,bg:f,B,U,bgo:.5 str=fg:2,I com=U"
  var r={name:x.name}               //r:the result
  var a=(x.styles||'').split(/\s+/) //a:for example ["num=fg:345,bg:f,B,U,bgo:.5","str=fg:2,I","com=U"]
  for(var i=0;i<a.length;i++)if(a[i]){
    var b=a[i].split('='),g=b[0],c=b[1].split(','),h=r[g]={}  //b:["num","fg:345,bg:f,B,U,bgo:.5"]  g:"num" (the group)
    for(var j=0;j<c.length;j++){                              //c:["fg:345","bg:f","B","U","bgo:.5"]
      var pv=c[j].split(':'),p=pv[0],v=pv[1];h[p]=v!=null?v:1 //p:"fg" v:"345"  or  p:"B" v:undefined
    }
    h.bgo!=null&&(h.bgo=+h.bgo)     //if .bgo (background opacity) is present, convert it to a number
  }
  return r
}
var SCMS=[ //built-in schemes
  {name:'Default',styles:'asgn=fg:00f com=fg:088 dfn=fg:00f diam=fg:00f err=fg:f00 fn=fg:008 idm=fg:00f kw=fg:800 '+
    'lnum=fg:008,bg:f,bgo:1 mod=bg:e,bgo:1 mtch=bg:ff8,bgo:.5 norm=bg:f,bgo:1 ns=fg:8 num=fg:8 op1=fg:00f op2=fg:00f '+
    'par=fg:00f quad=fg:808 sel=bg:48e,bgo:.5 semi=fg:00f sqbr=fg:00f srch=bg:f80,bgo:.5 str=fg:088 tc=bg:d,bgo:1 '+
    'trad=fg:8 var=fg:8 zld=fg:008 scmd=fg:00f ucmd=fg:00f vtt=bg:ff0'},
  {name:'Francisco Goya',styles:'asgn=fg:ff0 com=fg:b,I:1 cur=bc:f00 dfn2=fg:eb4 dfn3=fg:c79 dfn4=fg:cd0 dfn5=fg:a0d '+
    'dfn=fg:a7b diam=fg:ff0 err=fg:f00,bg:822,bgo:.5,B:1,U:1 fn=fg:0f0 glob=B:1 idm=B:1 kw=fg:aa2 '+
    'lbl=U:1,bg:642,bgo:.5 lnum=fg:b94,bg:010,bgo:1 mod=bg:1,bgo:1 mtch=fg:0,bg:ff8,bgo:.75 norm=fg:9c7,bg:0,bgo:1 '+
    'num=fg:a8b op1=fg:d95 op2=fg:fd6 sel=bg:048,bgo:.5 semi=fg:8 sqbr=fg:8 srch=bg:b96,bgo:.75,fg:0 str=fg:dae '+
    'tc=bg:1,bgo:1 zld=fg:d9f,B:1 scmd=fg:0ff ucmd=fg:f80,B:1 vtip=bg:733,fg:ff0,bgo:1,bc:900 vtt=bc:f80'},
  {name:'Albrecht Dürer',styles:'com=I:1 diam=B:1 err=fg:f,bg:0,bgo:.5,B:1,I:1,U:1 glb=I:1 idm=U:1,bg:e,bgo:.5 kw=B:1 '+
    'lnum=bg:f,bgo:1 mod=bg:e,bgo:1 mtch=bg:c,bgo:.5 norm=bg:f,bgo:1 ns=fg:8 num=fg:8 quad=fg:8 srch=bg:c,bgo:.5 '+
    'str=fg:8 tc=bg:e,bgo:1 zld=fg:8 vtt=bc:aaa'},
  {name:'Kazimir Malevich',styles:''}
].map(decScm).map(function(x){x.frz=1;return x})
var scms //all schemes (built-in and user-defined) as objects
var scm  //the active scheme object
var cm   //CodeMirror instance for displaying sample code
var sel  //the selected group's token type (.t)
function renderCSS(scm,isSample){
  var rp=isSample?'#col_cm':'.ride_win' //css rule prefix, ignored when there's a "/*noprefix*/"
  return G.map(function(g){var h=scm[g.t];return!h?'':
    g.c.split(',').map(function(x){return!/^\/\*noprefix\*\//.test(x)?rp+' '+x:isSample?'#nonexistent':x}).join(',')+'{'+
      (h.fg?'color:'+RGB(h.fg)+';'           :'')+
      (h.bg?'background-color:'+RGB(h.bg)+';':'')+
      (h.B ?'font-weight:bold;'              :'')+
      (h.I ?'font-style:italic;'             :'')+
      (h.U ?'text-decoration:underline;'     :'')+
      (h.bc?'border-color:'+RGB(h.bc)+';'    :'')+
      (h.bg?'background-color:'+RGBA(h.bg,h.bgo==null?.5:h.bgo):'')+'}'
  }).join('')
}
//RGB() expands the hex representation of a colour, rgb() shrinks it
function RGB(x){var n=(x||'').length;return n===6?'#'+x:n===3?'#'+x.replace(/(.)/g,'$1$1'):n===1?'#'+x+x+x+x+x+x:x}
function RGBA(x,a){x=RGB(x);return'rgba('+[+('0x'+x.slice(1,3)),+('0x'+x.slice(3,5)),+('0x'+x.slice(5,7)),a]+')'}
function rgb(x){if(!/^#.{6}$/.test(x))return x
                var r=x[1],R=x[2],g=x[3],G=x[4],b=x[5],B=x[6];return r!==R||g!==G||b!==B?x.slice(1):r===g&&g===b?r:r+g+b}
function updStl(){ //update global style from what's in prefs.json
  var s=D.prf.colourScheme(),a=SCMS.concat(D.prf.colourSchemes().map(decScm))
  for(var i=0;i<a.length;i++)if(a[i].name===s){
    I.col_stl.textContent=renderCSS(a[i])
    var h=a[i].norm||{}, bg=RGB(h.bg||'#ffffff'), bgo=h.bgo==null?1:h.bgo,
        b=Math.max(+('0x'+bg.slice(1,3)),+('0x'+bg.slice(3,5)),+('0x'+bg.slice(5,7))),
        dark=127>(1-bgo)*255+bgo*b
    document.body.classList[dark?'add':'remove']('dark')
    break
  }
}
$(updStl);D.prf.colourScheme(updStl);D.prf.colourSchemes(updStl)
function uniqScmName(x){ //x:suggested root
  var h={};for(var i=0;i<scms.length;i++)h[scms[i].name]=1
  var r=x;if(h[x]){x=x.replace(/ \(\d+\)$/,'');var i=1;while(h[r=x+' ('+i+')'])i++};return r
}
var SC_MATCH='search match' //sample text to illustrate it
D.prf_tabs.col={
  name:'Colours',
  init:function(t){
    q=J.col;var u=[],fg;for(var g in scm)(fg=scm[g].fg)&&u.indexOf(fg)<0&&u.push(fg);u.sort() //u:unique colours
    q.list.innerHTML=u.map(function(x){return'<option value='+x+'>'}).join('')
    q.grp.innerHTML=G.map(function(g,i){return'<option value='+i+'>'+g.s}).join('')
    q.scm.onchange=function(){scm=scms[+this.selectedIndex];updSampleStl();I.col.className=scm.frz?'frz':''
                              cm.setSize(q.cm.offsetWidth,q.cm.offsetHeight)}
    q.new_name.onblur=function(){var s=this.value;if(!s)return;scm.name='';scm.name=uniqScmName(s)
                                 I.col.className='';updScms()}
    q.new_name.onkeydown=function(x){switch(x.which){/*enter*/case 13:                    this.blur();return!1
                                                     /*esc  */case 27:this.value=scm.name;this.blur();return!1}}
    q.cln.onclick=function(){var x={};scms.push(x);for(var k in scm)x[k]=$.extend({},scm[k]) //x:the new scheme
                             x.name=uniqScmName(scm.name);delete x.frz;scm=x;updScms()}
    q.ren.onclick=function(){q.new_name.style.width=q.scm.offsetWidth+'px';q.new_name.value=scm.name
                             q.new_name.select();I.col.className='renaming';setTimeout(function(){q.new_name.focus()},0)}
    q.del.onclick=function(){var i=q.scm.selectedIndex;scms.splice(i,1);scm=scms[Math.min(i,scms.length-1)]
                             updScms();return!1}
    cm=CM(q.cm,{
      lineNumbers:true,firstLineNumber:0,lineNumberFormatter:function(i){return'['+i+']'},
      indentUnit:4,scrollButtonHeight:12,matchBrackets:true,autoCloseBrackets:{pairs:'()[]{}',explode:'{}'},
      value:'{R}←{X}tradfn(Y Z);local\n'+
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
            SC_MATCH+'\n'})
    cm.addOverlay({token:function(sm){var i=sm.string.slice(sm.pos).indexOf(SC_MATCH)
                                      if(!i){sm.pos+=SC_MATCH.length;return'searching'}
                                      i>0?(sm.pos+=i):sm.skipToEnd()}})
    cm.on('gutterClick',function(){selGrp('lnum')})
    cm.on('cursorActivity',function(){
      var t;selGrp(cm.somethingSelected()?'sel':
                   cm.getLine(cm.getCursor().line).indexOf(SC_MATCH)>=0?'srch':
                   (t=cm.getTokenTypeAt(cm.getCursor(),1))?
                     (t=t.split(' ').sort(function(x,y){return y.length-x.length})[0].replace(/^apl-/,'')):
                   'norm')})
    q.grp.onchange=function(){selGrp(G[+this.value].t)}
    ;['fg','bg','bc'].forEach(function(p){
      q[p].onchange=function(){(scm[sel]||(scm[sel]={}))[p]=this.value;updSampleStl()}
      q[p+'_cb'].onclick=function(){var h=scm[sel]||(scm[sel]={});this.checked?h[p]=rgb(q[p].value):delete h[p]
                                    q[p].hidden=!this.checked;updSampleStl();if(p==='bg')q.bgo_p.hidden=!this.checked}
    })
    q.bgo.onchange=function(e){(scm[sel]||(scm[sel]={})).bgo=+q.bgo.value;updSampleStl()}
    ;['B','I','U'].forEach(function(p){$(q[p]).click(function(){var h=scm[sel]||(scm[sel]={})
                                       this.checked?h[p]=1:delete h[p];updSampleStl()})})
  },
  load:function(){var a=scms=SCMS.concat(D.prf.colourSchemes().map(decScm)),s=D.prf.colourScheme()
                  scm=a[0];for(var i=0;i<a.length;i++)if(a[i].name===s){scm=a[i];break}
                  I.col.className='';updScms()
                  cm.setSize(q.cm.offsetWidth,q.cm.offsetHeight);cm.refresh()},
  activate:function(){q.scm.focus()},
  save:function(){D.prf.colourSchemes(scms.filter(function(x){return!x.frz}).map(encScm));D.prf.colourScheme(scm.name)},
  resize:function(){cm.setSize(q.cm.offsetWidth,q.cm.offsetHeight);cm.refresh()}
}
function updScms(){q.scm.innerHTML=scms.map(function(x){x=D.util.esc(x.name);return'<option value="'+x+'">'+x}).join('')
                   q.scm.value=scm.name;q.scm.onchange();I.col.className=scm.frz?'frz':''
                   cm.setSize(q.cm.offsetWidth,q.cm.offsetHeight);updSampleStl();selGrp('norm',1)}
function updSampleStl(){I.col_sample_stl.textContent=renderCSS(scm,1)} //[sic]
function selGrp(t,forceRefresh){ //update everything as necessary when selection in the Group dropdown changes
  if(!scm||sel===t&&!forceRefresh)return
  var i=H[t],h=scm[t]||{},v;q.grp.value=i
  v=h.fg;q.fg_cb.checked=!!v;q.fg.value=RGB(v)||'#000000';q.fg.hidden=!v
  v=h.bg;q.bg_cb.checked=!!v;q.bg.value=RGB(v)||'#000000';q.bg.hidden=!v
  v=h.bc;q.bc_cb.checked=!!v;q.bc.value=RGB(v)||'#000000';q.bc.hidden=!v
  q.B.checked=!!h.B
  q.I.checked=!!h.I
  q.U.checked=!!h.U
  q.bgo.value=h.bgo==null?.5:h.bgo
  var c=(G[i]||G[0]).ctrls||{}
  q.fg_p.hidden=c.fg!=null&&!c.fg
  q.bg_p.hidden=c.bg!=null&&!c.bg
  q.bgo_p.hidden=(c.bg!=null&&!c.bg)||!h.bg
  q.BIU_p.hidden=c.BIU!=null&&!c.BIU
  q.bc_p.hidden=!c.bc
  sel=t
}

}())
