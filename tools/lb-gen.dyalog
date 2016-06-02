#!/bin/bash
(echo '∇M';tail -n+3 "$0";echo -e '∇\nM\n⎕off')|dyalog -script;exit $?

⍝ This script takes an lbar_unicode.xml as input and
⍝ generates JavaScript constants with information about the language bar.

⍝ Usage from bash:
⍝   # fetch the latest .xml
⍝   svn cat http://svn.dyalog.bramley/svn/dyalog/trunk/apl/svn/tools/languagebar/out/lbar_unicode.xml >lb.xml
⍝   # generate the .js
⍝   ./lb-gen.dyalog >../client/lb.js

⎕io←⎕ct←0 ⋄ ⎕pw←32767 ⋄ json←7160⌶ ⋄ 'base64'⎕cy'dfns'
esc←(,¨'&<>')⎕r'\&amp;' '\&lt;' '\&gt;'
rmTrailingWS←' +$'⎕r''

⍝ parse xml and extract tags
x←⎕xml'UTF-8'⎕ucs 83 ¯1⎕map'lb.xml'
tag val←↓⍉x[;1 2]
chr←⎕ucs⍎¨val/⍨tag≡¨⊂'chr'
text desc←↓(⊂'UTF-8')⎕ucs¨ base64¨↑(⊂val)/⍨¨↓'text' 'desc'∘.≡tag

m←chr≠⎕ucs 0 ⍝ grouping mask
cl←('' ' class=first' ' class=last' ' class=''first last''')[(1,2</m)+2×1,⍨2>/m] ⍝ css classes
h←⊃,¨/(⊂'<b')cl(⊂'>')(esc¨chr)(⊂'</b>')
((~m)/h)←' '

⍝ output
'// generated code, do not edit'
'D.modules.lb=function(){'
'this.html=',json⊃,/h
'this.tips={'
¯2↓⊃,/⊃,¨/(json¨,¨m/chr)(⊂':[')(json¨m/desc)','(json¨rmTrailingWS¨m/text)(⊂'],',⎕ucs 10)
'}'
'}'
⎕off
