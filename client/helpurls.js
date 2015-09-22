var p='http://help.dyalog.com/14.0/Content/',q='.htm', // prefix and suffix
h=D.helpurls=module.exports={
  WELCOME:p+'MiscPages/HelpWelcome'+q,
  UCMDS:p+'UserGuide/The APL Environment/User Commands'+q,
  LANGELEMENTS:p+'Language/Introduction/Language Elements'+q
}

var u=p+'Language/System Commands/'
var a=('classes clear cmd continue copy cs drop ed erase events fns holds intro lib load methods ns objects obs off'+
' ops pcopy props reset save sh sic si sinl tid vars wsid xload').split(' ')
for(var i=0;i<a.length;i++)h[')'+a[i]]=u+a[i]+q

var u=p+'Language/System Functions/'
h.SYSFNS=u+'System Functions Categorised'+q
h['⍞']=u+'Character Input Output'+q
h['⎕']=u+'Evaluated Input Output'+q
h['⎕á']=h['⎕ⓐ']=u+'Underscored Alphabetic Characters'+q
var a=('a ai an arbin arbout at av avu base class clear cmd cr cs ct cy dct df div d dl dm dmx dq dr ed em en'+
' exception ex export fappend favail fchk fcopy fcreate fdrop ferase fhist fhold fix flib fmt fnames fnums fprops'+
' frdac frdci fread frename freplace fresize fr fsize fstac fstie ftie funtie fx instances io kl lc load lock lx map'+
' ml monitor na nappend nc ncreate nerase new nl nlock nnames nnums nq nread nrename nreplace nresize nr nsi nsize ns'+
' ntie null nuntie nxlate off opt or path pfkey pp profile pw refs r rl rsi rtl save sd se shadow sh signal si size s'+
' sm src sr stack state stop svc svo svq svr svs tc tcnums tget this tid tkill tname tnums tpool tput trace trap treq'+
' ts tsync ucs using vfi vr wa wc wg wn wsid ws wx xml xsi xt').split(' ')
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
' ⍨Transpose ↑Up_Arrow ⌈Upstile ⍠Variant ⍬Zilde_Symbol').split(' ')
for(var i=0;i<a.length;i++)h[a[i][0]]=u+a[i].slice(1).replace(/_/g,' ')+q
var b="#⍺⍵∇'⋄⍝:;¯";for(var i=0;i<b.length;i++)h[b[i][0]]=u+'Special Symbols'+q
