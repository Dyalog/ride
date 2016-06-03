#!/usr/bin/env node
'use strict'
require('./build')
const packager=require('electron-packager'),fs=require('fs')
const rf=x=>fs.readFileSync(x,'utf8')
const v=rf('build/version').replace(/\n$/,'')
const pkg=(x,y,f)=>{
  packager(
      {dir:'.',platform:x,arch:y,out:'build/ride',overwrite:true,'download.cache':'cache',icon:'favicon.ico',
        'app-copyright':`(c) 2014-${new Date().getFullYear()} Dyalog Ltd`,
        'app-version':v,
        'build-version':v,
        'version-string.CompanyName':'Dyalog Ltd',
        'version-string.FileDescription':'Remote Integrated Development Environment for Dyalog APL',
        'version-string.OriginalFilename':'ride.exe',
        'version-string.ProductName':'RIDE',
        'version-string.InternalName':'RIDE'},
      e=>{if(e)throw e;f&&f()}
  )
}
//pkg('linux','x64',()=>pkg('win32','ia32',()=>pkg('darwin','x64')))
pkg('win32','ia32')
