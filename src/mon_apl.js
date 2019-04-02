{
  const letter = 'A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ';
  const name0 = RegExp(`[${letter}]`);
  const name1 = RegExp(`[${letter}\\d]*`);
  const name = `(?:[${letter}][${letter}\\d]*)`;
  const notName = RegExp(`[^${letter}0-9]+`);
  // /(\w+|\(\w+ +(\w+)(?: +\w+)?\)) *(?:\w+|\( *\w+(?: +\w+)* *\))?$/
  const tradFnRE = RegExp(`(${name}|\\( *${name} +(${name})(?: +${name})? *\\)) *(?:${name}|\\( *${name}(?: +${name})* *\\))? *$`);
  const end = '(?:⍝|$)';
  const restartBlock = '|:else|:elseif|:andif|:orif';
  const startBlock = ':class|:disposable|:for|:hold|:if|:interface|:namespace'
    + `|:property|:repeat|:section|:select|:trap|:while|:with${restartBlock}`;
  const endBlock = ':end|:endclass|:enddisposable|:endfor|:endhold|:endif|:endinterface'
    + '|:endnamespace|:endproperty|:endrepeat|:endsection|:endselect|:endtrap'
    + `|:endwhile|:endwith|:until${restartBlock}`;
  D.wordSeparators = `${D.informal.slice(0, -26).map(x => x[0]).join('').replace(/⎕/g, '')}()[]{}%£#;:'"\`$^`;

  const aplConfig = {
    comments: {
      lineComment: '⍝',
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: '\'', close: '\'' },
    ],
    indentationRules: {
      decreaseIndentPattern: RegExp(`^((?!.*?⍝).*)?\\s*(${endBlock})\\b.*$`, 'i'),
      increaseIndentPattern: RegExp(`^(?:(?!⍝).)*(${startBlock})\\b.*$`, 'i'),
      unIndentedLinePattern: /^\s*⍝.*$/,
    },
    wordPattern: RegExp(name),
  };

  const aplSessionConfig = {
    comments: {
      lineComment: '⍝',
    },
    // brackets removed as it causes closing bracket to match indentation
    // of opening bracket from a previous line
    // brackets: [
    //   ['{', '}'],
    //   ['[', ']'],
    //   ['(', ')'],
    // ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: '\'', close: '\'' },
    ],
    indentationRules: {},
    wordPattern: RegExp(name),
  };

  class State {
    // hdr      are we at a location where a tradfn header can be expected?
    // a        stack of objects with the following properties
    //  t       the opening token - a keyword (without the colon) or '{', '[', '(', '∇'
    //  oi      outer indent - the indent of the opening token's line
    //  ii      inner indent - the indent of the block's body; it can be adjusted later
    //  r       range ID, sequential numbering of ranges for folding
    // kw       current keyword
    // vars     local names in a tradfn
    // rseq     last range ID
    // comState state of the inner mode for syntax highlighting inside comments

    constructor(hdr, a, vars, rseq) {
      this.hdr = hdr;
      this.a = a.slice();
      this.vars = vars.slice();
      this.rseq = rseq;
    }

    clone() {
      return new State(this.hdr, this.a, this.vars, this.rseq);
    }

    equals(other) {
      if (other === this) return true;
      if (!other || !(other instanceof State)) return false;
      if (this.hdr !== other.hdr) return false;
      if (this.rseq !== other.rseq) return false;
      if (this.a.length !== other.a.length) return false;
      if (!this.a.every((e, i) => e === other.a[i])) return false;
      if (this.vars.length !== other.vars.length) return false;
      if (!this.vars.every((e, i) => e === other.vars[i])) return false;
      return true;
    }
  }

  class SessionState {
    // l:line number, .s:start of line ignoring whitespace, .h:inner state

    constructor(l, s, h) {
      this.l = l;
      this.s = s;
      this.h = h.clone();
    }

    clone() {
      return new SessionState(this.l, this.s, this.h);
    }

    equals(other) {
      if (other === this) return true;
      if (!other || !(other instanceof SessionState)) return false;
      if (this.l !== other.l) return false;
      if (this.s !== other.s) return false;
      if (!this.h.equals(other.h)) return false;
      return true;
    }
  }

  // best effort to tell the difference between a dfn vs tradfn header
  const dfnHeader = RegExp(`^\\s*${name}\\s*←\\s*\\{\\s*`
      + `(?:${end}|`
      + `[^${letter}⍝\\s]|`
      + `${name}\\s*(?:`
        + `\\}\\s*${end}|`
        + `${end}|`
        + `[^${letter}\\d\\}⍝\\s]|`
        + '\\s[^\\}⍝\\s]'
      + ')'
    + ')');

  const sysfns = ' a á af ai an arbin arbout arg at av avu base class clear cmd cr cs csv ct cy d dct df div dl dm dmx dq dr ea ec ed em en env es et ex exception export fappend favail fc fchk fcopy fcreate fdrop ferase fhist fhold fix flib fmt fnames fnums fprops fr frdac frdci fread frename freplace fresize fsize fstac fstie ftie funtie fx inp instances io json kl l lc load lock lx map mkdir ml monitor na nappend nc ncopy ncreate ndelete nerase new nexists nget ninfo nl nlock nmove nnames nnums nparts nput nq nr nread nrename nreplace nresize ns nsi nsize ntie null nuntie nxlate off opt or path pfkey pp pr profile ps pt pw r refs rl rsi rtl s save sd se sh shadow si signal size sm sr src stack state stop svc sve svo svq svr svs syl tc tcnums tf tget this tid tkill tname tnums tpool tput trace trap treq ts tsync tz ucs ul using vfi vr wa wc wg wn ws wsid wx x xml xsi xt'.split(' ');
  // « and » prevent tolerance for extra whitespace
  // _ stands for «' '» (space as an APL character literal)
  const idioms = '⍴⍴ /⍳ /⍳⍴ ⊃¨⊂ {} {⍺} {⍵} {⍺⍵} {0} {0}¨ ,/ ⊃⌽ ↑⌽ ⊃⌽, ↑⌽, 0=⍴ 0=⍴⍴ 0=≡ «⎕AV»⍳ ↓⍉↑ ↓⍉⊃ +/∧\\ +/∧\\_= {(↓⍺)⍳↓⍵} ~∘_¨↓ {(+/∨\\_≠⌽⍵)↑¨↓⍵} ∧\\_= {(∨\\_≠⍵)/⍵} {(+/∧\\_=⍵)↓⍵} 1=≡ 1=≡, 0∊⍴ ~0∊⍴ ⊃∘⍴¨ ↑∘⍴¨ ,← {⍵[⍋⍵]} {⍵[⍒⍵]} {⍵[⍋⍵;]} {⍵[⍒⍵;]} ⍪← ⍪/ *○ ⊣/ ⊢/ ⊣⌿ ⊢⌿ 0=⊃⍴ 0≠⊃⍴ ⌊«0.5»+ ≢⍴ ↓⍨← {(⊂⍋⍵)⌷⍵} {(⊂⍒⍵)⌷⍵}'.split(' ');
  // function escRE(s) { return s.replace(/[\(\)\[\]\{\}\.\?\+\*\/\\\^\$\|]/g, x => `\\${x}`); }
  function escRE(s) { return s.replace(/[()[\]{}.?+*/\\^$|]/g, x => `\\${x}`); }
  function escIdiom(s) {
    return s.replace(/«(.*?)»|(.)/g, (_, g1, g2) => { const g = g1 || g2; return ` *${(g === '_' ? "' '" : escRE(g))}`; }).slice(2);
  }
  function dfnDepth(a) {
    let r = 0;
    for (let j = 0; j < a.length; j++) if (a[j].t === '{') r += 1; return r;
  }

  const idiomsRE = RegExp(`^(?:${idioms.sort((x, y) => y.length - x.length).map(escIdiom).join('|')})`, 'i');
  const sw = 4; // default indent unit (vim calls that "sw" for "shift width")
  const swm = 2; // indent unit for methods

  const aplTokens = {
    getInitialState: () => new State(1, [{
      t: '', oi: 0, ii: 0, r: 0,
    }], [], 0),
    tokenize: (line, state) => {
      const lt = {
        tokens: [],
        endState: new State(state.hdr, state.a, state.vars, state.rseq),
      };
      function addToken(startIndex, type) {
        const scope = `${type}.apl`;
        if (lt.tokens.length === 0 || lt.tokens[lt.tokens.length - 1].scopes !== scope) {
          lt.tokens.push({
            startIndex,
            scopes: scope,
          });
        }
      }
      let offset = 0;
      const eol = line.length;
      let sm = line;
      const h = lt.endState;
      const { a } = h;
      const n = 0;
      let tkn;
      let s;

      // localisable system variables, i.e. all but ⎕dmx ⎕se
      const sysvar = '⎕avu|⎕ct|⎕dct|⎕div|⎕fr|⎕io|⎕lx|⎕ml|⎕path|⎕pp|⎕pw|⎕rl|⎕rtl|⎕sm|⎕tname|⎕trap|⎕using|⎕wsid|⎕wx';
      const localRE = RegExp(`( *)(;)( *)(${sysvar}|${name})( *)(⍝?)`, 'i');
      const localVars = () => {
        let m;
        while ((m = sm.match(localRE)) && m.index === 0) {
          const [, s0, sc, s1, nm, s2, nb] = m;
          if (s0.length) {
            addToken(offset, 'white');
            offset += s0.length;
          }
          addToken(offset, 'delimiter.semicolon');
          offset += sc.length;
          if (s1.length) {
            addToken(offset, 'white');
            offset += s1.length;
          }
          addToken(offset, nm[0] === '⎕' ? 'predefined.sysfn.local' : 'identifier.local');
          offset += nm.length;
          h.vars.push(nm[0] === '⎕' ? nm.toLowerCase() : nm);
          if (s2.length) {
            addToken(offset, 'white');
            offset += s2.length;
          }
          if (nb.length) {
            addToken(offset, 'comment');
            offset = eol; break;
          }
          sm = line.slice(offset);
        }
        if (sm[0] === '⍝') {
          addToken(offset, 'comment');
          offset = eol;
        }
        offset !== eol && addToken(offset, 'invalid');
        offset = eol;
      };
      while (offset < eol) {
        const la = a[a.length - 1];
        if (offset === 0) {
          delete h.kw;
          if (!sm.match(/^\s*(:|∇|$)/)) { a[a.length - 1] = $.extend({ ii: n }, la); }
        }
        let m;
        let c;
        let dd;
        if (h.hdr) {
          h.hdr = 0;
          m = sm.match(/[^⍝\n\r]*/);
          [s] = m;
          if (/^\s*:/.test(s) || dfnHeader.test(s)) {
            // sm.backUp(s.length)
          } else {
            const [signature] = s.split(';');
            const [, fn, op] = signature.match(tradFnRE) || [];
            const fnop = op || fn;
            let si = -1;
            if (fnop) {
              const sigm = signature.match(RegExp(`(^|[^${letter}0-9]+)${fnop}([^${letter}0-9]+|$)`));
              si = sigm.index + sigm[1].length;
            }
            let i = 0;
            while (i < signature.length) {
              const ch = signature[i];
              switch (ch) {
                case '←':
                  addToken(offset + i, 'keyword.operator.assignment'); i += 1; break;
                case '(': case ')':
                  addToken(offset + i, 'delimiter.parenthesis'); i += 1; break;
                case '{': case '}':
                  addToken(offset + i, 'delimiter.curly'); i += 1; break;
                case ' ':
                  m = signature.slice(i).match(/^[ \t\r\n]+/);
                  addToken(offset + i, 'white');
                  i += m[0].length; break;

                default:
                  if (i === si) {
                    addToken(offset + i, 'identifier.global');
                    i += fnop.length;
                  } else {
                    m = signature.slice(i).match(name);
                    if (m) {
                      addToken(offset + i, 'identifier.local');
                      i += m[0].length;
                    } else {
                      addToken(offset + i, 'invalid');
                      i = signature.length;
                    }
                  }
              }
            }
            offset += i;
            h.vars = s.split(notName);
            h.vars.splice(h.vars.indexOf(fnop), 1);
            sm = line.slice(offset);
            localVars();
          }
        } else if (offset === 0 && RegExp(`^ *; *${name}($|[ ;])`).test(sm)) {
          localVars();
        } else if ((m = sm.match(idiomsRE))) {
          addToken(offset, 'predefined.idiom');
          offset += m[0].length;
        } else if ((m = sm.match(/^¯?(?:\d*\.)?\d+(?:e¯?\d+)?(?:j¯?(?:\d*\.)?\d+(?:e¯?\d+)?)?/i))) {
          addToken(offset, 'number');
          offset += m[0].length;
        } else if (sm[0]) {
          [c] = sm;
          switch (c) {
            case ' ':
              m = sm.match(/^[ \t\r\n]+/);
              addToken(offset, 'white');
              offset += m[0].length; break;

            case '⍝':
              addToken(offset, 'comment');
              offset = eol; break;

            case '⋄':
              delete h.kw;
              tkn = la.t !== '(' && la.t !== '[' ? 'delimiter.diamond' : 'invalid';
              addToken(offset, tkn); offset += 1; break;

            case '←': addToken(offset, 'keyword.operator.assignment'); offset += 1; break;

            case "'":
              if (sm.match(/^'(?:[^'\r\n]|'')*'/)) {
                m = sm.match(/^'(?:[^'\r\n]|'')*'/);
                addToken(offset, 'string');
                offset += m[0].length;
              } else {
                addToken(offset, 'invalid.string');
                offset = eol;
              }
              break;

            case '⍬': addToken(offset, 'predefined.zilde'); offset += 1; break;

            case '(':
              h.rseq += 1;
              a.push({
                t: c,
                oi: la.oi,
                ii: la.ii,
                r: h.rseq,
              });
              addToken(offset, 'delimiter.parenthesis'); offset += 1; break;

            case '[':
              h.rseq += 1;
              a.push({
                t: c,
                oi: la.oi,
                ii: la.ii,
                r: h.rseq,
              });
              addToken(offset, 'delimiter.square'); offset += 1; break;

            case '{':
              h.rseq += 1;
              a.push({
                t: c,
                oi: 0,
                ii: sw,
                r: h.rseq,
              });
              tkn = `identifier.dfn.${dfnDepth(a)}`;
              addToken(offset, tkn); offset += 1; break;

            case ')':
              if (la.t === '(') {
                a.pop();
                addToken(offset, 'delimiter.parenthesis');
              } else {
                addToken(offset, 'invalid.parenthesis');
              }
              offset += 1; break;

            case ']':
              if (la.t === '[') {
                a.pop();
                addToken(offset, 'delimiter.square');
              } else {
                addToken(offset, 'invalid.square');
              }
              offset += 1; break;

            case '}':
              if (la.t === '{') {
                tkn = `identifier.dfn.${dfnDepth(a)}`;
                addToken(offset, tkn);
                a.pop();
              } else {
                addToken(offset, 'invalid.dfn');
              }
              offset += 1; break;

            case ';':
              tkn = la.t === '[' ? 'delimiter.semicolon' : 'invalid';
              addToken(offset, tkn); offset += 1; break;

            case '⎕': {
              [m] = sm.slice(1).match(RegExp(`^${name}`)) || [];
              const ml = (m || '').toLowerCase();
              if (!m) tkn = 'predefined.sysfn';
              else if (h.vars && h.vars.indexOf(`⎕${ml}`) >= 0) tkn = 'predefined.sysfn.local';
              else if (sysfns.indexOf(ml) >= 0) tkn = 'predefined.sysfn';
              else tkn = 'invalid.sysfn';

              addToken(offset, tkn); offset += 1 + ml.length; break;
            }
            case '⍞': addToken(offset, 'predefined.sysfn'); offset += 1; break;
            case '#': addToken(offset, 'namespace'); offset += 1; break;
            case '⍺': case '⍵': case '∇': case ':':
              dd = dfnDepth(a);
              if (dd) {
                tkn = `identifier.dfn.${dd}`;
                addToken(offset, tkn); offset += 1; break;
              } else if (c === '∇') {
                let i = a.length - 1; while (i && a[i].t !== '∇') i -= 1;
                if (i) {
                  a.splice(i); h.vars.length = 0;
                } else {
                  h.rseq += 1;
                  a.push({
                    t: '∇',
                    oi: n,
                    ii: n + swm,
                    r: h.rseq,
                  });
                  h.hdr = 1;
                }
                addToken(offset, 'identifier.tradfn'); offset += 1; break;
              } else if (c === ':') {
                let ok = 0;
                m = sm.slice(1).match(/^\w*/);
                const kw = m ? m[0].toLowerCase() : '';
                let kw0;
                let ml = 1 + kw.length;
                switch (kw) {
                  case 'class': case 'disposable': case 'for': case 'hold': case 'if': case 'interface': case 'namespace':
                  case 'property': case 'repeat': case 'section': case 'select': case 'trap': case 'while': case 'with':
                    h.rseq += 1;
                    a.push({
                      t: kw,
                      oi: n,
                      ii: n + sw,
                      r: h.rseq,
                    });
                    ok = 1;
                    break;

                  case 'end':
                    ok = a.length > 1 && la.t !== '∇';
                    if (ok) a.pop();
                    break;

                  case 'endclass': case 'enddisposable': case 'endfor': case 'endhold': case 'endif': case 'endinterface':
                  case 'endnamespace': case 'endproperty': case 'endrepeat': case 'endsection': case 'endselect': case 'endtrap':
                  case 'endwhile': case 'endwith': case 'until':
                    if (kw === 'until') kw0 = la.t === 'repeat' ? 'repeat' : 'while';
                    else kw0 = kw.slice(3); // corresponding opening keyword
                    ok = la.t === kw0;
                    if (ok) {
                      a.pop();
                    } else {
                      let i = a.length - 1;
                      while (i && a[i].t !== kw0) i -= 1; if (i) a.splice(i);
                    }
                    break;

                  case 'else':
                    ok = la.t === 'if' || la.t === 'select' || la.t === 'trap';
                    h.rseq += 1;
                    a.push({ ...a.pop(), r: h.rseq });
                    break;
                  case 'elseif': case 'andif': case 'orif':
                    ok = la.t === 'if' || la.t === 'while';
                    h.rseq += 1;
                    a.push({ ...a.pop(), r: h.rseq });
                    break;
                  case 'in': case 'ineach': ok = la.t === 'for'; break;
                  case 'case': case 'caselist':
                    ok = la.t === 'select' || la.t === 'trap';
                    h.rseq += 1;
                    a.push({ ...a.pop(), r: h.rseq });
                    break;
                  case 'leave': case 'continue':
                    ok = 0;
                    for (let i = 0; i < a.length; i++) if (/^(?:for|repeat|while)$/.test(a[i].t)) { ok = 1; break; }
                    break;

                  case 'access': ok = la.t === 'class' || la.t === '∇';
                    m = sm.slice(1).match(/[^⋄\n\r]*/);
                    ml += m && m[0].length;
                    ok = !m || /^access(\s+(private|public|instance|shared|webmethod|overridable|override))*\s*$/i.test(m[0]);
                    break;

                  case 'base': case 'goto': case 'include': case 'return': case 'using': ok = 1; break;
                  case 'field':
                    m = sm.match(/(\s+(private|public|instance|shared|readonly)\b)+/i);
                    ml += m && m[0].length;
                    ok = 1;
                    break;
                  case 'implements':
                    m = sm.match(/\s+(\w+)/);
                    if (m) {
                      ml += m[0].length;
                      const x = m[1].toLowerCase();
                      const ys = ['constructor', 'destructor', 'method', 'trigger'];
                      for (let j = 0; j < ys.length; j++) {
                        if (x === ys[j].slice(0, x.length)) { ok = 1; break; }
                      }
                    } else {
                      ok = 1;
                    }
                    break;
                  case '': ok = h.kw === 'class'; break; // ":" is allowed after ":Class" to specify inheritance
                  default:
                }
                if (ok) {
                  h.kw = kw;
                  addToken(offset, 'keyword');
                } else {
                  delete h.kw;
                  addToken(offset, 'invalid');
                }
                offset += ml;
                if (kw === 'section' || kw === 'endsection') {
                  addToken(offset, 'white');
                  offset = eol;
                }
              } else {
                offset += 1;
              }
              break;

            default:
              if (name0.test(c)) {
                m = sm.match(name1);
                // var x=sm.current(),dd=dfnDepth(a)
                let [x] = m;
                dd = dfnDepth(a);
                if (!dd && sm[x.length] === ':') {
                  addToken(offset, 'meta.label');
                  offset += 1;
                } else if (dd || (h.vars && h.vars.includes(x))) {
                  [x] = sm.match(RegExp(`(${name}\\.?)+`));
                  addToken(offset, 'identifier.local');
                } else {
                  addToken(offset, 'identifier.global');
                }
                offset += x.length;
              } else if ((m = sm.match(/^[+\-×÷⌈⌊|⍳⍸?*⍟○!⌹<≤=≥>≠≡≢∊⍷∪∩~∧∨⍲⍱⍴,⍪⌽⊖⍉↑↓⊆⊂⊃⌷⍋⍒⊤⊥⍕⍎⊣⊢→]+/))) {
                addToken(offset, 'keyword.function');
                offset += m[0].length;
              } else if ((m = sm.match(/^[/\\⌿⍀¨⍨⌸⌶&]+/))) {
                addToken(offset, 'keyword.operator.monadic');
                offset += m[0].length;
              } else if ((m = sm.match(/^[.∘⍤⍣⍠@⌺]+/))) {
                addToken(offset, 'keyword.operator.dyadic');
                offset += m[0].length;
              } else {
                addToken(offset, 'invalid');
                offset += 1;
              }
          }
        } else {
          addToken(offset, 'invalid');
          offset = eol;
        }
        sm = line.slice(offset);
      }
      return lt;
    },
  };
  const scmd = ('classes clear cmd continue copy cs drop ed erase events fns holds intro lib load methods ns objects obs off'
    + ' ops pcopy props reset save sh sic si sinl tid vars wsid xload').split(' '); // system commands

  const aplSessionTokens = {
    getInitialState: () => new SessionState(0, 1, aplTokens.getInitialState()),
    tokenize: (line, state) => {
      const se = D.wins && D.wins[0];
      const lt = {
        tokens: [],
        endState: state.clone(),
      };
      if (!se) return lt;
      function addToken(startIndex, type) {
        const scope = `${type}.apl`;
        if (lt.tokens.length === 0 || lt.tokens[lt.tokens.length - 1].scopes !== scope) {
          lt.tokens.push({
            startIndex,
            scopes: scope,
          });
        }
      }
      let offset = 0;
      // const sol = offset === 0;
      const eol = line.length;
      const h = lt.endState;
      let m; // m:regex match object
      if (se.dirty[h.l + 1] == null) {
        offset = eol;
        h.l += 1;
        return lt;
      }
      if (h.s && (m = line.match(/^(\s*)\)(\w+).*/))) {
        if (m[1]) {
          addToken(offset, 'white');
          offset += m[1].length;
        }
        const token = scmd.indexOf(m[2].toLowerCase()) < 0 ? 'invalid.scmd' : 'predefined.scmd';
        addToken(offset, token);
        h.l += 1;
        return lt;
      }
      if (h.s && (m = line.match(/^(\s*)\].*/))) {
        if (m[1]) {
          addToken(offset, 'white');
          offset += m[1].length;
        }
        addToken(offset, 'predefined.ucmd');
        h.l += 1;
        return lt;
      }
      if (h.s) {
        h.h.hdr = 0;
      }
      const h1 = h.h.clone();
      const t = aplTokens.tokenize(line, h1);
      h.l += 1;
      lt.tokens = t.tokens.slice();
      h.h = t.endState.clone();
      return lt;
    },
  };


  const aplCompletions = pk => ({
    triggerCharacters: `1234567890:.⎕()[]${pk}`.split(''),
    provideCompletionItems: (model, position) => {
      const l = position.lineNumber;
      const c = position.column;
      const s = model.getLineContent(l);
      const ch = s[c - 2];
      const pk2 = `${pk}${pk}`;
      const kind = monaco.languages.CompletionItemKind;
      const { a } = model._tokens._tokens[l - 1]._state;
      const { t } = (a || []).slice(-1)[0] || {};
      const snippets = /^\s*:\w*$/.test(s.slice(0, c - 1)) && a && t !== '{';
      const sc = model.bqc - 1;
      if (s.slice(sc, c - 1) === pk2) {
        const suggestions = Object.keys(D.bqbqc).map((k) => {
          const v = D.bqbqc[k];
          const key = D.getBQKeyFor(v.text);
          const desc = `${v.text} ${key ? `${pk}${key} `.slice(0, 3) : '   '} ${pk2}${v.name}`;
          return {
            label: desc,
            filterText: desc,
            sortText: key,
            kind: kind.Function,
            insertText: v.text,
            range: new monaco.Range(l, c - 2, l, c),
          };
        });
        return { suggestions };
      }
      if (ch === pk) {
        const suggestions = [];
        Object.keys(D.bq).forEach((k) => {
          const v = D.bq[k];
          const desc = `${v} ${pk}${k} ${D.sqglDesc[v] || ''}  `;
          if (v === ' ') return;
          suggestions.push({
            label: desc,
            sortText: k,
            kind: kind.Function,
            insertText: v,
            range: new monaco.Range(l, c - 1, l, c),
          });
        });
        return { suggestions };
      }
      if (snippets) {
        const suggestions = [];
        const textItem = i => ({
          label: i,
          kind: kind.Snippet,
        });
        /* eslint-disable no-template-curly-in-string */
        if (t === '∇') {
          suggestions.push(...[
            'Implements Constructor',
            'Implements Destructor',
            'Implements Method',
            'Implements Trigger',
          ].map(textItem));
          suggestions.push({
            label: 'Access',
            kind: kind.Snippet,
            insertText: 'Access ${1:Private} ${2:Instance}',
          });
        }
        if (t === 'select') {
          suggestions.push(...[
            'Case',
            'CaseList',
          ].map(textItem));
        }
        if (t === 'for' || t === 'while' || t === 'repeat') {
          suggestions.push(...['Continue', 'Leave'].map(textItem));
        }
        if (t === 'class' || t === 'namesapce') {
          suggestions.push(
            {
              label: 'Class',
              kind: kind.Snippet,
              insertText: [
                'Class ${1:name}',
                '\t$0',
                ':EndClass',
              ].join('\n'),
              documentation: 'Class script',
            },
            {
              label: 'Namespace',
              kind: kind.Snippet,
              insertText: [
                'Namespace ${1:name}',
                '\t$0',
                ':EndNamespace',
              ].join('\n'),
              documentation: 'Namespace script',
            },
            {
              label: 'Interface',
              kind: kind.Snippet,
              insertText: [
                'Interface ${1:name}',
                '\t$0',
                ':EndInterface',
              ].join('\n'),
              documentation: 'Interface script',
            },
            {
              label: 'Property',
              kind: kind.Snippet,
              insertText: [
                'Property ${1:name}',
                '\t∇ r←get args',
                '\t  r←$2',
                '\t∇',
                '\t∇ set args',
                '\t∇',
                ':EndProperty',
              ].join('\n'),
              documentation: 'Property declaration',
            },
            {
              label: 'Section',
              kind: kind.Snippet,
              insertText: [
                'Section ${1:name}',
                '\t$0',
                ':EndSection',
              ].join('\n'),
              documentation: 'Section block',
            },
          );
        }
        // if (!t || t === '∇') {
        suggestions.push(
          {
            label: 'Disposable',
            kind: kind.Snippet,
            insertText: [
              'Disposable ${1:objects}',
              '\t$0',
              ':EndDisposable',
            ].join('\n'),
            documentation: 'Disposable Statement',
          },
          {
            label: 'For',
            kind: kind.Snippet,
            insertText: [
              'For ${1:item} :In ${2:items}',
              '\t$0',
              ':EndFor',
            ].join('\n'),
            documentation: 'For loop',
          },
          {
            label: 'If',
            kind: kind.Snippet,
            insertText: [
              'If ${1:condition}',
              '\t$2',
              ':EndIf',
            ].join('\n'),
            documentation: 'If Statement',
          },
          {
            label: 'If Else',
            kind: kind.Snippet,
            insertText: [
              'If ${1:condition}',
              '\t$2',
              ':Else',
              '\t$0',
              ':EndIf',
            ].join('\n'),
            documentation: 'If-Else Statement',
          },
          {
            label: 'Repeat',
            kind: kind.Snippet,
            insertText: [
              'Repeat',
              '\t$0',
              ':EndRepeat',
            ].join('\n'),
            documentation: 'Repeat loop - endless',
          },
          {
            label: 'Repeat Until',
            kind: kind.Snippet,
            insertText: [
              'Repeat',
              '\t$0',
              ':Until ${1:condition}',
            ].join('\n'),
            documentation: 'Repeat loop until',
          },
          {
            label: 'Select',
            kind: kind.Snippet,
            insertText: [
              'Select ${1:object}',
              ':Case ${2:value}',
              '\t$3',
              ':Else',
              '\t$0',
              ':EndSelect',
            ].join('\n'),
            documentation: 'Select Statement',
          },
          {
            label: 'Trap',
            kind: kind.Snippet,
            insertText: [
              'Trap ${1:error number}',
              '\t$1',
              ':Else',
              '\t$0',
              ':EndTrap',
            ].join('\n'),
            documentation: 'Trap-Else Statement',
          },
          {
            label: 'While',
            kind: kind.Snippet,
            insertText: [
              'While ${1:condition}',
              '\t$0',
              ':EndWhile',
            ].join('\n'),
            documentation: 'While loop',
          },
          {
            label: 'With',
            kind: kind.Snippet,
            insertText: [
              'With ${1:condition}',
              '\t$0',
              ':EndWith',
            ].join('\n'),
            documentation: 'With Statement',
          },
        );
        // }
        /* eslint-enable no-template-curly-in-string */
        return { suggestions };
      }
      if (D.send) {
        D.send('GetAutocomplete', { line: s, pos: c - 1, token: model.winid });
        const m = model;
        return new Promise((complete, error, progress) => {
          m.ac = {
            complete, error, progress, position,
          };
        });
      }
      return [];
    },
  });
  const aplHover = {
    provideHover(model, position) {
      if (!D.send) return [];
      const m = model;
      const p = position;
      const s = m.getLineContent(p.lineNumber);
      const c = s[p.column - 2] || ' ';
      const lbt = D.lb.tips[c];
      if (D.prf.squiggleTips() && lbt
        && !'⍺⍵'.includes(c) && !(c === '⎕' && /[áa-z]/i.test(s[p.column - 1] || ''))) {
        return {
          range: new monaco.Range(p.lineNumber, p.column - 1, p.lineNumber, p.column),
          contents: [
            lbt[0],
            { language: 'plaintext', value: lbt[1] },
          ],
        };
      }
      if (D.prf.valueTips() && /[^ ()[\]{}':;]/.test(c)) {
        D.send('GetValueTip', { // ask interpreter
          win: m.winid,
          token: m.winid,
          line: s,
          pos: p.column - 1,
          maxWidth: 200,
          maxHeight: 100,
        });
        return new Promise((complete, error, progress) => {
          setTimeout(() => { complete({}); }, 500);
          m.vt = {
            complete, error, progress, position,
          };
        });
      }
      return [];
    },
  };
  const aplFold = {
    provideFoldingRanges(model, context, token) {
      return new Promise((resolve) => {
        const ranges = [];
        const openRanges = [];
        let pa = null;
        const totLength = model.getLineCount();
        let i = 0;

        (function defineRanges() {
          const ml = model._tokens._tokens;
          const { length } = ml;
          for (i; i < length; i++) {
            const a = ((ml[i]._state || {}).a || []).slice().reverse();
            if (!pa) pa = a;
            else if (pa.length < a.length) {
              openRanges.push({
                start: i,
                kind: new monaco.languages.FoldingRangeKind(a[0].t),
              });
              pa = a;
            } else if (pa.length > a.length) {
              ranges.push({ ...openRanges.pop(), end: i });
              pa = a;
            } else if (pa[0].r !== a[0].r) {
              ranges.push({ ...openRanges.pop(), end: i - 1 });
              openRanges.push({
                start: i,
                kind: new monaco.languages.FoldingRangeKind(a[0].t),
              });
              pa = a;
            }
          }
          if (token.isCancellationRequested || length === totLength) {
            openRanges.forEach(r => ranges.push({ ...r, end: totLength }));
            resolve(ranges);
            return;
          }
          setTimeout(defineRanges, 1);
        }());
      });
    },
  };
  let icom = D.prf.indentComments(); D.prf.indentComments((x) => { icom = x; });
  const aplFormat = {
    formatLines(model, range) {
      const ml = model._tokens._tokens;
      const from = range.startLineNumber || 1;
      const to = range.endLineNumber || ml.length;
      const edits = [];
      for (let l = from; l <= to; l++) {
        const s = model.getLineContent(l);
        const [m] = s.match(/^(\s)*/);
        const a = ((ml[l - 1]._state || {}).a || []).slice().reverse();
        const [la, ...ra] = a;
        if (la && (icom || !/^\s*⍝/.test(s))) {
          let ind = ra.map(r => r.ii).reduce((r, c) => r + c, 0);
          if (dfnDepth(a)) {
            ind += /^\s*\}/.test(s) ? la.oi : la.ii;
          } else if (/^\s*∇/.test(s)) {
            const ai = a.find(x => x.t === '∇');
            ind += ai ? ai.oi : la.ii;
          } else if (/^\s*:access/i.test(s)) {
            ind += la.t === 'class' ? la.oi : la.ii;
          } else {
            ind += /^\s*:(?:end|else|andif|orif|case|until)/i.test(s) ? la.oi : la.ii;
          }
          if (ind !== m.length) {
            edits.push({
              range: new monaco.Range(l, 1, l, m.length + 1),
              text: ' '.repeat(ind),
            });
          }
        }
      }
      return edits;
    },
    provideDocumentRangeFormattingEdits(model, range, options) {
      return this.formatLines(model, range, options);
    },
    provideDocumentFormattingEdits(model, options) {
      return this.formatLines(model, {}, options);
    },
    // autoFormatTriggerCharacters: ':∇{}'.split(''),
    provideOnTypeFormattingEdits(model, position, ch, options) {
      const range = new monaco.Range(position.lineNumber, 1, position.lineNumber, 1);
      return this.formatLines(model, range, options);
    },
  };
  D.Tokenizer = aplTokens;
  D.mop.then(() => {
    const ml = monaco.languages;
    ml.register({
      id: 'apl',
      extensions: ['.dyapp', '.dyalog'],
    });
    ml.setTokensProvider('apl', aplTokens);
    ml.setLanguageConfiguration('apl', aplConfig);
    ml.registerCompletionItemProvider('apl', aplCompletions(D.prf.prefixKey()));
    D.prf.prefixKey(x => ml.registerCompletionItemProvider('apl', aplCompletions(x)));
    ml.registerHoverProvider('apl', aplHover);
    ml.registerFoldingRangeProvider('apl', aplFold);
    ml.registerDocumentFormattingEditProvider('apl', aplFormat);
    ml.registerDocumentRangeFormattingEditProvider('apl', aplFormat);
    ml.registerOnTypeFormattingEditProvider('apl', aplFormat);

    ml.register({ id: 'apl-session' });
    ml.setTokensProvider('apl-session', aplSessionTokens);
    ml.setLanguageConfiguration('apl-session', aplSessionConfig);
    ml.registerCompletionItemProvider('apl-session', aplCompletions(D.prf.prefixKey()));
    D.prf.prefixKey(x => ml.registerCompletionItemProvider('apl-session', aplCompletions(x)));
    ml.registerHoverProvider('apl-session', aplHover);
    ml.registerDocumentFormattingEditProvider('apl-session', aplFormat);
    ml.registerDocumentRangeFormattingEditProvider('apl-session', aplFormat);
    ml.registerOnTypeFormattingEditProvider('apl-session', aplFormat);
  });
}
