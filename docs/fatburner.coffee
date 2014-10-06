#!/usr/bin/env coffee
# invoked from update.sh

fs = require 'fs'

simplifyFilename = (s) ->
  s.toLowerCase()
   .replace(/[ _]/g, '-')
   .replace(/\.htm$/, '.html')
   .replace(/\bcharacter-input-output\b/g,          'char-io')
   .replace(/\bevaluated-input-output\b/g,          'eval-io')
   .replace(/\bintroduction\b/g,                    'intro')
   .replace(/\blanguage\b/g,                        'lang')
   .replace(/\bmiscellaneous\b/g,                   'misc')
   .replace(/\bobject-oriented-programming\b/g,     'oop')
   .replace(/\bprimitive-functions\b/g,             'primfns')
   .replace(/\bprimitive-operators\b/g,             'primops')
   .replace(/\bproperties\b/g,                      'props')
   .replace(/\bsystem-commands\b/g,                 'syscmds')
   .replace(/\bsystem-functions\b/g,                'sysfns')
   .replace(/\bwindows-presentation-foundation\b/g, 'wpf')
   .replace(/dieresis/g,                            'diaeresis')

repeat = (s, n) -> Array(n + 1).join s

console.info 'Simplifying file names...'
do walk = (d = 'help') ->
  for f in fs.readdirSync d
    f1 = simplifyFilename f
    df1 = d + '/' + f1
    if f != f1 then fs.renameSync d + '/' + f, df1
    stat = fs.statSync df1
    if stat && stat.isDirectory() then walk df1
  return

console.info 'Removing junk from html files...'
totalHTMLSize = 0
do walk = (d = 'help', depth = 0) ->
  for f in fs.readdirSync d
    df = d + '/' + f
    stat = fs.statSync df
    if stat && stat.isDirectory()
      walk df, depth + 1
    else if /\.html$/.test df
      s = (s0 = fs.readFileSync df, 'utf8')
        .replace(/\r\n/g, '\n')
        .replace(/^[^]*<body>([^]*)<\/body>[^]*$/, '$1')
        .replace(/>[\n ]+</g, '>\n<')
        .replace(/&#(\d+);/g, (g, g1) -> r = String.fromCharCode +g1; if r in ['&', '"', '<'] then g else r)
        .replace(/<[^>]+>/g, (u) ->
          u.replace(/\ (href|src)="([^"#]*)/g, (_, g1, g2) -> " #{g1}=\"#{simplifyFilename g2}")
           .replace(/\ class="(Example|Normal|NormalPlain|APLCode|APLCodeNoIndent|leftPlain|NewPage)"/g, '')
           .replace(/\ (xml:space|MadCap:\w+|xrefformat)="[^"]*"/g, '')
           .replace(/\ target="_parent"/g, '')
           .replace(/\ (target|alt|title)=""/g, '')
           .replace(/\ xmlns:MadCap="http:\/\/www.madcapsoftware.com\/Schemas\/MadCap.xsd"/gi, '')
        )
        .replace(/\ *<p class="MCWebHelpFramesetLink .*\n.*\n/ig, '')
        .replace(/<\/img>\n*/g, '')
        .replace(/<col\b[^>\/]*\/>\n*/g, '')
        .replace(/<span class="Bold">([^]*?)<\/span>/g, '<b>$1</b>')
        .replace(/<span class="Dyalog">([^]*?)<\/span>/g, '<tt>$1</tt>')
        .replace(/<td class="Dyalog">([^]*?)<\/td>/g, '<td><tt>$1</tt></td>')
        .replace(/<p class="pagebreakafter">[ \n\xa0]*<\/p>\n/g, '')
        .replace(/<a name="kanchor\d+"><\/a>/g, '')
        .replace(/<script type="text\/javascript" src="[\.\/]*skinsupport\/madcapbodyend.js">[^]*$/i, '')
        .replace(/<madcapkeyword[^>\/]*\/>/ig, '')
        .replace(/<madcapkeyword[^>\/]*>[^<]*<\/madcapkeyword>/ig, '')
        .replace(/<MadCap:conditionalText>(?:[^]*?)<\/MadCap:conditionalText>/g, ' ')
        .replace(/([Dd])ieresis/, '$1iaeresis')
        .replace(///
          <div(?:\ class="(?:h3|h3NewPage|NewPage)")?>\n*
          <table\ class="h3">\n*
          <tr>\n*
          (?:<\/tr>\n*<tr>\n*)*
          <td\ class="h3Left">\n*(?:<a\ name="[^"]*">([^<]*)</a>)?([^<]*)</td>\n*
          ((?:<td\ class="h3Right(?:GUI)?">[^]*?</td>\n*)*)
          </tr>\n*
          </table>([^]*?)</div>
        ///g, (_, name1 = '', name2 = '', right = '', extra = '') ->
          right = right.replace(/<[^>]+>/g, ' ').trim()
          if right then "<h2><tt>#{right}</tt>#{name1.trim()}#{name2}</h2>#{extra}"
          else "<h2>#{name1}#{name2}</h2>#{extra}"
        )
        .replace(/>[\n ]+</g, '><')
        .replace(/^[\n ]+|[\n ]+$/g, '')
      totalHTMLSize += s.length
      if s0 != s then fs.writeFileSync df, """
        <!doctype html>
        <html>
        <head><meta charset="utf-8"><title></title><link rel="stylesheet" href="..#{repeat '/..', depth}/help.css"></head>
        <body>#{s}</body>
        </html>
      """
  return

console.info 'Total HTML size: ' + totalHTMLSize
