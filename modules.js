D.modules={}
D.load=function(x){
  var m=D.modules[x.slice(2)];if(x.slice(0,2)!=='./'||!m)throw Error('Cannot find module '+JSON.stringify(x))
  return m.exports=m.exports||m.apply(m.exports={},[D.load,m])||m.exports
}
