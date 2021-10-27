// syntax_info.js
{
  const s = {};
  D.syntax = s;

  const end = '(?:⍝|$)';

  s.letter = 'A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ';
  s.name = `(?:[${s.letter}][${s.letter}\\d]*)`;
  s.sysfns = ' a á af ai an arbin arbout arg at av avu base c class clear cmd cr cs csv ct cy d dct df div dl dm dmx dq dr dt ea ec ed em en env es et ex exception export fappend favail fc fchk fcopy fcreate fdrop ferase fhist fhold fix flib fmt fnames fnums fprops fr frdac frdci fread frename freplace fresize fsize fstac fstie ftie funtie fx inp instances io json kl l lc load lock lx map mkdir ml monitor na nappend nc ncopy ncreate ndelete nerase new nexists nget ninfo nl nlock nmove nnames nnums nparts nput nq nr nread nrename nreplace nresize ns nsi nsize ntie null nuntie nxlate off opt or path pfkey pp pr profile ps pt pw r refs rl rsi rtl s save sd se sh shadow si signal size sm sr src stack state stop svc sve svo svq svr svs syl tc tcnums tf tget this tid tkill tname tnums tpool tput trace trap treq ts tsync tz ucs ul using vfi vr wa wc wg wn ws wsid wx x xml xsi xt'.split(' ');
  s.sysfns_classic = 'u2286 u2338 u233A u2360 u2364 u2365 u2378'.split(' ');

  s.scmd = 'classes clear cmd continue copy cs drop ed erase events fns holds intro lib load methods ns objects obs off ops pcopy props reset save sh sic si sinl tid vars wsid xload'.split(' ');

  // localisable system variables, i.e. all but ⎕dmx ⎕se
  s.sysvar = '⎕avu|⎕ct|⎕dct|⎕div|⎕fr|⎕io|⎕lx|⎕ml|⎕path|⎕pp|⎕pw|⎕rl|⎕rtl|⎕sm|⎕tname|⎕trap|⎕using|⎕wsid|⎕wx';

  // « and » prevent tolerance for extra whitespace
  // _ stands for «' '» (space as an APL character literal)
  s.idioms = '⍴⍴ /⍳ /⍳⍴ ⊃¨⊂ {} {⍺} {⍵} {⍺⍵} {0} {0}¨ ,/ ⊃⌽ ↑⌽ ⊃⌽, ↑⌽, 0=⍴ 0=⍴⍴ 0=≡ «⎕AV»⍳ ↓⍉↑ ↓⍉⊃ +/∧\\ +/^\\ +/∧\\_= +/^\\_= {(↓⍺)⍳↓⍵} ~∘_¨↓ {(+/∨\\_≠⌽⍵)↑¨↓⍵} ∧\\_= ^\\_= {(∨\\_≠⍵)/⍵} {(+/∧\\_=⍵)↓⍵} {(+/^\\_=⍵)↓⍵} 1=≡ 1=≡, 0∊⍴ ~0∊⍴ ⊃∘⍴¨ ↑∘⍴¨ ,← {⍵[⍋⍵]} {⍵[⍒⍵]} {⍵[⍋⍵;]} {⍵[⍒⍵;]} ⍪← ⍪/ *○ ⊣/ ⊢/ ⊣⌿ ⊢⌿ 0=⊃⍴ 0≠⊃⍴ ⌊«0.5»+ ≢⍴ ↓⍨← {(⊂⍋⍵)⌷⍵} {(⊂⍒⍵)⌷⍵}'.split(' ');

  s.restartBlock = '|:else|:elseif|:andif|:orif';
  s.startBlock = `:class|:disposable|:for|:hold|:if|:interface|:namespace|:property|:repeat|:section|:select|:trap|:while|:with${s.restartBlock}`;
  s.endBlock = `:end|:endclass|:enddisposable|:endfor|:endhold|:endif|:endinterface|:endnamespace|:endproperty|:endrepeat|:endsection|:endselect|:endtrap|:endwhile|:endwith|:until${D.syntax.restartBlock}`;

  function escRE(t) { return t.replace(/[()[\]{}.?+*/\\^$|]/g, (x) => `\\${x}`); }
  function escIdiom(t) {
    return t.replace(/«(.*?)»|(.)/g, (_, g1, g2) => { const g = g1 || g2; return ` *${(g === '_' ? "' '" : escRE(g))}`; }).slice(2);
  }

  D.defineSyntaxRegex = () => {
    s.idiomsRE = RegExp(`^(?:${s.idioms.sort((x, y) => y.length - x.length).map(escIdiom).join('|')})`, 'i');
    s.tradFnRE = RegExp(`(${s.name}|\\( *${s.name} +(${s.name})(?: +${s.name})? *\\)) *(?:${s.name}|\\( *${s.name}(?: +${s.name})* *\\))? *$`);
    // best effort to tell the difference between a dfn vs tradfn header
    s.dfnHeader = RegExp(`^\\s*${s.name}\\s*←\\s*\\{\\s*`
      + `(?:${end}|`
      + `[^${s.letter}⍝\\s]|`
      + `${s.name}\\s*(?:`
      + `\\}\\s*${end}|`
      + `${end}|`
      + `[^${s.letter}\\d\\}⍝\\s]|`
      + '\\s[^\\}⍝\\s]'
      + ')'
      + ')');
  };

  D.parseSyntaxInformation = (x) => {
    // If a SyntaxInfo object is returned, use it:
    // We need to process each of these to remove all of the lovely formatting that John provides.
    s.sysfns = [
      ...x.quadcons,
      ...x.quadfns,
      ...x.quadops,
      ...x.quadvars.flat(),
    ].map((t) => t.slice(1).toLowerCase());

    s.scmd = x.syscommands.map((t) => t.slice(1).toLowerCase());

    s.sysvar = x.quadvars.flat().join('|').toLowerCase();

    s.idioms = x.idioms;
    D.defineSyntaxRegex();

    // The ReplyGetSyntaxInformation message does not return these in the same format,
    // just a single 'keywords' array.
    // D.restartBlock = ;//???
    // D.startBlock = ;//???
    // D.endBlock = ;//???
  };
  D.defineSyntaxRegex();
}
