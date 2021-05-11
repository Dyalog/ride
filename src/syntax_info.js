// syntax_info.js
{
    D.syntax = {
        sysfns: ' a á af ai an arbin arbout arg at av avu base c class clear cmd cr cs csv ct cy d dct df div dl dm dmx dq dr dt ea ec ed em en env es et ex exception export fappend favail fc fchk fcopy fcreate fdrop ferase fhist fhold fix flib fmt fnames fnums fprops fr frdac frdci fread frename freplace fresize fsize fstac fstie ftie funtie fx inp instances io json kl l lc load lock lx map mkdir ml monitor na nappend nc ncopy ncreate ndelete nerase new nexists nget ninfo nl nlock nmove nnames nnums nparts nput nq nr nread nrename nreplace nresize ns nsi nsize ntie null nuntie nxlate off opt or path pfkey pp pr profile ps pt pw r refs rl rsi rtl s save sd se sh shadow si signal size sm sr src stack state stop svc sve svo svq svr svs syl tc tcnums tf tget this tid tkill tname tnums tpool tput trace trap treq ts tsync tz ucs ul using vfi vr wa wc wg wn ws wsid wx x xml xsi xt'.split(' '),
        // However, some of these are not present in the object returned by the ReplyGetSyntaxInformation message:
        //      af arg ea ec env es et fc inp l pr ps pt sve syl tf tz ul x                            
        sysfns_classic: 'u2286 u2338 u233A u2360 u2364 u2365 u2378'.split(' '),
        
        scmd: ('classes clear cmd continue copy cs drop ed erase events fns holds intro lib load methods ns objects obs off ops pcopy props reset save sh sic si sinl tid vars wsid xload').split(' '),
        
        // localisable system variables, i.e. all but ⎕dmx ⎕se
        sysvar:  '⎕avu|⎕ct|⎕dct|⎕div|⎕fr|⎕io|⎕lx|⎕ml|⎕path|⎕pp|⎕pw|⎕rl|⎕rtl|⎕sm|⎕tname|⎕trap|⎕using|⎕wsid|⎕wx',
    
        // « and » prevent tolerance for extra whitespace
        // _ stands for «' '» (space as an APL character literal)
        idioms: '⍴⍴ /⍳ /⍳⍴ ⊃¨⊂ {} {⍺} {⍵} {⍺⍵} {0} {0}¨ ,/ ⊃⌽ ↑⌽ ⊃⌽, ↑⌽, 0=⍴ 0=⍴⍴ 0=≡ «⎕AV»⍳ ↓⍉↑ ↓⍉⊃ +/∧\\ +/∧\\_= {(↓⍺)⍳↓⍵} ~∘_¨↓ {(+/∨\\_≠⌽⍵)↑¨↓⍵} ∧\\_= {(∨\\_≠⍵)/⍵} {(+/∧\\_=⍵)↓⍵} 1=≡ 1=≡, 0∊⍴ ~0∊⍴ ⊃∘⍴¨ ↑∘⍴¨ ,← {⍵[⍋⍵]} {⍵[⍒⍵]} {⍵[⍋⍵;]} {⍵[⍒⍵;]} ⍪← ⍪/ *○ ⊣/ ⊢/ ⊣⌿ ⊢⌿ 0=⊃⍴ 0≠⊃⍴ ⌊«0.5»+ ≢⍴ ↓⍨← {(⊂⍋⍵)⌷⍵} {(⊂⍒⍵)⌷⍵}'.split(' '),
    };

    D.syntax.restartBlock = '|:else|:elseif|:andif|:orif';
    D.syntax.startBlock = `:class|:disposable|:for|:hold|:if|:interface|:namespace|:property|:repeat|:section|:select|:trap|:while|:with${D.syntax.restartBlock}`;
    D.syntax.endBlock = `:end|:endclass|:enddisposable|:endfor|:endhold|:endif|:endinterface|:endnamespace|:endproperty|:endrepeat|:endsection|:endselect|:endtrap|:endwhile|:endwith|:until${D.syntax.restartBlock}`;
    
    
    function escRE(s) { return s.replace(/[()[\]{}.?+*/\\^$|]/g, x => `\\${x}`); }
    function escIdiom(s) {
        return s.replace(/«(.*?)»|(.)/g, (_, g1, g2) => { const g = g1 || g2; return ` *${(g === '_' ? "' '" : escRE(g))}`; }).slice(2);
    }
    
    D.DefineSyntaxRegex = function() {
        D.syntax.idiomsRE = RegExp(`^(?:${D.syntax.idioms.sort((x, y) => y.length - x.length).map(escIdiom).join('|')})`, 'i');
    }

    D.ParseSyntaxInformation = function(x) {
         // If a SyntaxInfo object is returned, use it:
        // We need to process each of these to remove all of the lovely formatting that John provides.
        D.syntax.sysfns = [
            ... x.quadcons, 
            ... x.quadfns, 
            ... x.quadops, 
            ... x.quadvars.flat()
        ].map(s => s.slice(1).toLowerCase());
        
        
        D.syntax.scmd = x.syscommands.map(s => s.slice(1).toLowerCase());
        
        D.syntax.sysvar = x.quadvars.flat().join('|').toLowerCase();
        
        D.syntax.idioms = x.idioms;     // The ReplyGetSyntaxInformation message already returns a list of strings formatted as required.
        D.DefineSyntaxRegex();

        //// The ReplyGetSyntaxInformation message does not return these in the same format, just a single 'keywords' array.
        //D.restartBlock = ;//???
        //D.startBlock = ;//???
        //D.endBlock = ;//???

    };
    D.DefineSyntaxRegex();
}