// Parse command line args
// This is a replacement for the now abandoned https://github.com/harthur/nomnom
// It contains only the functionality we need instead of nomnom's 500+ lines of code.
this.options=function(h){return{parse:function(a){ // h:option descriptions, a:argv
  a=a||process.argv;var r={_:[]},abbr={}
  for(var k in h){r[k]=h[k]['default'];h[k].abbr&&(abbr[h[k].abbr]=k)}
  function usage(){
    var s='Usage: '+a[0]+' [OPTION]...\n\n'
    for(var k in h){
      var mv=h[k].metavar?' '+h[k].metavar:''
      s+='  '+(h[k].abbr?'-'+h[k].abbr+mv+',':'   ')+' --'+k+mv+Array(Math.max(2,16-(k+mv).length)).join(' ')
        +(h[k].help||'')+(h[k].flag||h[k]['default']==null?'':'  ['+h[k]['default']+']')+'\n'
    }
    process.stderr.write(s)
  }
  function err(s){process.stderr.write(s+'\n\n');usage();process.exit(1)}
  for(var i=0;i<a.length;i++){var s=a[i]
    if(s==='-h'&&!abbr.h||s==='--help'&&!h.help){usage();process.exit(0)}
    else if(s[0]!=='-'||s==='-')r._.push(s)
    else if(s[1]!=='-'){
      for(var j=1;j<s.length;j++){
        var k=abbr[s[j]]||err('unrecognized option '+JSON.stringify(s))
        if(h[k].flag){r[k]=1}else{r[k]=s.slice(j+1);break}
      }
    }else{
      var j=s.indexOf('='), k=j<0?s.slice(2):s.slice(2,j), v=j<0?null:s.slice(j+1), inv=k.slice(0,3)==='no-'
      if(!h[k]||inv&&!h[k].flag)err('unrecognized option '+JSON.stringify(s))
      r[k]=h[k].flag?(v===null?!inv:err('option '+JSON.stringify('--'+k)+' doesn\'t allow an argument'))
                    :v!==null?v:++i<a.length?a[i]:err('option requires an argument '+JSON.stringify(k))
    }
  }
  return r
}}}
