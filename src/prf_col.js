{
  // Preferences > Colours
  // Here we generate CSS based on the user's preferences and put it in
  // <style id=col_stl> (see ../index.html)
  // Same for <style id=col_sample_stl> - this one controls the display of the sample text,
  // before pressing Apply or OK.

  let G = []; // G:syntax highlighting groups
  let H = {}; // H:reverse lookup dict for G
  let M = {}; // H:reverse lookup dict for G
  let q; // dict of DOM elements whose ids start with "col_", keyed by the rest of the id
  let scms; // all schemes (built-in and user-defined) as objects
  let scm = {}; //  the active scheme object
  let me; //   Monaco editor instance for displaying sample code
  let sel; //  the selected group's token type (.t)
  // RGB() expands the hex representation of a colour, rgb() shrinks it
  const RGB = (x) => {
    const n = (x || '').length;
    if (n === 6) return `#${x}`;
    if (n === 3) return `#${x.replace(/(.)/g, '$1$1')}`;
    return n === 1 ? `#${x.repeat(6)}` : x;
  };
  const RGBA = (x, a) => {
    const r = RGB(x);
    return `rgba(${[+`0x${r.slice(1, 3)}`, +`0x${r.slice(3, 5)}`, +`0x${r.slice(5, 7)}`, a]})`;
  };
  const RGBO = (x, a) => {
    const o = a === undefined ? '' : `00${Math.round(a * 255).toString(16)}`.slice(-2);
    return RGB(x) + o;
  };
  const rgb = (x) => {
    if (!/^#.{6}$/.test(x)) return x;
    const [, r, rr, g, gg, b, bb] = x;
    if (r !== rr || g !== gg || b !== bb) return x.slice(1);
    return r === g && g === b ? r : r + g + b;
  };
  const encScm = (x) => {
    let s = '';
    Object.keys(x).forEach((g) => {
      if (g !== 'name' && g !== 'theme') {
        let u = '';
        Object.keys(x[g]).forEach((p) => {
          const v = x[g][p];
          u += `,${p}`;
          if ('BIU'.indexOf(p) < 0 || !v) u += `:${v}`;
        });
        u && (s += ` ${g}=${u.slice(1)}`);
      }
    });
    return { name: x.name, theme: x.theme, styles: s.slice(1) };
  };
  const decScm = (x) => { // x:for example "num=fg:345,bg:f,B,U,bgo:.5 str=fg:2,I com=U"
    const r = { name: x.name, theme: x.theme }; // r:the result
    const a = (x.styles || '').split(/\s+/); // a:for example ["num=fg:345,bg:f,B,U,bgo:.5","str=fg:2,I","com=U"]
    for (let i = 0; i < a.length; i++) {
      if (a[i]) {
        const b = a[i].split('='); // b:["num","fg:345,bg:f,B,U,bgo:.5"]
        const g = b[0]; // g:"num" (the group)
        const c = b[1].split(',');
        const h = {}; r[g] = h;
        for (let j = 0; j < c.length; j++) { // c:["fg:345","bg:f","B","U","bgo:.5"]
          const pv = c[j].split(':');
          const p = pv[0];
          const v = pv[1];
          h[p] = v != null ? v : 1; // p:"fg" v:"345"  or  p:"B" v:undefined
        }
        // if .bgo (background opacity) is present, convert it to a number
        h.fgo != null && (h.fgo = +h.fgo);
        h.bgo != null && (h.bgo = +h.bgo);
      }
    }
    if (!r.theme) { // check brightness and pick matching theme
      const [rr, gg, bb] = RGB(r.norm.bg).match(/([0-9a-fA-F]{2})/g).map((c) => parseInt(c, 16));
      const lum = Math.sqrt((0.241 * rr * rr) + (0.691 * gg * gg) + (0.068 * bb * bb));
      r.theme = lum < 130 ? 'dark' : 'light';
    }
    return r;
  };
  const SCMS = [ // built-in schemes
    {
      name: 'Default',
      theme: 'light',
      styles: 'asgn=fg:00f com=fg:088 dfn=fg:00f diam=fg:00f err=fg:f00 fn=fg:008 idm=fg:008 kw=fg:800 '
        + 'lnum=fg:008,bg:f,bgo:0 mtch=bg:ff8,bgo:.5 norm=bg:f,bgo:1 ns=fg:8 num=fg:8 op1=fg:00f op2=fg:00f '
        + 'an=fg:00f par=fg:00f quad=fg:808 qdl=fg:c0c sel=bg:48e,bgo:.5 semi=fg:00f sqbr=fg:00f srch=bg:f80,bgo:.5 str=fg:088 tc=bg:d,bgo:1 '
        + 'tcpe=bg:c8c8c8,bgo:1 trad=fg:8 var=fg:8 zld=fg:008 scmd=fg:00f ucmd=fg:00f vtt=bg:ff0 '
        + 'ca=bg:828282,bgo:1,fg:0f0 cm=bg:0,bgo:1,fg:080 cv=bg:f,bgo:1,fg:0 cvv=bg:0,bgo:1,fg:0ff '
        + 'ma=bg:828282,bgo:1,fg:0ff na=bg:828282,bgo:1,fg:f qor=bg:f00,bgo:1,fg:f dc=bg:#993333,bgo:1 '
        + 'itk=fg:f00',
    }, {
      name: 'Francisco Goya',
      theme: 'dark',
      styles: 'asgn=fg:ff0 com=fg:b,I:1 cur=bc:f00 dfn2=fg:eb4 dfn3=fg:c79 dfn4=fg:cd0 dfn5=fg:a0d '
        + 'dfn=fg:a7b diam=fg:ff0 err=fg:f00,bg:822,bgo:.5,B:1 fn=fg:0f0 idm=fg:0f0 glb=B:1 kw=fg:aa2 '
        + 'lbl=U:1,bg:642,bgo:.5 lnum=fg:b94,bg:010,bgo:0 mtch=fg:0,bg:0,bgo:0 norm=fg:9c7,bg:0,bgo:1 '
        + 'num=fg:a8b op1=fg:d95 op2=fg:fd6 sel=bg:048,bgo:.5 semi=fg:8 sqbr=fg:8 srch=bg:b96,bgo:.75,fg:0 str=fg:dae '
        + 'tc=bg:1,bgo:1 tcpe=bg:2,bgo:1 zld=fg:d9f,B:1 scmd=fg:0ff ucmd=fg:f80,B:1 vtip=bg:733,fg:ff0,bgo:1,bc:900 vtt=bc:f80 '
        + 'ca=bg:828282,bgo:1,fg:0f0 cm=bg:0,bgo:1,fg:0f0 cv=bg:f,bgo:1,fg:0 cvv=bg:0,bgo:1,fg:0ff '
        + 'ma=bg:828282,bgo:1,fg:0ff na=bg:828282,bgo:1,fg:f qor=bg:f00,bgo:1,fg:f dc=bg:900,bgo:1',
    }, {
      name: 'Albrecht Dürer',
      theme: 'light',
      styles: 'com=I:1 diam=B:1 err=fg:0,bg:1,bgo:.5,B:1,I:1 glb=I:1 kw=B:1 '
        + 'lnum=bg:f,bgo:0 mtch=bg:c,bgo:.5 norm=bg:f,bgo:1 ns=fg:8 num=fg:8 quad=fg:8 srch=bg:c,bgo:.5 '
        + 'str=fg:8 tc=bg:e,bgo:1 tcpe=bg:dadada,bgo:1 zld=fg:8 vtt=bc:aaa dc=bg:#993333,bgo:1',
    }, {
      name: 'Kazimir Malevich',
      theme: 'light',
      styles: 'norm=bg:f,bgo:1, dc=bg:#993333',
    }, {
      name: 'Dracula',
      theme: 'dark',
      styles: 'asgn=fg:#50fa7b com=fg:#6272a4 diam=fg:#ff79c6 err=fg:#ff5555,bgo:1 fn=fg:#8be9fd idm=U kw=fg:#ff79c6 '
        + 'lnum=bgo:0,fg:6272a4 mtch=bgo:0.5,fg:#f8f8f2,bg:#44475a norm=bg:#282a36,bgo:1,fg:f8f8f2 '
        + 'num=fg:#bd93f9 op1=fg:#50fa7b,fgo:1 op2=fg:#f1fa8c quad=fg:#ffb86c sel=bg:#6bb2ff,bgo:0.25 semi=fg:#50fa7b '
        + 'sqbr=fg:#50fa7b srch=bg:#bd93f9,bgo:0.5 str=fg:#f1fa8c tc=bg:#44475a,bgo:1 tcpe=bg:#44475a,bgo:1 zld=fg:#bd93f9 '
        + 'scmd=fg:#ff79c6 ucmd=fg:#ff79c6,B vtt=bg:#44475a,bgo:1 ca=bg:#44475a,bgo:1,fg:#ff5555 cm=bg:#282a36,bgo:1,fg:#50fa7b '
        + 'cv=bg:#44475a,bgo:1,fg:#f1fa8c cvv=bg:#282a36,bgo:1,fg:#8be9fd ma=bg:#44475a,bgo:1,fg:#8be9fd '
        + 'na=bg:#44475a,bgo:1,fg:#bd93f9 qor=bg:#ff5555,bgo:1,fg:#f8f8f2 dc=bg:#7f2a2a,bgo:1 lbl=fg:#ff79c6,B glb=fg:#ffb86c '
        + 'cubr=fg:#f8f8f2 par=fg:#f8f8f2 dfn=fg:#f8f8f2 qdl=fg:#f8f8f2 cur=fg:#f8f8f2,fgo:1 acsl=bg:#bd93f9,bgo:0.25',
    }, {
      name: 'New Moon',
      theme: 'dark',
      styles: 'asgn=fg:#6ab0f3 com=fg:#777c85 diam=fg:#ffeea6 err=fg:#f2777a,bgo:1 fn=fg:#ac8d58 idm=U kw=fg:#ffeea6 '
        + 'lnum=bgo:0,fg:#777c85 mtch=bgo:0.5,bg:#777c85,fgo:1 norm=bg:#2d2d2d,bgo:1,fg:#b3b9c5 '
        + 'num=fg:#fca369 op1=fg:#6ab0f3,fgo:1 op2=fg:#76d4d6 quad=fg:#f2777a sel=bg:#6ab0f3,bgo:0.5 semi=fg:#6ab0f3 '
        + 'sqbr=fg:#6ab0f3 srch=bg:#e1a6f2,bgo:0.25 str=fg:#92d192 tc=bg:#777c85,bgo:0.25 tcpe=bg:#777c85,bgo:0.25 zld=fg:#fca369 '
        + 'scmd=fg:#ffeea6 ucmd=fg:#ffeea6,B vtt=bg:#777c85,bgo:1 ca=bg:#777c85,bgo:0.25,fg:#f2777a cm=bg:#2d2d2d,bgo:1,fg:#92d192 '
        + 'cv=bg:#2d2d2d,bgo:1,fg:#ffeea6 cvv=bg:#2d2d2d,bgo:1,fg:#76d4d6 ma=bg:#777c85,bgo:0.25,fg:#76d4d6 '
        + 'na=bg:#44475a,bgo:1,fg:#bd93f9 qor=bg:#f2777a,bgo:1,fg:#ffffff dc=bg:#7a3b3d,bgo:1 lbl=fg:#ffd479 glb=fg:#f2777a '
        + 'dfn=fg:#ffffff qdl=fg:#b3b9c5 cur=fg:#ffffff,fgo:1 acsl=bgo:0.25,bg:#e1a6f2',
    }, {
      name: 'Nord',
      theme: 'dark',
      styles: 'com=fg:#616e88 diam=B,fg:#81a1c1 err=fg:#bf616a,bgo:0.5 glb=fg:#ebcb8b kw=fg:#81a1c1 lnum=bgo:0,fg:#4c566a '
        + 'mtch=bg:#434c5e,bgo:0.5 norm=bg:#2e3440,bgo:1,fg:#eceff4 num=fg:#b48ead quad=fg:#ebcb8b '
        + 'srch=bg:#434c5e,bgo:0.5 str=fg:#a3be8c tc=bg:#434c5e,bgo:1,fg:#eceff4 tcpe=bg:#434c5e,bgo:1,fg:#eceff4 zld=fg:#b48ead '
        + 'vtt=bg:#434c5e dc=bg:#603136,bgo:1 cur=fg:#d8dee9 cubr=fg:#5e81ac asgn=fg:#88c0d0 lbl=fg:#81a1c1,B fn=fg:#81a1c1 '
        + 'qdl=fg:#d8dee9 var=fg:#d8dee9 sqbr=fg:#81a1c1 semi=fg:#81a1c1 idm=fg:#d08770 sel=bg:#434c5e par=fg:#eceff4 '
        + 'scmd=fg:#81a1c1 ucmd=fg:#81a1c1 vtip=bg:#3b4252,fg:#eceff4,bgo:1 ca=fg:#bf616a,bg:#434c5e,bgo:1 '
        + 'cm=fg:#a3be8c,bg:#2e3440,bgo:1 cv=fg:#ebcb8b,bg:#2e3440 cvv=fg:#88c0d0,bg:#2e3440,bgo:1 ma=fg:#88c0d0,bg:#434c5e,bgo:1 '
        + 'na=fg:#b48ead,bg:#434c5e,bgo:1 qor=fg:#eceff4,bg:#bf616a,bgo:1 op1=fg:#88c0d0 op2=fg:#8fbcbb',
    },
  ].map(decScm).map((x) => { x.frz = 1; return x; });
  // Colour schemes have two representations:
  // in memory (easier to manipulate)   in prefs.json (more compact)
  //   {                                {
  //     name:"MyScheme",                 "name":"MyScheme",
  //     group1:{                         "styles":"group1=fg:f00,B group2=bg:f00 ..."
  //       fg:"f00",                    }
  //       B:1
  //     },
  //     group2:{
  //       "bg":"f00"
  //     },
  //     ...
  //   }
  // encScm() and decScm() convert between them
  const renderCSS = (schema, isSample) => (
    G.map((g) => {
      const h = schema[g.t];
      if (!h || !g.c) return '';
      const els = g.c.split(',').map((x) => (isSample ? '#nonexistent' : x)).join(',');
      const edmode = ['ca', 'cm', 'cv', 'cvv', 'ma', 'na', 'qor', 'dc'].includes(g.t);
      let cls;
      if (edmode) {
        cls = `${els} .monaco-editor-background,${els} .monaco-editor .margin{`;
        h.bg && (cls += `background-color:${RGB(h.bg)};`);
        h.bg && (cls += `background-color:${RGBA(h.bg, h.bgo == null ? 0.5 : h.bgo)};`);
        cls += `}${els} .monaco-editor span,${els} .monaco-editor .line-numbers{`;
        h.fg && (cls += `color:${RGB(h.fg)}!important;`);
        h.fg && (cls += `color:${RGBA(h.fg, h.fgo == null ? 1 : h.fgo)}!important;`);
        h.B && (cls += 'font-weight:bold;');
        h.I && (cls += 'font-style:italic;');
        h.U && (cls += 'text-decoration:underline;');
        cls += '}';
        return cls;
      }
      cls = `${els}{`;
      h.fg && (cls += `color:${RGB(h.fg)}!important;`);
      h.B && (cls += 'font-weight:bold;');
      h.I && (cls += 'font-style:italic;');
      h.U && (cls += 'text-decoration:underline;');
      h.bc && (cls += `border-color:${RGB(h.bc)};`);
      h.bg && (cls += `background-color:${RGB(h.bg)};`);
      h.bg && (cls += `background-color:${RGBA(h.bg, h.bgo == null ? 0.5 : h.bgo)};`);
      cls += '}';
      return cls;
    }).join('')
      .concat(D.mac ? 'u{text-decoration:none;}' : '')
      .concat(`@font-face {font-family:'apl'; src: ${
        [...D.prf.customAplFont().split(','), 'APL385 Unicode'].map((x) => x && `local('${x.trim()}'),`).join('')}
        url('./style/fonts/Apl385.woff') format('woff'), url('./style/fonts/Apl385.ttf') format('truetype');'
      }`)
  );
  const setMonacoTheme = (schema) => {
    const rules = [];
    const colors = {};
    G.forEach((g) => {
      const h = schema[g.t];
      if (!h) {
        // return
      } else if (g.m) {
        rules.push({
          token: g.m,
          foreground: h.fg && RGB(h.fg).slice(1),
          background: h.bg && RGB(h.bg).slice(1),
          fontStyle: (h.B || h.I || h.U) && [
            (h.B ? 'bold' : ''),
            (h.I ? 'italic' : ''),
            (h.U ? 'underline' : ''),
          ].join(' ').trim(),
        });
      } else if (g.t === 'norm' && h.bg) {
        rules.push({
          foreground: h.fg && RGB(h.fg).slice(1),
          background: RGB(h.bg).slice(1),
        });
        colors['editor.background'] = RGBO(h.bg, h.bgo || 1);
      } else if (g.e) {
        if (/background/i.test(g.e) && h.bg) {
          colors[g.e] = RGBO(h.bg, h.bgo);
        } else {
          colors[g.e] = RGBO(h.fg || h.bc, h.fgo || 1);
        }
      }
    });
    const name = `my${schema.name.split('').map((x) => `${x.codePointAt(0)}`).join('')}`;
    monaco.editor.defineTheme(name, {
      base: schema.theme === 'light' ? 'vs' : 'vs-dark',
      inherit: false,
      rules,
      colors,
    });
    monaco.editor.setTheme(name);
    if (D.el) {
      nodeRequire('@electron/remote').getGlobal('winstate').theme = schema.theme;
    }
  };
  const updStl = () => { // update global style from what's in prefs.json
    const s = D.prf.colourScheme();
    const a = SCMS.concat(D.prf.colourSchemes().map(decScm));
    for (let i = 0; i < a.length; i++) {
      if (a[i].name === s) {
        const schema = a[i];
        document.getElementById('theme_dark').disabled = schema.theme !== 'dark';
        document.getElementById('theme_light').disabled = schema.theme !== 'light';
        D.theme = schema.theme;
        if (D.ipc && D.ipc.server) {
          D.ipc.server.broadcast('setTheme', D.theme);
        }
        I.col_stl && (I.col_stl.textContent = renderCSS(schema));
        if (window.monaco) setMonacoTheme(schema);
        break;
      }
    }
  };
  // $(updStl);
  D.addSynGrps = (x) => {
    G = Object.values(x).flat();
    J.col.grp.innerHTML = Object.keys(x).map((header) => {
      const ops = x[header].map((style) => `<option value=${G.indexOf(style)}>${style.s}`).join('');
      return `<optgroup label="${header}">${ops}</optgroup>`;
    }).join('');
    H = {};
    M = {};
    for (let i = 0; i < G.length; i++) {
      H[G[i].t] = i;
      G[i].m && (M[G[i].m] = G[i].t);
    }
    SCMS && updStl();
  };
  /* eslint-disable */
  D.addSynGrps({
    // t: token type, a short key for storing customisations
    // s: string to display in the UI
    // c: css selector -- will be prefixed with "#col_cm" or ".ride_win" unless /*noprefix*/ is present
    // m: monaco theme token name
    // bc: border color where applicable, bool
    // bg: background color where applicable, bool 
    // fg: foreground color where applicable, bool
    // BIU: Bold, Italic and Underscore options where applicable, bool
    'User Interface': [
      { s: 'Autocomplete selection', t: 'acsl', e: 'editorSuggestWidget.selectedBackground', bg: 1 },
      { s: 'Cursor', t: 'cur', e: 'editorCursor.foreground', fg: 1 },
      { s: 'Matching bracket', t: 'mtch', e: 'editorBracketMatch.background', bg: 1 },
      { s: 'Search match', t: 'srch', e: 'editor.findMatchBackground', bg: 1 },
      { s: 'Selection', t: 'sel', e: 'editor.selectionBackground', bg: 1 },
      { s: 'Modified session line', t: 'mod', c: '.modified', bg: 1 }, //in the session - lines queued for execution
      { s: 'Value tip', t: 'vtip', c: '/*noprefix*/#vt_bln,/*noprefix*/#vt_tri', bc: 1 }, //the balloon
      { s: 'Value tip target', t: 'vtt', c: '.vt_marker', bc: 1, fg: 0, BIU: 0 }, //the rectangle around the token
      { s: 'Ride disconnected', t: 'dc', c: '.disconnected', bg: 1, fg: 1, BIU: 1 },
    ],
    'Editor/Tracer': [
      { s: 'Active tracer', t: 'tc', c: '/*noprefix*/.tracer .monaco-editor-background,/*noprefix*/.tracer .monaco-editor .margin', bg: 1 },
      { s: 'Pendent tracer', t: 'tcpe',
      c: '/*noprefix*/.tracer.pendent .monaco-editor-background,/*noprefix*/.tracer.pendent .monaco-editor .margin,'
       + '/*noprefix*/.tracer.tbt .monaco-editor-background,/*noprefix*/.tracer.tbt .monaco-editor .margin', bg: 1 },
      { s: 'Vector of character vectors', t: 'cvv', c: '.charvecvec', bg: 1, fg: 1, BIU: 1 },
      { s: 'Simple numeric array ', t: 'na', c: '.numarr', bg: 1, fg: 1, BIU: 1 },
      { s: 'Simple character matrix', t: 'cm', c: '.charmat', bg: 1, fg: 1, BIU: 1 },
      { s: 'Simple character vector', t: 'cv', c: '.charvec', bg: 1, fg: 1, BIU: 1 },
      { s: 'Other character array', t: 'ca', c: '.chararr', bg: 1, fg: 1, BIU: 1 },
      { s: 'Other array', t: 'ma', c: '.mixarr', bg: 1, fg: 1, BIU: 1 },
      { s: 'Object representation', t: 'qor', c: '.quador', bg: 1, fg: 1, BIU: 1 },
      { s: 'Line number', t: 'lnum', e: 'editorLineNumber.foreground', fg: 1 },
      { s: 'Line number active', t: 'lnac', e: 'editorLineNumber.activeForeground', fg: 1 },
    ],
    'Language Elements': [
      { s: 'Normal code', t: 'norm', c: '.ride_win_me', fg: 1, bg: 1 },
      { s: 'Assignment arrow', t: 'asgn', m: 'keyword.operator.assignment', fg: 1, BIU: 1 }, //←
      { s: 'Diamond', t: 'diam', m: 'delimiter.diamond', fg: 1, BIU: 1 }, //⋄
      { s: 'Primitive function', t: 'fn', m: 'keyword.function', fg: 1, BIU: 1 }, //+ ...
      { s: 'Primitive operator monadic', t: 'op1', m: 'keyword.operator.monadic', fg: 1, BIU: 1 }, //⌸ ...
      { s: 'Primitive operator dyadic', t: 'op2', m: 'keyword.operator.dyadic', fg: 1, BIU: 1 }, //⍣ ...
      { s: 'Semicolon', t: 'semi', m: 'delimiter.semicolon', fg: 1, BIU: 1 }, //as in A[B;C]
      { s: 'Comment', t: 'com', m: 'comment', fg: 1, BIU: 1 }, //⍝
      { s: 'Invalid syntax', t: 'err', m: 'invalid', c: '.session-aplerr:not(.modified)', fg: 1, BIU: 1 },
      { s: 'Invalid token', t: 'itk', m: 'invalid.token', fg: 1, BIU: 1 },
      { s: 'Optimised idiom', t: 'idm', m: 'predefined.idiom', fg: 1, BIU: 1 }, //⊃⌽ ...
      { s: 'Keyword', t: 'kw', m: 'keyword', fg: 1, BIU: 1 }, //:If ...
    ],
    'Values': [
      { s: 'Character literal', t: 'str', m: 'string', fg: 1, BIU: 1 }, //'a.k.a. character vector or scalar'
      { s: 'Empty numeric vector', t: 'zld', m: 'predefined.zilde', fg: 1, BIU: 1 },  //⍬
      { s: 'Number', t: 'num', m: 'number', fg: 1, BIU: 1 }, //0 ...
      { s: 'Root or parent namespace', t: 'ns', m: 'namespace', fg: 1, BIU: 1 }, //#
      { s: 'Tradfn name in header', t: 'trad', m: 'identifier.tradfn', fg: 1, BIU: 1 }, //the header line (e.g. ∇{R}←A F B) or the closing ∇
      { s: 'User defined global', t: 'glb', m: 'identifier.global', fg: 1, BIU: 1 },
      { s: 'User defined local', t: 'var', m: 'identifier.local', fg: 1, BIU: 1 }, //a.k.a. identifier
      { s: 'Array notation name', t: 'ann', m: 'identifier.local.aplan', fg: 1, BIU: 1 }, //a.k.a. identifier
      { s: 'Label', t: 'lbl', m: 'meta.label', fg: 1, BIU: 1 }, //L:
      { s: 'System name', t: 'quad', m: 'predefined.sysfn', fg: 1, BIU: 1 }, //⎕XYZ
      { s: 'System name local', t: 'qdl', m: 'predefined.sysfn.local', fg: 1, BIU: 1 }, // localized ⎕XYZ
      { s: 'System command', t: 'scmd', m: 'predefined.scmd', fg: 1, BIU: 1 }, //)XYZ
      { s: 'User command', t: 'ucmd', m: 'predefined.ucmd', fg: 1, BIU: 1 }, //]XYZ
    ],
    'Enclosures': [
      { s: 'Array notation', t: 'an', m: 'delimiter.aplan', fg: 1, BIU: 1 }, //()
      { s: 'Curly braces', t: 'cubr', m: 'delimiter.curly', fg: 1, BIU: 1 }, //{}
      { s: 'Round parenthesis', t: 'par', m: 'delimiter.parenthesis', fg: 1, BIU: 1 }, //()
      { s: 'Square bracket', t: 'sqbr', m: 'delimiter.square', fg: 1, BIU: 1 }, //[]
      { s: 'Dfn', t: 'dfn', m: 'identifier.dfn', fg: 1, BIU: 1 },
      { s: 'Dfn level 1', t: 'dfn1', m: 'identifier.dfn.1', fg: 1, BIU: 1 }, //{}
      { s: 'Dfn level 2', t: 'dfn2', m: 'identifier.dfn.2', fg: 1, BIU: 1 },
      { s: 'Dfn level 3', t: 'dfn3', m: 'identifier.dfn.3', fg: 1, BIU: 1 },
      { s: 'Dfn level 4', t: 'dfn4', m: 'identifier.dfn.4', fg: 1, BIU: 1 },
      { s: 'Dfn level 5', t: 'dfn5', m: 'identifier.dfn.5', fg: 1, BIU: 1 }, //{1 {2 {3 {4 {5} } } } }
    ],
  });
  /* eslint-enable */
  D.mop.then(() => updStl());
  D.prf.colourScheme(updStl);
  D.prf.colourSchemes(updStl);
  D.prf.customAplFont(updStl);
  const uniqScmName = (x) => { // x:suggested root
    const h = {};
    for (let i = 0; i < scms.length; i++) h[scms[i].name] = 1;
    let r = x;
    if (h[x]) {
      const dx = x.replace(/ \(\d+\)$/, '');
      let i = 1;
      while (h[r = `${dx} (${i})`]) i += 1;
    }
    return r;
  };
  const SC_MATCH = 'search match'; // sample text to illustrate it
  const updSampleStl = () => {
    // I.col_sample_stl.textContent = renderCSS(scm, 1);
    monaco.editor.setTheme('vs');
    setMonacoTheme(scm);
    // me.layout();
  }; // [sic]
  const selGrp = (t, forceRefresh) => {
    // update everything as necessary when selection in the Group dropdown changes
    if (!scm || (sel === t && !forceRefresh)) return;
    const i = H[t];
    const h = scm[t] || {};
    let v;
    q.grp.value = i;
    v = h.fg; q.fg_cb.checked = !!v; q.fg.value = RGB(v) || '#000000'; q.fg.hidden = !v;
    v = h.bg; q.bg_cb.checked = !!v; q.bg.value = RGB(v) || '#000000'; q.bg.hidden = !v;
    v = h.bc; q.bc_cb.checked = !!v; q.bc.value = RGB(v) || '#000000'; q.bc.hidden = !v;
    q.B.checked = !!h.B;
    q.I.checked = !!h.I;
    q.U.checked = !!h.U;
    q.fgo.value = h.fgo == null ? 1 : h.fgo;
    q.bgo.value = h.bgo == null ? 0.5 : h.bgo;
    const g = G[i];
    q.fg_p.hidden = !g.fg;
    q.bg_p.hidden = !g.bg;
    q.fgo_p.hidden = !!g.m || !g.fg || !h.fg;
    q.bgo_p.hidden = !g.bg || !h.bg;
    q.BIU_p.hidden = !g.BIU;
    q.bc_p.hidden = !g.bc;
    sel = t;
  };
  const updScms = () => {
    q.scm.innerHTML = scms.map((x) => { const n = D.util.esc(x.name); return `<option value="${n}">${n}`; }).join('');
    q.scm.value = scm.name;
    q.scm.onchange();
    I.col.className = scm.frz ? 'frz' : '';
    updSampleStl();
    selGrp('norm', 1);
    q.chrome.value = scm.theme;
  };
  D.prf_tabs.col = {
    name: 'Colours',
    init() {
      q = J.col;
      q.fnt_rst.onclick = () => {
        q.fnt.value = D.prf.customAplFont.getDefault();
        q.fnt.focus();
        return false;
      };
      const u = [];
      Object.keys(scm).forEach((g) => {
        const { fg } = scm[g];
        fg && u.indexOf(fg) < 0 && u.push(fg);
      });
      u.sort(); // u:unique colours
      q.list.innerHTML = u.map((x) => `<option value=${x}>`).join('');
      q.scm.onchange = () => {
        scm = scms[+q.scm.selectedIndex];
        updSampleStl();
        q.chrome.value = scm.theme;
        I.col.className = scm.frz ? 'frz' : '';
      };
      q.new_name.onblur = () => {
        const s = q.new_name.value;
        if (!s) return;
        scm.name = ''; scm.name = uniqScmName(s);
        I.col.className = '';
        updScms();
      };
      q.new_name.onkeydown = (x) => {
        const c = q.new_name;
        switch (x.which) {
          /* enter */case 13: c.blur(); return !1;
          /* esc   */case 27: c.value = scm.name; c.blur(); return !1;
          default: return !0;
        }
      };
      q.cln.onclick = () => {
        const x = {};
        scms.push(x);
        Object.keys(scm).forEach((k) => { x[k] = $.extend({}, scm[k]); }); // x:the new scheme
        x.name = uniqScmName(scm.name);
        x.theme = scm.theme;
        delete x.frz;
        scm = x;
        updScms();
      };
      q.ren.onclick = () => {
        q.new_name.style.width = `${q.scm.offsetWidth}px`;
        q.new_name.value = scm.name;
        q.new_name.select();
        I.col.className = 'renaming';
        setTimeout(() => { q.new_name.focus(); }, 0);
      };
      q.del.onclick = () => {
        const i = q.scm.selectedIndex;
        scms.splice(i, 1);
        scm = scms[Math.min(i, scms.length - 1)];
        updScms();
        return !1;
      };
      const fs = D.zoom2fs[D.prf.zoom() + 10];
      me = monaco.editor.create(q.me, {
        acceptSuggestionOnEnter: 'off',
        autoClosingBrackets: true,
        automaticLayout: true,
        autoIndent: true,
        contextmenu: false,
        cursorStyle: D.prf.blockCursor() ? 'block' : 'line',
        cursorBlinking: D.prf.cursorBlinking(),
        folding: false,
        fontFamily: 'apl',
        fontSize: fs,
        language: 'apl',
        lineHeight: fs + 2,
        lineNumbers: (x) => `[${x - 1}]`,
        minimap: { enabled: false },
        matchBrackets: true,
        mouseWheelZoom: false,
        renderIndentGuides: false,
        unicodeHighlight: { ambiguousCharacters: false },
        useTabStops: false,
        wordBasedSuggestions: false,
        value: '{R}←{X}tradfn(Y Z);local\n'
          + 'dfn←{ ⍝ comment\n'
          + '  0 ¯1.2e¯3j¯.45 \'string\' ⍬\n'
          + '  +/-⍣(×A):⍺∇⍵[i;j]\n'
          + '  {{{{nested ⍺:∇⍵}⍺:∇⍵}⍺:∇⍵}⍺:∇⍵}\n'
          + '}\n'
          + 'label:\n'
          + ':For i :In ⍳X ⋄ :EndFor\n'
          + ':If condition\n'
          + '  {⍵[⍋⍵]} ⋄ global←local←0\n'
          + '  ⎕error ) ] } :error \'unclosed\n'
          + ':EndIf\n'
          + '(A:[1 2 3 ⋄ 4 5 6])\n'
          + `${SC_MATCH}\n`,
      });
      D.prf.blockCursor((x) => me.updateOptions({ cursorStyle: x ? 'block' : 'line' }));
      D.prf.cursorBlinking((x) => me.updateOptions({ cursorBlinking: x }));
      let ss;
      function selGrpFromPosition(p) {
        const { lineNumber, column } = p;
        const s = ss[lineNumber - 1];
        const si = s.tokens
          .map((x) => x.startIndex)
          .findIndex((x) => x >= column - 1);
        const t = s.tokens[si < 0 ? s.tokens.length - 1 : si - 1];
        let sc = t ? t.scopes.slice(0, -4) : '';
        while (!M[sc] && sc) sc = sc.slice(0, Math.max(0, sc.lastIndexOf('.')));
        sc ? selGrp(M[sc]) : selGrp('norm');
      }
      const reTokenize = $.debounce(500, () => {
        let s = D.Tokenizer.getInitialState();
        const ls = me.getModel().getLinesContent();
        ss = ls.map((l) => {
          const st = D.Tokenizer.tokenize(l, s);
          s = st.endState;
          return st;
        });
        selGrpFromPosition(me.getPosition());
      });
      reTokenize();
      me.listen = 1;
      me.getModel().onDidChangeContent(reTokenize);
      D.ac(me);
      me.onDidChangeCursorPosition((e) => {
        if (!me.getSelection().isEmpty()) selGrp('sel');
        else selGrpFromPosition(e.position);
      });
      me.onMouseDown((e) => {
        const t = e.target;
        const p = t.position;
        const mt = monaco.editor.MouseTargetType;
        if (t.type === mt.GUTTER_LINE_NUMBERS) {
          selGrp('lnum');
        } else if (t.type === mt.CONTENT_TEXT) {
          selGrpFromPosition(t.position);
        } else if (t.type === mt.CONTENT_EMPTY && t.mouseColumn > p.column) {
          me.trigger('editor', 'type', { text: ' '.repeat(t.mouseColumn - p.column) });
        }
      });
      q.chrome.onchange = () => { scm.theme = q.chrome.value; };
      q.grp.onchange = () => { selGrp(G[+q.grp.value].t); };
      ['fg', 'bg', 'bc'].forEach((p) => {
        const c = q[p];
        const cb = q[`${p}_cb`];
        c.onchange = () => {
          (scm[sel] || (scm[sel] = {}))[p] = c.value;
          updSampleStl();
        };
        cb.onclick = () => {
          const h = scm[sel] || (scm[sel] = {});
          cb.checked ? h[p] = rgb(q[p].value) : delete h[p];
          q[p].hidden = !cb.checked;
          updSampleStl();
          if (p === 'fg') q.fgo_p.hidden = !!G[H[sel]].m || !cb.checked;
          if (p === 'bg') q.bgo_p.hidden = !cb.checked;
        };
      });
      q.fgo.onchange = () => {
        (scm[sel] || (scm[sel] = {})).fgo = +q.fgo.value; updSampleStl();
      };
      q.bgo.onchange = () => {
        (scm[sel] || (scm[sel] = {})).bgo = +q.bgo.value; updSampleStl();
      };
      ['B', 'I', 'U'].forEach((p) => {
        const b = $(q[p]);
        b.click(() => {
          const h = scm[sel] || (scm[sel] = {});
          b[0].checked ? h[p] = 1 : delete h[p];
          updSampleStl();
        });
      });
    },
    load() {
      q.fnt.value = D.prf.customAplFont();
      const a = SCMS.concat(D.prf.colourSchemes().map(decScm));
      scms = a;
      const s = D.prf.colourScheme();
      [scm] = a;
      for (let i = 0; i < a.length; i++) if (a[i].name === s) { scm = a[i]; break; }
      I.col.className = ''; updScms();
    },
    activate() { q.scm.focus(); },
    save() {
      D.prf.customAplFont(q.fnt.value);
      D.prf.colourSchemes(scms.filter((x) => !x.frz).map(encScm));
      D.prf.colourScheme(scm.name);
    },
    resize() { },
  };
}
