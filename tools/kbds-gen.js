#!/usr/bin/env node
// This script scrapes keyboard definitions from http://dfns.dyalog.com/n_keyboards.htm
// and generates ../client/kbds.js
var fs=require('fs'),http=require('http'),cheerio=require('cheerio')
process.chdir(__dirname)
function log(s){process.stderr.write(s+'\n')}
function err(s){log('ERROR: '+s);process.exit(1)}
function get(host,path,f){ // f:callback
  http.get({host:host,path:path},function(res){
    var s='';res.setEncoding('utf8');res.on('data',function(x){s+=x}).on('end',function(){f(s)})
  }).on('error',function(e){console.error(e);process.exit(1)})
}
var G={ // geometries http://www.abreojosensamblador.net/Productos/AOE/html/Pags_en/ApF.html
  iso:{
    re:RegExp('^'+
      '┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬─────────┐.*\n'+
      '│....│....│....│....│....│....│....│....│....│....│....│....│....│.........│.*\n'+
      '│....│....│....│....│....│....│....│....│....│....│....│....│....│.........│.*\n'+
      '├────┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬──────┤.*\n'+
      '│.......│....│....│....│....│....│....│....│....│....│....│....│....│......│.*\n'+
      '│.......│....│....│....│....│....│....│....│....│....│....│....│....│......│.*\n'+
      '├───────┴┬───┴┬───┴┬───┴┬───┴┬───┴┬───┴┬───┴┬───┴┬───┴┬───┴┬───┴┬───┴┐.....│.*\n'+
      '│........│....│....│....│....│....│....│....│....│....│....│....│....│.....│.*\n'+
      '│........│....│....│....│....│....│....│....│....│....│....│....│....│.....│.*\n'+
      '├──────┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴────┴─────┤.*\n'+
      '│......│....│....│....│....│....│....│....│....│....│....│....│............│.*\n'+
      '│......│....│....│....│....│....│....│....│....│....│....│....│............│.*'+
    '$'),
    sc:[
      [1,2,3,4,5,6,7,8,9,10,11,12,13,0],
      [0,17,18,19,20,21,22,23,24,25,26,27,28,0],
      [0,31,32,33,34,35,36,37,38,39,40,41,42,0],
      [0,45,46,47,48,49,50,51,52,53,54,55,0]
    ]
  },
  ansi:{
    re:RegExp('^'+
      '┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬─────────┐.*\n'+
      '│....│....│....│....│....│....│....│....│....│....│....│....│....│.........│.*\n'+
      '│....│....│....│....│....│....│....│....│....│....│....│....│....│.........│.*\n'+
      '├────┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬──────┤.*\n'+
      '│.......│....│....│....│....│....│....│....│....│....│....│....│....│......│.*\n'+
      '│.......│....│....│....│....│....│....│....│....│....│....│....│....│......│.*\n'+
      '├───────┴┬───┴┬───┴┬───┴┬───┴┬───┴┬───┴┬───┴┬───┴┬───┴┬───┴┬───┴┬───┴──────┤.*\n'+
      '│........│....│....│....│....│....│....│....│....│....│....│....│..........│.*\n'+
      '│........│....│....│....│....│....│....│....│....│....│....│....│..........│.*\n'+
      '├────────┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──┬─┴──────────┤.*\n'+
      '│...........│....│....│....│....│....│....│....│....│....│....│............│.*\n'+
      '│...........│....│....│....│....│....│....│....│....│....│....│............│.*'+
    '$'),
    sc:[
      [1,2,3,4,5,6,7,8,9,10,11,12,13,0],
      [0,17,18,19,20,21,22,23,24,25,26,27,28,29],
      [0,31,32,33,34,35,36,37,38,39,40,41,0],
      [0,46,47,48,49,50,51,52,53,54,55,0]
    ]
  }
}

var geom={_:'iso'},layouts={}
function processData(data){
  cheerio.load(data)('pre').text()
    .replace(/\r\n/g,'\n')
    .replace(/\nDyalog( Mac)? APL\/([a-z]{2}-[A-Z]{2}) .*\n¯+\n(┌(?:.*\n){11}.*)/gm,function(_,mac,lc,desc){
      lc=lc.replace('-','_')+(mac?'_Mac':'')
      console.info('  '+lc)
      var l=layouts[lc]=[];for(var i=0;i<4;i++){l.push([]);for(var j=0;j<58;j++)l[i].push(' ')}
      var g;for(var g1 in G)if(desc.match(G[g1].re)){g=g1;g!=='iso'&&(geom[lc]=g);break}
      g||err('unrecognized geometry for '+lc+' layout')
      var lines=desc.split('\n')
      // r,c: coords of the key in the keyboard    x,y: coords of the symbol on the key
      for(var r=0;r<4;r++)for(var y=0;y<2;y++){
        var chunks=lines[1+y+3*r].slice(1,74).split(/[─│┌┬┐├┼┤└┴┘]+/g)
        for(var c=0;c<chunks.length;c++)if(G[g1].sc[r][c]){
          var chunk=chunks[c]
          if(chunk[1]!==' '||chunk[3]!==' ')err('bad key in '+lc+' layout -- '+JSON.stringify(chunk))
          for(var x=0;x<2;x++)l[2*x+1-y][G[g1].sc[r][c]]=chunk[2*x]
        }
      }
      for(var i=0;i<4;i++)l[i]=l[i].join('')
      console.assert(l[0].length==l[1].length&&l[0].length==l[2].length&&l[0].length==l[3].length)
    })
}

var paths=['/n_keyboards.htm','/n_kbmac.htm']
var rec=(function(){
  var u=paths.shift();if(u){console.info(u);get('dfns.dyalog.com',u,function(data){processData(data);rec()});return}
  fs.writeFileSync('../client/kbds.js',
    '// generated code, do not edit\n'+
    'this.geom='+JSON.stringify(geom)+'\n'+
    'this.layouts={\n'+
    '  '+Object.keys(layouts).sort().map(function(lc){
           var l=layouts[lc];return lc+':[\n   '+l.map(JSON.stringify).join(',\n   ')+'\n  ]'
         }).join(',\n  ')+'\n'+
    '};\n'
  )
})
rec()
