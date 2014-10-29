#!/usr/bin/env coffee

module.exports = ->
  console.info 'building...'
  fs          = require 'fs'
  coffee      = require 'coffee-script'
  execSync    = require 'exec-sync'
  express     = require 'express'
  uglify      = require 'uglify-js'
  cleanCSS    = new (require 'clean-css')

  sh = (s) -> console.info execSync s

  jsFiles = [
    'node_modules/socket.io/node_modules/socket.io-client/socket.io.js'
    'node_modules/jquery/dist/cdn/jquery-2.1.1.min.js'
    'node_modules/codemirror/lib/codemirror.js'
    'node_modules/codemirror/mode/apl/apl.js'
    'node_modules/codemirror/addon/hint/show-hint.js'
    'node_modules/codemirror/addon/edit/matchbrackets.js'
    'node_modules/codemirror/addon/edit/closebrackets.js'
    'node_modules/jquery-ui/core.js'
    'node_modules/jquery-ui/widget.js'
    'node_modules/jquery-ui/mouse.js'
    'node_modules/jquery-ui/position.js'
    'node_modules/jquery-ui/draggable.js'
    'node_modules/jquery-ui/droppable.js'
    'node_modules/jquery-ui/resizable.js'
    'node_modules/jquery-ui/button.js'
    'node_modules/jquery-ui/dialog.js'
    'node_modules/jquery-ui/effect.js'
    'node_modules/jquery-ui/effect-slide.js'
    'jquery.layout.js'
    'lbar/lbar.js'
    'client/keymap.coffee'
    'client/session.coffee'
    'client/editor.coffee'
    'client/init.coffee'
    'docs/help-urls.coffee'
  ]
  cssFiles = [
    'node_modules/codemirror/lib/codemirror.css'
    'style.css'
  ]

  log = (s) -> console.info s

  sh 'mkdir -p cache static'

  html = fs.readFileSync('index.html', 'utf8')
    .replace(/<!--\s*include\s+(\S+)\s*-->/g, (_, f) -> fs.readFileSync f, 'utf8')
    .replace /<!--\s*css\s*-->/g, -> cleanCSS.minify cssFiles.map((f) -> fs.readFileSync f, 'utf8').join '\n'
  fs.writeFileSync 'static/index.html', html

  js = ''
  for f in jsFiles
    f1 = "cache/#{f.replace /\//g, '_'}.uglified"
    if !fs.existsSync(f1) || fs.statSync(f).mtime > fs.statSync(f1).mtime
      ib = fs.readFileSync f # input buffer
      sizes = [ib.length]
      s = ib + ''
      if /\.coffee$/.test f
        s = coffee.compile s, bare: 1
        sizes.push Buffer(s).length
      if !/\.min\.js$/.test f
        s1 = uglify.minify(s.replace(/^(?:.*require.*;\n)*/, ''), fromString: true, mangle: true).code
        ob = Buffer s1 # output buffer
        sizes.push ob.length
        try fs.writeFileSync f1, ob catch # ignore errors
        s = s1
      if sizes.length > 1 then log "  #{f} #{sizes.join '→'} bytes"
    else
      s = fs.readFileSync f1, 'utf8'
    js += s + '\n'
  fs.writeFileSync 'static/D.js', js

  sh 'cp -uvr apl385.ttf favicon.ico docs/help docs/help.css docs/help.js static/'

if require.main == module then module.exports()
