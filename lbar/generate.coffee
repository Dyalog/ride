#!/usr/bin/env coffee
# This script generates lbar.html and lbar.js from lbar.xml

fs = require 'fs'
s = fs.readFileSync "#{__dirname}/lbar.xml", 'utf8'
lbar = []
b64d = (s) -> Buffer(s, 'base64').toString()
stripTag = (s) -> s.replace /^.*<\w+>([^<]*)<\/\w+>.*$/, '$1'
he = '&': '&amp;', '<': '&lt;', '>': '&gt;'
esc = (s) -> s.replace /./g, (x) -> he[x] or x
lbarHTML = ''
lbarTips = {}
for line, i in s.split '\n'
  if line == '<LanguageBarElement>'
    chr = desc = text = ''
  else if /<chr>/.test line
    chr = String.fromCharCode stripTag line
  else if /<desc>/.test line
    desc = b64d stripTag line
  else if /<text>/.test line
    text = b64d stripTag line
  else if line == '</LanguageBarElement>'
    if chr == '\0'
      lbarHTML += ' '
    else
      lbarHTML += "<b>#{esc chr}</b>"
      lbarTips[chr] = [desc, text]
  else if line
    throw Error "error at line #{i + 1}: #{JSON.stringify line}"
fs.writeFileSync "#{__dirname}/lbar.html", lbarHTML
fs.writeFileSync "#{__dirname}/lbar.js", "var Dyalog = Dyalog || {}; Dyalog.lbarTips = #{JSON.stringify lbarTips};\n"
