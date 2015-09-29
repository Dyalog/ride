#!/bin/bash
(echo '∇M';tail -n+3 "$0";echo -e '∇\nM\n⎕off')|dyalog -script;exit $?

⍝ This script generates lbar.js from lbar.xml
⍝
⍝ lbar.xml can be obtained from trunk/apl/svn/tools/languagebar/out/lbar_unicode.xml
⍝ after building the interpreter

⎕io←⎕ct←0 ⋄ ⎕pw←32767
'base64'⎕cy'dfns'
json←7160⌶
esc←(,¨'&<>')⎕r'\&amp;' '\&lt;' '\&gt;'

⍝ parse xml and extract tags
x←⎕xml'UTF-8'⎕ucs 83 ¯1⎕map'lbar.xml'
tag val←↓⍉x[;1 2]
chr←⎕ucs⍎¨val/⍨tag≡¨⊂'chr'
text desc←↓(⊂'UTF-8')⎕ucs¨ base64¨↑(⊂val)/⍨¨↓'text' 'desc'∘.≡tag

m←chr≠⎕ucs 0 ⍝ grouping mask
cl←('' ' class=first' ' class=last' ' class=''first last''')[(1,2</m)+2×1,⍨2>/m] ⍝ css classes
h←⊃,¨/(⊂'<b')cl(⊂'>')(esc¨chr)(⊂'</b>')
((~m)/h)←' '

⍝ output
'D=D||{};D.lbarHTML=',json⊃,/h
'D.lbarTips={'
¯2↓⊃,/⊃,¨/(json¨,¨m/chr)(⊂':[')(json¨m/desc)','(json¨m/text)(⊂'],',⎕ucs 10)
'};'
⎕off
