#!/usr/bin/env coffee

# Generate lbar.js from lbar.xml

fs = require 'fs'
b64d = (s) -> Buffer(s, 'base64').toString()
stripTag = (s) -> s.replace /^.*<\w+>([^<]*)<\/\w+>.*$/, '\$1'
esc = (s) -> s.replace /./g, (x) -> {'&': '&amp;', '<': '&lt;', '>': '&gt;'}[x] or x
lbarHTML = ''; lbarTips = []; isFirst = 1
for line, i in fs.readFileSync('lbar.xml', 'utf8').split '\n'
  if line == '<LanguageBarElement>' then chr = desc = text = ''
  else if /<chr>/.test line then chr = String.fromCharCode stripTag line
  else if /<desc>/.test line then desc = b64d stripTag line
  else if /<text>/.test line then text = b64d stripTag line
  else if line == '</LanguageBarElement>'
    if chr == '\0' then lbarHTML += ' '; isFirst = 1
    else
      lbarHTML += "<b#{['', " class='first'"][isFirst]}>#{esc chr}</b>"; isFirst = 0
      lbarTips.push "#{JSON.stringify chr}: [#{JSON.stringify desc}, #{JSON.stringify text}]"
  else if line then throw Error "error at line #{i + 1}: #{JSON.stringify line}"
fs.writeFileSync 'lbar.js', """
  var D=D||{};
  D.lbarHTML = #{JSON.stringify lbarHTML};
  D.lbarTips = {
    #{lbarTips.join ',\n  '}
  };\n
"""
