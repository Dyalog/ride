#!/usr/bin/env coffee

# Pipe an lbar.xml into this program and it will output the content of lbar.js

s = ''
process.stdin.setEncoding 'utf8'
process.stdin.resume()
process.stdin.on 'data', (data) -> s += data
process.stdin.on 'end', ->
  r = {}
  b64d = (s) -> Buffer(s, 'base64').toString()
  stripTag = (s) -> s.replace /^.*<\w+>([^<]*)<\/\w+>.*$/, '$1'
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
      r[chr] = [desc, text]
    else if line
      throw Error "error at line #{i + 1}: #{JSON.stringify line}"
  console.info "var help = #{JSON.stringify r};"
