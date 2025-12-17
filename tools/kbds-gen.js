#!/usr/bin/env node
//This script scrapes keyboard definitions from http://dfns.dyalog.com/n_keyboards.htm and generates ../src/kbds.js
//Mentioned in http://wiki.dyalog.bramley/index.php/New_Glyphs
//Please contact support@dyalog.com if the web page is incorrect.
'use strict';process.chdir(__dirname)
const rq=require,fs=rq('fs'),http=rq('https'),cheerio=rq('cheerio')
,err=s=>{process.stderr.write(`ERROR: ${s}\n`);process.exit(1)}
,get=(host,path,f)=>{ //f:callback
  http.get({host,path},res=>{let s='';res.setEncoding('utf8');res.on('data',x=>{s+=x}).on('end',_=>{f(s)})})
      .on('error',e=>{console.error(e);process.exit(1)})
}
,G={ //geometries http://www.abreojosensamblador.net/Productos/AOE/html/Pags_en/ApF.html
  iso: {re:RegExp('^┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬─────────┐.*\n'+
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
                   '│......│....│....│....│....│....│....│....│....│....│....│....│............│.*$'),
        sc:[[1,2,3,4,5,6,7,8,9,10,11,12,13,0], //scancodes
            [0,17,18,19,20,21,22,23,24,25,26,27,28,0],
            [0,31,32,33,34,35,36,37,38,39,40,41,42,0],
            [0,45,46,47,48,49,50,51,52,53,54,55,0]]},
  ansi:{re:RegExp('^┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬─────────┐.*\n'+
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
                   '│...........│....│....│....│....│....│....│....│....│....│....│............│.*$'),
        sc:[[1,2,3,4,5,6,7,8,9,10,11,12,13,0],
            [0,17,18,19,20,21,22,23,24,25,26,27,28,29],
            [0,31,32,33,34,35,36,37,38,39,40,41,0],
            [0,46,47,48,49,50,51,52,53,54,55,0]]}
}
,geom={_:'iso'},layouts={}
,processData=data=>{
  cheerio.load(data)('pre').text()
    .replace(/\r\n/g,'\n')
    .replace(/\nDyalog( Mac)? APL\/([a-z]{2}-[A-Z]{2}) .*\n¯+\n(?:.*\n)?(┌(?:.*\n){11}.*)/gm,(_,mac,lc,desc)=>{
      lc=lc.replace('-','_')+(mac?'_Mac':'')
      console.info('  '+lc)
      const l=layouts[lc]=[];for(let i=0;i<4;i++){l.push([]);for(let j=0;j<58;j++)l[i].push(' ')}
      let g,g1;for(g1 in G)if(desc.match(G[g1].re)){g=g1;g!=='iso'&&(geom[lc]=g);break}
      g||err('unrecognized geometry for '+lc+' layout')
      const lines=desc.split('\n')
      //r,c:coords of the key in the keyboard; x,y:coords of the symbol on the key
      for(let r=0;r<4;r++)for(let y=0;y<2;y++){
        const chunks=lines[1+y+3*r].slice(1,74).split(/[─│┌┬┐├┼┤└┴┘]+/g)
        for(let c=0;c<chunks.length;c++)if(G[g1].sc[r][c]){
          const chunk=chunks[c]
          if(chunk[1]!==' '||chunk[3]!==' ')err('bad key in '+lc+' layout -- '+JSON.stringify(chunk))
          for(let x=0;x<2;x++)l[2*x+1-y][G[g1].sc[r][c]]=chunk[2*x]
        }
      }
      for(let i=0;i<4;i++)l[i]=l[i].join('')
      console.assert(l[0].length==l[1].length&&l[0].length==l[2].length&&l[0].length==l[3].length)
    })
}
,paths=['/n_keyboards.htm','/n_kbmac.htm']
,rec=_=>{
  const u=paths.shift();if(u){console.info(u);get('dfns.dyalog.com',u,x=>{processData(x);rec()});return}
  fs.writeFileSync('../src/kbds.js',
    '//generated by tools/kbds-gen.js\n'+
    'D.kbds={\n'+
    `  geom:${JSON.stringify(geom)},\n`+
    '  layouts:{\n'+
    '    '+Object.keys(layouts).sort()
                 .map(x=>`${x}:[\n      ${layouts[x].map(JSON.stringify).join(',\n      ')}\n    ]`)
                 .join(',\n    ')+'\n'+
    '  }\n'+
    '}\n')
}
rec()
