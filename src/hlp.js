D.modules.hlp=function(_,module){'use strict'

var p='http://help.dyalog.com/15.0/Content/',q='.htm', // prefix and suffix
h=D.hlp=module.exports={
  WELCOME:p+'MiscPages/HelpWelcome'+q,
  UCMDS:p+'UserGuide/The APL Environment/User Commands'+q,
  LANGELEMENTS:p+'Language/Introduction/Language Elements'+q
}

var u=p+'Language/System Commands/'
var a=('classes clear cmd continue copy cs drop ed erase events fns holds lib load methods ns objects obs off'+
' ops pcopy props reset save sh sic si sinl tid vars wsid xload').split(' ')
for(var i=0;i<a.length;i++)h[')'+a[i]]=u+a[i]+q

var u=p+'Language/System Functions/'
h.SYSFNS=u+'System Functions Categorised'+q
h['⍞']=u+'Character Input Output'+q
h['⎕']=u+'Evaluated Input Output'+q
h['⎕á']=h['⎕ⓐ']=u+'Underscored Alphabetic Characters'+q
var a='a ai an arbin arbout at av avu base class clear cmd cr cs ct cy d dct df div dl dm dmx dq dr ed em en ex exception export fappend favail fchk fcopy fcreate fdrop ferase fhist fhold fix flib fmt fnames fnums fprops fr frdac frdci fread frename freplace fresize fsize fstac fstie ftie funtie fx instances io kl lc load lock lx map mkdir ml monitor na nappend nc ncreate ndelete nerase new nexists nget ninfo nl nlock nnames nnums nparts nput nq nr nread nrename nreplace nresize ns nsi nsize ntie null nuntie nxlate off opt or path pfkey pp profile pw r refs rl rsi rtl s save sd se sh shadow si signal size sm sr src stack state stop svc svo svq svr svs tc tcnums tget this tid tkill tname tnums tpool tput trace trap treq ts tsync ucs using vfi vr wa wc wg wn ws wsid wx xml xsi xt'.split(' ')
for(var i=0;i<a.length;i++)h['⎕'+a[i]]=u+a[i]+q

var u=p+'Language/Control Structures/'
h.CTRLSTRUCTS=u+'Control Structures Summary'+q
var a=('access attribute class continue for goto hold if implements interface leave namespace repeat return section'+
' select signature trap using while with').split(' ')
for(var i=0;i<a.length;i++)h[':'+a[i]]=u+a[i]+q

var u=p+'Language/Symbols/'
var a=('&Ampersand ]Brackets ⊖Circle_Bar ○Circle ⌽Circle_Stile ⍪Comma_Bar ,Comma ⊥Decode_Symbol ¨Dieresis'+
' ⍣DieresisStar ⍨Dieresis_Tilde ÷Divide_Sign ⌹Domino .Dot ↓Down_Arrow ⌊Downstile ⊤Encode_Symbol ∊Epsilon'+
' ⍷Epsilon_Underbar =Equal_Sign ≡Equal_Underbar ≢Equal_Underbar_Slash !Exclamation_Mark ⍎Execute_Symbol ⍒Grade_Down'+
' ⍋Grade_Up ≥Greater_Than_Or_Equal_To_Sign >Greater_Than_Sign ⌶IBeam ⌷Index_Symbol ⍳Iota ⍤Jot_Diaresis ∘Jot ⊂Left_Shoe'+
' ⊣Left_Tack ≤Less_Than_Or_Equal_To_Sign <Less_Than_Sign ⍟Log ∧Logical_And ∨Logical_Or -Minus_Sign ⍲Nand_Symbol'+
' ⍱Nor_Symbol ≠Not_Equal_To +Plus_Sign ⌸Quad_Equal ?Question_Mark ⍴Rho →Right_Arrow ⊃Right_Shoe ⊢Right_Tack'+
' ∩Set_Intersection ∪Set_Union ⌿Slash_Bar /Slash ⍀Slope_Bar \\Slope *Star |Stile ⍕Thorn_Symbol ~Tilde ×Times_Sign'+
' ⍉Transpose ↑Up_Arrow ⌈Upstile ⍠Variant ⍬Zilde_Symbol').split(' ')
for(var i=0;i<a.length;i++)h[a[i][0]]=u+a[i].slice(1).replace(/_/g,' ')+q
var b="#⍺⍵∇'⋄⍝:;¯";for(var i=0;i<b.length;i++)h[b[i][0]]=u+'Special Symbols'+q

var u=p+'Language/Primitive Operators/' // I-beams
var a={
    8:'Inverted Table Index Of'+q,
   85:'Execute Expression'+q,
  127:'Overwrite Free Pockets'+q,
  181:'Unsqueezed Type'+q,
  200:'Syntax Colouring'+q,
  219:'Compress Vector of Short Integers'+q,
  220:'Serialise Array'+q,
  900:'Called Monadically'+q+'#Called_Monadically',
  950:'Loaded Libraries'+q+'#Loaded_Libraries',
 1111:'Number Of Threads'+q,
 1112:'Parallel Execution Threshold'+q,
 1159:'Update Function Timestamp'+q,
 2000:'Memory Manager Statistics'+q,
 2002:'Specify Workspace Available'+q,
 2010:'Update DataTable'+q,
 2011:'Read DataTable'+q,
 2015:'Create Data Binding Source'+q,
 2022:'Flush Session Caption'+q+'#Flush_Session_Caption',
 2023:'Close All Windows'+q+'#Close_all_Windows',
 2035:'Set Dyalog Pixel Type'+q+'#Set_Dyalog_Pixel_Type',
 2100:'Export To Memory'+q,
 2101:'Close .NET AppDomain'+q+'#Close_.NET_AppDomain',
 2400:'Set Workspace Save Options'+q+'#Set_Workspace_Save_Options',
 2401:'Expose Root Properties'+q+'#ExposeRootPropertiesI-Beam',
 2503:'Mark Thread as Uninterruptible'+q,
 2520:'Use Separate Thread For .NET'+q+'#Use_Separate_Thread_For_NET',
 3002:'Disable Component Checksum Validation'+q+'#Disable_Component_Checksum_Validation',
 3500:'Send Text to RIDE-embedded Browser'+q+'#SendTexttoRIDEembeddedBrowser',
 3501:'Connected to the RIDE'+q+'#Connected_RIDE',
 3502:'Enable RIDE in Run-time Interpreter'+q+'#Enable_RIDE_In_Runtime',
 4000:'Fork New Task'+q,
 4001:'Change User'+q,
 4002:'Reap Forked Tasks'+q,
 4007:'Signal Counts'+q,
 7159:'JSON Import'+q,
 7160:'JSON Export'+q,
 7161:'JSON TrueFalse'+q,
 7162:'JSON Translate Name'+q,
16807:'Random Number Generator'+q,
50100:'Line Count'+q+'#Line_Count'
}
for(var k in a)h[k+'⌶']=u+a[k]

}
