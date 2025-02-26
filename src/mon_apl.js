{
  const name0 = RegExp(`[${D.syntax.letter}]`);
  const name1 = RegExp(`[${D.syntax.letter}\\d]*`);
  const notName = RegExp(`[^${D.syntax.letter}\\d]+`);

  D.wordSeparators = `${D.informal.slice(0, -26).map((x) => x[0]).join('').replace(/[⎕∆⍙]/g, '')}()[]{}%£#;:'"\`$^`;

  const aplConfig = () => ({
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
      decreaseIndentPattern: RegExp(`^((?!.*?⍝).*)?\\s*(${D.syntax.endBlock})\\b.*$`, 'i'),
      increaseIndentPattern: RegExp(`^(?:(?!⍝).)*(${D.syntax.startBlock})\\b.*$`, 'i'),
      unIndentedLinePattern: /^\s*⍝.*$/,
    },
    wordPattern: RegExp(D.syntax.name),
  });

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
    wordPattern: RegExp(D.syntax.name),
  };
  /* eslint max-classes-per-file: 0 */
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

  const dfnDepth = (a) => {
    let r = 0;
    for (let j = 0; j < a.length; j++) if (a[j].t === '{') r += 1; return r;
  };

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

      const localRE = RegExp(`( *)(;)( *)(${D.syntax.sysvar}|${D.syntax.name})( *)(⍝?)`, 'i');
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
        let isAplan;
        if (h.hdr) {
          h.hdr = 0;
          m = sm.match(/[^⍝\n\r]*/);
          [s] = m;
          if (/^\s*:/.test(s) || D.syntax.dfnHeader.test(s)) {
            // sm.backUp(s.length)
          } else {
            const [signature] = s.split(';');
            const [, fn, op] = signature.match(D.syntax.tradFnRE) || [];
            const fnop = op || fn;
            let si = -1;
            let i = 0;
            if (fnop) {
              const sigm = signature.match(RegExp(`(^|[^${D.syntax.letter}0-9]+)${fnop}([^${D.syntax.letter}0-9]+|$)`));
              if (sigm) {
                si = sigm.index + sigm[1].length;
              } else {
                addToken(offset, 'invalid');
                i = signature.length;
              }
            }
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
                    m = signature.slice(i).match(D.syntax.name);
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
        } else if (offset === 0 && RegExp(`^ *; *${D.syntax.name}($|[ ;])`).test(sm)) {
          localVars();
        } else if ((m = sm.match(D.syntax.idiomsRE))) {
          addToken(offset, 'predefined.idiom');
          offset += m[0].length;
        } else if ((m = sm.match(/^¯?(?:\d*\.)?\d+(?:e¯?\d+)?(?:j¯?(?:\d*\.)?\d+(?:e¯?\d+)?)?/i))) {
          addToken(offset, 'number');
          offset += m[0].length;
        } else if (sm[0]) {
          [c] = sm;
          switch (c) {
            case ' ': case '\t': case '\r': case '\n':
              m = sm.match(/^[ \t\r\n]+/);
              addToken(offset, 'white');
              offset += m[0].length; break;

            case '⍝':
              addToken(offset, 'comment');
              offset = eol; break;

            case '⋄':
              delete h.kw;
              tkn = 'delimiter.diamond';
              tkn = la.isAplan ? 'delimiter.aplan' : 'delimiter.diamond';
              addToken(offset, tkn); offset += 1; break;

            case '←': addToken(offset, 'keyword.operator.assignment'); offset += 1; break;

            case "'":
              if ((m = sm.match(/^'(?:[^'\r\n]|'')*'/))) {
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
              isAplan = /^\(\s*(?:(?=.*⋄).*|(?:[A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ][A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ\d]*:.*)|\s*\)?)\s*$/.test(sm);
              a.push({
                t: c,
                oi: la.oi,
                ii: la.ii,
                r: h.rseq,
                isAplan,
              });
              addToken(offset, isAplan ? 'delimiter.aplan' : 'delimiter.parenthesis'); offset += 1; break;

            case '[':
              h.rseq += 1;
              isAplan = /^\[\s*(?:(?=.*⋄).*|[^\]]*)\s*$/.test(sm);
              a.push({
                t: c,
                oi: la.oi,
                ii: la.ii,
                r: h.rseq,
                isAplan,
              });
              addToken(offset, isAplan ? 'delimiter.aplan' : 'delimiter.square'); offset += 1; break;

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
                addToken(offset, la.isAplan ? 'delimiter.aplan' : 'delimiter.parenthesis');
              } else {
                addToken(offset, 'invalid.parenthesis');
              }
              offset += 1; break;

            case ']':
              if (la.t === '[') {
                a.pop();
                addToken(offset, la.isAplan ? 'delimiter.aplan' : 'delimiter.square');
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
              [m] = sm.slice(1).match(RegExp(`^${D.syntax.name}`)) || [];
              const ml = (m || '').toLowerCase();
              if (!m) tkn = 'predefined.sysfn';
              else if (h.vars && h.vars.includes(`⎕${ml}`)) tkn = 'predefined.sysfn.local';
              else if (D.syntax.sysfns.includes(ml)) tkn = 'predefined.sysfn';
              else if (D.isClassic && D.syntax.sysfns_classic.includes(ml)) tkn = 'predefined.sysfn';
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
                let [x] = m;
                dd = dfnDepth(a);
                if (!dd && /\s*:/.test(sm.slice(x.length))) {
                  addToken(offset, la.isAplan ? 'identifier.local.aplan' : 'meta.label');
                  offset += 1;
                } else if (dd || (h.vars && h.vars.includes(x))) {
                  [x] = sm.match(RegExp(`(${D.syntax.name}\\.?)+`));
                  addToken(offset, 'identifier.local');
                } else {
                  addToken(offset, 'identifier.global');
                }
                offset += x.length;
              } else if ((m = sm.match(/^[+\-×÷⌈⌊|⍳⍸?*⍟○!⌹<≤=≥>≠≡≢∊⍷∪∩~∧∨⍲⍱⍴,⍪⌽⊖⍉↑↓⊆⊂⊃⌷⍋⍒⊤⊥⍕⍎⊣⊢→^∣]+/))) {
                addToken(offset, 'keyword.function');
                offset += m[0].length;
              } else if ((m = sm.match(/^[/\\⌿⍀¨⍨⌸⌶&]+/))) {
                addToken(offset, 'keyword.operator.monadic');
                offset += m[0].length;
              } else if ((m = sm.match(/^[.∘⍛⍤⍥⍣⍠@⌺]+/))) {
                addToken(offset, 'keyword.operator.dyadic');
                offset += m[0].length;
              } else {
                addToken(offset, 'invalid.token');
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

  const aplanTokens = {
    getInitialState: () => new State(0, [{
      t: '', oi: 0, ii: 0, r: 0,
    }], [], 0),
    tokenize: aplTokens.tokenize,
  };

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
      if (se.promptType === 4 || (!se.lineEditor[h.l + 1] && se.dirty[h.l + 1] == null)) {
        offset = eol;
        h.l += 1;
        return lt;
      }
      if (h.s && (m = line.match(/^(\s*)\)(\w+).*/))) {
        if (m[1]) {
          addToken(offset, 'white');
          offset += m[1].length;
        }
        const token = D.syntax.scmd.indexOf(m[2].toLowerCase()) < 0 ? 'invalid.scmd' : 'predefined.scmd';
        addToken(offset, token);
        h.l += 1;
        return lt;
      }
      if (h.s && (m = line.match(/^(\s*)\].*/)) && !h.h.a[h.h.a.length - 1].isAplan) {
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

  const getState = (m, l) => m._tokenization._tokenizationStateStore._beginState[l];
  const aplCompletions = (pk) => ({
    triggerCharacters: `1234567890:.⎕()[]${pk}`.split(''),
    provideCompletionItems: (model, position) => {
      const l = position.lineNumber;
      const c = position.column;
      const s = model.getLineContent(l);
      const ch = s[c - 2];
      const pk2 = `${pk}${pk}`;
      const kind = monaco.languages.CompletionItemKind;
      const insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
      const { a } = getState(model, l - 1) || {};
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
        const textItem = (i) => ({
          label: i,
          insertText: i,
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
            insertTextRules,
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
        if (t === 'class' || t === 'namespace') {
          suggestions.push(
            {
              label: 'Class',
              kind: kind.Snippet,
              insertText: [
                'Class ${1:name}',
                '\t$0',
                ':EndClass',
              ].join('\n'),
              insertTextRules,
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
              insertTextRules,
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
              insertTextRules,
              documentation: 'Interface script',
            },
          );
        }
        if (t === 'class' || t === 'interface') {
          suggestions.push(
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
              insertTextRules,
              documentation: 'Property declaration',
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
            insertTextRules,
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
            insertTextRules,
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
            insertTextRules,
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
            insertTextRules,
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
            insertTextRules,
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
            insertTextRules,
            documentation: 'Repeat loop until',
          },
          {
            label: 'Section',
            kind: kind.Snippet,
            insertText: [
              'Section ${1:name}',
              '\t$0',
              ':EndSection',
            ].join('\n'),
            insertTextRules,
            documentation: 'Section block',
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
            insertTextRules,
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
            insertTextRules,
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
            insertTextRules,
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
            insertTextRules,
            documentation: 'With Statement',
          },
        );
        // }
        /* eslint-enable no-template-curly-in-string */
        return { suggestions };
      }
      const word = (((/⎕?[A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ0-9]*$/.exec(s.slice(0, c)) || [])[0] || '')); // match left of cursor
      const limit = D.prf.autoCompleteCharacterLimit();
      if (D.send && (l[s] || ' ') === ' '
        && (word.length >= limit || D.prf.autocompletion() === 'shell')) {
        D.send('GetAutocomplete', { line: s, pos: c - 1, token: model.winid });
        const m = model;
        return new Promise((complete, error, progress) => {
          m.ac = {
            complete, error, progress, position,
          };
        });
      }
      return null;
    },
  });
  const aplHover = {
    provideHover(model, position) {
      if (!D.send) return [];
      const m = model;
      const p = position;
      const s = m.getLineContent(p.lineNumber);
      const c = s[p.column - 1] || ' ';
      const lbt = D.lb.tips[c];
      if (D.prf.squiggleTips() && lbt
        && !'⍺⍵'.includes(c) && !(c === '⎕' && /[áa-z]/i.test(s[p.column] || ''))) {
        return {
          range: new monaco.Range(p.lineNumber, p.column - 1, p.lineNumber, p.column),
          contents: [
            { value: lbt[0].replace(/\\/g, '\\\\') },
            { value: `\`\`\`plaintext\n${lbt[1]}\n\`\`\`` },
          ],
        };
      }
      if (D.prf.valueTips() && /[^ ()[\]{}':;]/.test(c)) {
        D.ide.getValueTip('monaco', m.winid, { // ask interpreter
          win: m.winid,
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
      return null;
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
          const { length } = model._tokens._lineTokens;
          for (i; i < length; i++) {
            const a = ((getState(model, i) || {}).a || []).slice().reverse();
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
            openRanges.forEach((r) => ranges.push({ ...r, end: totLength }));
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
      const from = range.startLineNumber || 1;
      const to = range.endLineNumber || model._tokens._lineTokens.length;
      const edits = [];
      for (let l = from; l <= to; l++) {
        const s = model.getLineContent(l);
        const [m] = s.match(/^(\s)*/);
        const a = ((getState(model, l - 1) || {}).a || []).slice().reverse();
        const [la, ...ra] = a;
        if (la && (icom || !/^\s*⍝/.test(s))) {
          let ind = ra.map((r) => r.ii).reduce((r, c) => r + c, 0);
          if (dfnDepth(a)) {
            ind += /^\s*\}/.test(s) ? la.oi : la.ii;
          } else if (/^\s*∇/.test(s)) {
            const ai = a.find((x) => x.t === '∇');
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
  const acProviders = [];
  D.mop.then(() => {
    const ml = monaco.languages;
    ml.register({
      id: 'apl',
      extensions: ['.apl', '.aplc', '.aplf', '.apli', '.apln', '.aplo',
        '.mipage', '.dyapp', 'dyalog'],
    });

    ml.register({
      id: 'aplan',
      extensions: ['.apla'],
    });

    ml.setTokensProvider('apl', aplTokens);
    ml.setLanguageConfiguration('apl', aplConfig());
    ml.registerHoverProvider('apl', aplHover);
    ml.registerFoldingRangeProvider('apl', aplFold);
    ml.registerDocumentFormattingEditProvider('apl', aplFormat);
    ml.registerDocumentRangeFormattingEditProvider('apl', aplFormat);
    ml.registerOnTypeFormattingEditProvider('apl', aplFormat);

    ml.setTokensProvider('aplan', aplanTokens);
    ml.setLanguageConfiguration('aplan', aplConfig());
    ml.registerHoverProvider('aplan', aplHover);
    ml.registerFoldingRangeProvider('aplan', aplFold);
    ml.registerDocumentFormattingEditProvider('aplan', aplFormat);
    ml.registerDocumentRangeFormattingEditProvider('aplan', aplFormat);
    ml.registerOnTypeFormattingEditProvider('aplan', aplFormat);

    ml.register({ id: 'apl-session' });
    ml.setTokensProvider('apl-session', aplSessionTokens);
    ml.setLanguageConfiguration('apl-session', aplSessionConfig);
    ml.registerHoverProvider('apl-session', aplHover);
    ml.registerDocumentFormattingEditProvider('apl-session', aplFormat);
    ml.registerDocumentRangeFormattingEditProvider('apl-session', aplFormat);
    ml.registerOnTypeFormattingEditProvider('apl-session', aplFormat);

    const ac = aplCompletions(D.prf.prefixKey());
    acProviders.push(ml.registerCompletionItemProvider('apl', ac));
    acProviders.push(ml.registerCompletionItemProvider('apl-session', ac));
    D.prf.prefixKey((x) => {
      let p;
      while (p = acProviders.pop()) p.dispose();
      const acs = aplCompletions(x);
      acProviders.push(ml.registerCompletionItemProvider('apl', acs));
      acProviders.push(ml.registerCompletionItemProvider('apl-session', acs));
    });
  });
}
