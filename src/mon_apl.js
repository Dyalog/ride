{
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
      { open: '"', close: '"' },
      { open: '\'', close: '\'' },
    ],
    // indentationRules: {
    //     decreaseIndentPattern: /^((?!.*?⍝).*)?\s*[\}\]\)].*$/,
    //     increaseIndentPattern: /^((?!⍝).)*(\{[^}"'`]*|\([^)"'`]*|\[[^\]"'`]*)$/
    // }
  };
  class State {
    // hdr      are we at a location where a tradfn header can be expected?
    // a        stack of objects with the following properties
    //  t       the opening token - a keyword (without the colon) or '{', '[', '(', '∇'
    //  oi      outer indent - the indent of the opening token's line
    //  ii      inner indent - the indent of the block's body; it can be adjusted later
    //  l       line number where the opening token occurs
    // kw       current keyword
    // vars     local names in a tradfn
    // comState state of the inner mode for syntax highlighting inside comments

    constructor(hdr, a, vars) {
      this.hdr = hdr;
      this.a = a.slice();
      this.vars = vars.slice();
    }

    clone() {
      return new State(this.hdr, this.a, this.vars);
    }

    equals(other) {
      if (other === this) return true;
      if (!other || !(other instanceof State)) return false;
      if (this.hdr !== other.hdr) return false;
      if (this.a.length !== other.a.length) return false;
      if (!this.a.every((e, i) => e === other.a[i])) return false;
      if (this.vars.length !== other.vars.length) return false;
      if (!this.vars.every((e, i) => e === other.vars[i])) return false;
      return true;
    }
  }
  const letter = 'A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ';
  const name0 = RegExp(`[${letter}]`);
  const name1 = RegExp(`[${letter}\\d]*`);
  const name = `(?:[${letter}][${letter}\\d]*)`;
  const notName = RegExp(`[^${letter}0-9]+`);
  const end = '(?:⍝|$)';
  // best effort to tell the difference between a dfn vs tradfn header
  const dfnHeader = RegExp(`^\\s*${name}\\s*←\\s*\\{\\s*` +
      `(?:${end}|` +
      `[^${letter}⍝\\s]|` +
      `${name}\\s*(?:` +
        `\\}\\s*${end}|` +
        `${end}|` +
        `[^${letter}\\d\\}⍝\\s]|` +
        '\\s[^\\}⍝\\s]' +
      ')' +
    ')');

  const sysfns = ' a á af ai an arbin arbout arg at av avu base class clear cmd cr cs csv ct cy d dct df div dl dm dmx dq dr ea ec ed em en env es et ex exception export fappend favail fc fchk fcopy fcreate fdrop ferase fhist fhold fix flib fmt fnames fnums fprops fr frdac frdci fread frename freplace fresize fsize fstac fstie ftie funtie fx inp instances io json kl l lc load lock lx map mkdir mkdir ml monitor na nappend nc ncreate ndelete nerase new nexists nget ninfo nl nlock nnames nnums nparts nput nq nr nread nrename nreplace nresize ns nsi nsize ntie null nuntie nxlate off opt or path pfkey pp pr profile ps pt pw r refs rl rsi rtl s save sd se sh shadow si signal size sm sr src stack state stop svc sve svo svq svr svs syl tc tcnums tf tget this tid tkill tname tnums tpool tput trace trap treq ts tsync tz ucs ul using vfi vr wa wc wg wn ws wsid wx x xml xsi xt'.split(' ');
  // « and » prevent tolerance for extra whitespace
  // _ stands for «' '» (space as an APL character literal)
  const idioms = '⍴⍴ /⍳ /⍳⍴ ⊃¨⊂ {} {⍺} {⍵} {⍺⍵} {0} {0}¨ ,/ ⍪/ ⊃⌽ ↑⌽ ⊃⌽, ↑⌽, 0=⍴ 0=⍴⍴ 0=≡ {(↓⍺)⍳↓⍵} ↓⍉↑ ↓⍉⊃ ∧\\_= +/∧\\_= +/∧\\ {(∨\\_≠⍵)/⍵} {(+/∧\\_=⍵)↓⍵} ~∘_¨↓ {(+/∨\\_≠⌽⍵)↑¨↓⍵} ⊃∘⍴¨ ↑∘⍴¨ ,← ⍪← {⍵[⍋⍵]} {⍵[⍒⍵]} {⍵[⍋⍵;]} {⍵[⍒⍵;]} 1=≡ 1=≡, 0∊⍴ ~0∊⍴ ⊣⌿ ⊣/ ⊢⌿ ⊢/ *○ 0=⊃⍴ 0≠⊃⍴ ⌊«0.5»+ «⎕AV»⍳'.split(' ');
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
      t: '', oi: 0, ii: 0, l: 0,
    }], []),
    tokenize: (line, state) => {
      const lt = {
        tokens: [],
        endState: new State(state.hdr, state.a, state.vars),
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
            addToken(offset, 'identifier.tradfn');
            h.vars = s.split(notName);
            let ll;
            let lv = s.match(/;[^;]*/);
            while (lv) {
              offset += lv.index;
              ll = lv[0].length;
              addToken(offset, 'delimiter');
              if (ll > 1) addToken(offset + 1, 'identifier.local');
              offset += ll;
              s = s.slice(lv.index + ll);
              lv = s.match(/;[^;]*/);
            }
            offset += s.length;
          }
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
              a.push({ t: c, oi: la.oi, ii: la.ii });
              addToken(offset, 'delimiter.parenthesis'); offset += 1; break;

            case '[':
              a.push({ t: c, oi: la.oi, ii: la.ii });
              addToken(offset, 'delimiter.square'); offset += 1; break;

            case '{':
              a.push({ t: c, oi: la.ii, ii: la.ii + sw });
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

            case '⎕':
              m = sm.slice(1).match(/^[áa-z0-9]*/i);
              tkn = m && sysfns.indexOf(m[0].toLowerCase()) >= 0 ? 'predefined.sysfn' : 'invalid.sysfn';
              addToken(offset, tkn); offset += 1 + m[0].length; break;

            case '⍞': addToken(offset, 'predefined.sysfn'); offset += 1; break;
            case '#': addToken(offset, 'namespace'); offset += 1; break;
            case '⍺': case '⍵': case '∇': case ':':
              dd = dfnDepth(a);
              if (dd) {
                tkn = `identifier.dfn.${dd}`;
                addToken(offset, tkn); offset += 1; break;
              } else if (c === '∇') {
                let i = a.length - 1; while (i && a[i].t !== '∇') i -= 1;
                if (i) { a.splice(i); h.vars.length = 0; } else { a.push({ t: '∇', oi: n, ii: n + swm }); h.hdr = 1; }
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
                    a.push({ t: kw, oi: n, ii: n + sw }); ok = 1; break;

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

                  case 'else': ok = la.t === 'if' || la.t === 'select' || la.t === 'trap'; break;
                  case 'elseif': case 'andif': case 'orif': ok = la.t === 'if'; break;
                  case 'in': case 'ineach': ok = la.t === 'for'; break;
                  case 'case': case 'caselist': ok = la.t === 'select' || la.t === 'trap'; break;
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
              } else {
                offset += 1;
              }
              break;

            default:
              if (name0.test(c)) {
                m = sm.match(name1);
                // var x=sm.current(),dd=dfnDepth(a)
                const x = m[0];
                dd = dfnDepth(a);
                if (!dd && sm[x.length] === ':') {
                  addToken(offset, 'meta.label');
                  offset += 1;
                } else if (dd || (h.vars && h.vars.indexOf(x) >= 0)) {
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

  const aplCompletions = {
    triggerCharacters: ['`', ':', '.', '⎕', '(', ')', '[', ']'],
    provideCompletionItems: (model, position) => {
      const l = position.lineNumber;
      const c = position.column;
      const s = model.getLineContent(l);
      const ch = s[c - 2];
      const pk = D.prf.prefixKey();
      const pk2 = `${pk}${pk}`;
      const kind = monaco.languages.CompletionItemKind;
      // console.log(`completion triggered on: ${ch}`);
      if (s.slice(c - 3, c) === pk2) {
        return Object.keys(D.bqbqc).map((k) => {
          const v = D.bqbqc[k];
          const key = D.getBQKeyFor(v.text);
          const desc = `${v.text} ${key ? pk + key : '  '} ${pk2}${v.name}`;
          return {
            label: desc,
            detail: D.sqglDesc[key] || '',
            filterText: desc,
            sortText: key,
            kind: kind.Function,
            insertText: { value: v.text },
            range: new monaco.Range(l, c - 2, l, c),
          };
        });
      } else if (ch === pk) {
        return Object.keys(D.bq).map((k) => {
          const v = D.bq[k];
          // const desc = `${v} ${pk}${k} ${D.sqglDesc[v] || ''}  `;
          return {
            label: `${v} ${pk}${k}`,
            detail: D.sqglDesc[v] || '',
            filterText: `${v} ${pk}${k}`,
            sortText: k,
            kind: kind.Function,
            insertText: { value: v },
            range: new monaco.Range(l, c - 1, l, c),
          };
        });
      } else if (ch === ':') {
        const items = [
          'Case',
          'CaseList',
          'Continue',
          'Private',
          'Public',
          'Instance',
          'Shared',
          'Implements Constructor',
          'Implements Destructor',
          'Implements Method',
          'Implements Trigger',
        ].map(i => ({
          label: i,
          kind: kind.Text,
        }));
        /* eslint-disable no-template-curly-in-string */
        items.push(...[{
          label: 'Access',
          kind: kind.Snippet,
          insertText: { value: 'Access ${1:Public} ${2:Shared}' },
        },
        {
          label: 'Class',
          kind: kind.Snippet,
          insertText: {
            value: [
              'Class ${1:name}',
              '\t$0',
              ':EndClass',
            ].join('\n'),
          },
          documentation: 'Class script',
        },
        {
          label: 'Disposable',
          kind: kind.Snippet,
          insertText: {
            value: [
              'Disposable ${1:objects}',
              '\t$0',
              ':EndDisposable',
            ].join('\n'),
          },
          documentation: 'Disposable Statement',
        },
        {
          label: 'For',
          kind: kind.Snippet,
          insertText: {
            value: [
              'For ${1:item} :In ${2:items}',
              '\t$0',
              ':EndFor',
            ].join('\n'),
          },
          documentation: 'For loop',
        },
        {
          label: 'If Else',
          kind: kind.Snippet,
          insertText: {
            value: [
              'If ${1:condition}',
              '\t$2',
              ':Else',
              '\t$0',
              ':EndIf',
            ].join('\n'),
          },
          documentation: 'If-Else Statement',
        },
        {
          label: 'Interface',
          kind: kind.Snippet,
          insertText: {
            value: [
              'Interface ${1:name}',
              '\t$0',
              ':EndInterface',
            ].join('\n'),
          },
          documentation: 'Interface script',
        },
        {
          label: 'Namespace',
          kind: kind.Snippet,
          insertText: {
            value: [
              'Namespace ${1:name}',
              '\t$0',
              ':EndNamespace',
            ].join('\n'),
          },
          documentation: 'Namespace script',
        },
        {
          label: 'Property',
          kind: kind.Snippet,
          insertText: {
            value: [
              'Property ${1:name}',
              '\t∇ r←get args',
              '\t  r←$2',
              '\t∇',
              '\t∇ set args',
              '\t∇',
              ':EndProperty',
            ].join('\n'),
          },
          documentation: 'Property declaration',
        },
        {
          label: 'Repeat',
          kind: kind.Snippet,
          insertText: {
            value: [
              'Repeat',
              '\t$0',
              ':EndRepeat',
            ].join('\n'),
          },
          documentation: 'Repeat loop - endless',
        },
        {
          label: 'Repeat Until',
          kind: kind.Snippet,
          insertText: {
            value: [
              'Repeat',
              '\t$0',
              ':Until ${1:condition}',
            ].join('\n'),
          },
          documentation: 'Repeat loop until',
        },
        {
          label: 'Section',
          kind: kind.Snippet,
          insertText: {
            value: [
              'Section ${1:name}',
              '\t$0',
              ':EndSection',
            ].join('\n'),
          },
          documentation: 'Section block',
        },
        {
          label: 'Select',
          kind: kind.Snippet,
          insertText: {
            value: [
              'Select ${1:object}',
              ':Case ${2:value}',
              '\t$3',
              ':Else',
              '\t$0',
              ':EndSelect',
            ].join('\n'),
          },
          documentation: 'Select Statement',
        },
        {
          label: 'Trap',
          kind: kind.Snippet,
          insertText: {
            value: [
              'Trap ${1:error number}',
              '\t$1',
              ':Else',
              '\t$0',
              ':EndTrap',
            ].join('\n'),
          },
          documentation: 'Trap-Else Statement',
        },
        {
          label: 'While',
          kind: kind.Snippet,
          insertText: {
            value: [
              'While ${1:condition}',
              '\t$0',
              ':EndWhile',
            ].join('\n'),
          },
          documentation: 'While loop',
        },
        {
          label: 'With',
          kind: kind.Snippet,
          insertText: {
            value: [
              'With ${1:condition}',
              '\t$0',
              ':EndWith',
            ].join('\n'),
          },
          documentation: 'With Statement',
        },
        ]);
        /* eslint-enable no-template-curly-in-string */
        return items;
      }
      D.send('GetAutocomplete', { line: s, pos: c - 1, token: model.winid });
      const m = model;
      return new monaco.Promise((complete, error, progress) => {
        m.ac = { complete, error, progress };
      });
    },
  };
  const aplHover = {
    provideHover(model, position) {
      const m = model;
      const s = m.getLineContent(position.lineNumber);
      D.send('GetValueTip', {
        win: m.winid, line: s, pos: position.column, token: m.winid, maxWidth: 64, maxHeight: 32,
      }); // ask interpreter
      return new monaco.Promise((complete, error, progress) => {
        m.vt = {
          complete, error, progress, position,
        };
      });
    },
  };
  D.mop.then(() => {
    monaco.languages.register({
      id: 'apl',
      extensions: ['.dyapp', '.dyalog'],
    });
    monaco.languages.setTokensProvider('apl', aplTokens);
    monaco.languages.setLanguageConfiguration('apl', aplConfig);
    monaco.languages.registerCompletionItemProvider('apl', aplCompletions);
    monaco.languages.registerHoverProvider('apl', aplHover);
  });
}
