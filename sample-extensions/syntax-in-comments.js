//To use this extension:
//  export RIDE_JS=/path/to/file.js
//before starting Ride.
//Go to Preferences>Colours, select Token Type: ACME Number and style it.
//Open an editor and type
//  ⍝1: abc 123
//"123" should appear different.
CodeMirror.defineMIME('text/apl-comments','acme')
CodeMirror.defineMode('acme',function(){ // https://codemirror.net/doc/manual.html#modeapi
  return{
    startState:function(){return{type:'',stk:''}},
    token:function(stream,h){ // h:state
      var c,m
      if(!h.type){
        if(m=stream.match(/^[V0-9]:/)){h.type=m[0][0];return'acme-type'}
        stream.skipToEnd();return''
      }else if(h.type==='0'||h.type==='V'){
        stream.skipToEnd();return'acme-comment'
      }else{
        if(stream.match(/^ +/))return'acme-ws'
        if(stream.match(/^\d+/))return'acme-number'
        if(stream.match(/^\$[234]\b/))return'acme-dollarnumber'
        if(stream.match(/^As\b/)){h.as=1;return'acme-as'}
        if(stream.match(/^[A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ][A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ0-9]*/))return'acme-identifier'
        switch(c=stream.next()){
          case':':if(h.as){stream.skipToEnd();return'acme-comment'}else{return'acme-colon'}
          case'(':case'[':case'{':h.stk+=c;return'acme-delimiter'
          case')':case']':case'}':
            if(['()','[]','{}'].indexOf(h.stk.slice(-1)+c)<0){return'acme-error'}
            else{h.stk=h.stk.slice(0,-1);return'acme-delimiter'}
          case';':return'acme-delimiter'
          default:return'acme-error'
        }
      }
    }
  }
})
D.addSynGrps( //Dyalog API for adding extra syntax highlighting groups to Preferences>Colours:
  'type comment number dollarnumber as identifier colon delimiter error'
  .split(' ').map(function(x){return{t:'acme-'+x,s:'ACME '+x,c:'.cm-apl-com.cm-acme-'+x}})
)
