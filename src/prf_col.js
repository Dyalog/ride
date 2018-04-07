{
// Preferences > Colours
// Here we generate CSS based on the user's preferences and put it in
// <style id=col_stl> (see ../index.html)
// Same for <style id=col_sample_stl> - this one controls the display of the sample text,
// before pressing Apply or OK.

  let G = []; // G:syntax highlighting groups
  let H = {}; // H:reverse lookup dict for G
  let q; // dict of DOM elements whose ids start with "col_", keyed by the rest of the id
  // D.addSynGrps(...) is the API for extensions, see ../sample-extensions/syntax-in-comments.js
  function encScm(x) {
    let s = '';
    Object.keys(x).forEach((g) => {
      if (g !== 'name' && g !== 'base') {
        let u = '';
        Object.keys(x[g]).forEach((p) => {
          const v = x[g][p];
          u += `,${p}`;
          if ('BIU'.indexOf(p) < 0 || !v) u += `:${v}`;
        });
        u && (s += ` ${g}=${u.slice(1)}`);
      }
    });
    return { name: x.name, base: x.base, styles: s.slice(1) };
  }
  function decScm(x) { // x:for example "num=fg:345,bg:f,B,U,bgo:.5 str=fg:2,I com=U"
    const r = { name: x.name, base: x.base }; // r:the result
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
    return r;
  }
  const SCMS = [ // built-in schemes
    {
      name: 'Default',
      base: 'vs',
      styles: 'asgn=fg:00f com=fg:088 dfn=fg:00f diam=fg:00f err=fg:f00 fn=fg:008 idm=fg:008 kw=fg:800 ' +
      'lnum=fg:008,bg:f,bgo:0 mod=bg:7,bgo:.25 mtch=bg:ff8,bgo:.5 norm=bg:f,bgo:1 ns=fg:8 num=fg:8 op1=fg:00f op2=fg:00f ' +
      'par=fg:00f quad=fg:808 sel=bg:48e,bgo:.5 semi=fg:00f sqbr=fg:00f srch=bg:f80,bgo:.5 str=fg:088 tc=bg:d,bgo:1 ' +
      'tcpe=bg:c8c8c8,bgo:1 trad=fg:8 var=fg:8 zld=fg:008 scmd=fg:00f ucmd=fg:00f vtt=bg:ff0',
    }, {
      name: 'Francisco Goya',
      base: 'vs-dark',
      styles: 'asgn=fg:ff0 com=fg:b,I:1 cur=bc:f00 dfn2=fg:eb4 dfn3=fg:c79 dfn4=fg:cd0 dfn5=fg:a0d ' +
      'dfn=fg:a7b diam=fg:ff0 err=fg:f00,bg:822,bgo:.5,B:1,U:1 fn=fg:0f0 idm=fg:0f0 glb=B:1 kw=fg:aa2 ' +
      'lbl=U:1,bg:642,bgo:.5 lnum=fg:b94,bg:010,bgo:0 mod=bg:7,bgo:.5 mtch=fg:0,bg:ff8,bgo:.75 norm=fg:9c7,bg:0,bgo:1 ' +
      'num=fg:a8b op1=fg:d95 op2=fg:fd6 sel=bg:048,bgo:.5 semi=fg:8 sqbr=fg:8 srch=bg:b96,bgo:.75,fg:0 str=fg:dae ' +
      'tc=bg:1,bgo:1 tcpe=bg:2,bgo:1 zld=fg:d9f,B:1 scmd=fg:0ff ucmd=fg:f80,B:1 vtip=bg:733,fg:ff0,bgo:1,bc:900 vtt=bc:f80',
    }, {
      name: 'Albrecht Dürer',
      base: 'vs',
      styles: 'com=I:1 diam=B:1 err=fg:0,bg:1,bgo:.5,B:1,I:1,U:1 glb=I:1 kw=B:1 ' +
      'lnum=bg:f,bgo:0 mod=bg:7,bgo:.25 mtch=bg:c,bgo:.5 norm=bg:f,bgo:1 ns=fg:8 num=fg:8 quad=fg:8 srch=bg:c,bgo:.5 ' +
      'str=fg:8 tc=bg:e,bgo:1 tcpe=bg:dadada,bgo:1 zld=fg:8 vtt=bc:aaa',
    }, {
      name: 'Kazimir Malevich',
      base: 'vs',
      styles: 'norm=bg:f,bgo:1',
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
  let scms; // all schemes (built-in and user-defined) as objects
  let scm = {}; //  the active scheme object
  let me; //   Monaco editor instance for displaying sample code
  let sel; //  the selected group's token type (.t)
  // RGB() expands the hex representation of a colour, rgb() shrinks it
  function RGB(x) {
    const n = (x || '').length;
    if (n === 6) return `#${x}`;
    else if (n === 3) return `#${x.replace(/(.)/g, '$1$1')}`;
    return n === 1 ? `#${x.repeat(6)}` : x;
  }
  function RGBA(x, a) {
    const r = RGB(x);
    return `rgba(${[+`0x${r.slice(1, 3)}`, +`0x${r.slice(3, 5)}`, +`0x${r.slice(5, 7)}`, a]})`;
  }
  function RGBO(x, a) {
    const o = a === undefined ? '' : `00${Math.round(a * 255).toString(16)}`.slice(-2);
    return RGB(x) + o;
  }
  function rgb(x) {
    if (!/^#.{6}$/.test(x)) return x;
    const [, r, rr, g, gg, b, bb] = x;
    if (r !== rr || g !== gg || b !== bb) return x.slice(1);
    return r === g && g === b ? r : r + g + b;
  }
  function renderCSS(schema, isSample) {
    const rp = isSample ? '#col_cm' : '.ride_win'; // css rule prefix, ignored when there's a "/*noprefix*/"
    return G.map((g) => {
      const h = schema[g.t];
      if (!h) return '';
      let cls = g.c.split(',').map((x) => {
        if (!/^\/\*noprefix\*\//.test(x)) return `${rp} ${x}`;
        return isSample ? '#nonexistent' : x;
      }).join(',');
      cls += '{';
      h.fg && (cls += `color:${RGB(h.fg)};`);
      h.bg && (cls += `background-color:${RGB(h.bg)};`);
      h.B && (cls += 'font-weight:bold;');
      h.I && (cls += 'font-style:italic;');
      h.U && (cls += 'text-decoration:underline;');
      h.bc && (cls += `border-color:${RGB(h.bc)};`);
      h.bg && (cls += `background-color:${RGBA(h.bg, h.bgo == null ? 0.5 : h.bgo)};`);
      cls += '}';
      return cls;
    }).join('');
  }
  function setMonacoTheme(schema) {
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
    const name = `my${schema.name.split('').map(x => `${x.codePointAt(0)}`).join('')}`;
    monaco.editor.defineTheme(name, {
      base: schema.base,
      inherit: false,
      rules,
      colors,
    });
    monaco.editor.setTheme(name);
  }
  function updStl() { // update global style from what's in prefs.json
    const s = D.prf.colourScheme();
    const a = SCMS.concat(D.prf.colourSchemes().map(decScm));
    for (let i = 0; i < a.length; i++) {
      if (a[i].name === s) {
        const schema = a[i];
        I.col_stl && (I.col_stl.textContent = renderCSS(schema));
        if (window.monaco) setMonacoTheme(schema);
        break;
      }
    }
  }
  // $(updStl);
  D.addSynGrps = (x) => {
    G = G.concat(x);
    H = {};
    for (let i = 0; i < G.length; i++) H[G[i].t] = i; SCMS && updStl();
  };
  /* eslint-disable */
  D.addSynGrps([
    // t: token type, a short key for storing customisations
    // s: string to display in the UI
    // c: css selector -- will be prefixed with "#col_cm" or ".ride_win" unless /*noprefix*/ is present
    // m: monaco theme token name
    // ctrls: what UI controls should be shown or hidden for this group (other than the default ones)
    {s:'assignment'      ,t:'asgn',m:'keyword.operator.assignment',c:'.cm-apl-asgn'}, //←
    {s:'bracket'         ,t:'sqbr',m:'delimiter.square',c:'.cm-apl-sqbr'}, //[]
    {s:'comment'         ,t:'com' ,m:'comment',c:'.cm-apl-com' }, //⍝
    {s:'cursor'          ,t:'cur' ,e:'editorCursor.foreground',c:'div.CodeMirror-cursor', ctrls:{bg:0,BIU:0,fg:1}},
    {s:'dfn level 1'     ,t:'dfn1',m:'identifier.dfn.1',c:'.cm-apl-dfn.cm-apl-dfn1'}, //{}
    {s:'dfn level 2'     ,t:'dfn2',m:'identifier.dfn.2',c:'.cm-apl-dfn.cm-apl-dfn2'},
    {s:'dfn level 3'     ,t:'dfn3',m:'identifier.dfn.3',c:'.cm-apl-dfn.cm-apl-dfn3'},
    {s:'dfn level 4'     ,t:'dfn4',m:'identifier.dfn.4',c:'.cm-apl-dfn.cm-apl-dfn4'},
    {s:'dfn level 5'     ,t:'dfn5',m:'identifier.dfn.5',c:'.cm-apl-dfn.cm-apl-dfn5'}, //{1 {2 {3 {4 {5} } } } }
    {s:'dfn'             ,t:'dfn' ,m:'identifier.dfn',c:'.cm-apl-dfn' },
    {s:'diamond'         ,t:'diam',m:'delimiter.diamond',c:'.cm-apl-diam'}, //⋄
    {s:'dyadic operator' ,t:'op2' ,m:'keyword.operator.dyadic',c:'.cm-apl-op2' }, //⍣ ...
    {s:'error'           ,t:'err' ,m:'invalid',c:'.cm-apl-err' },
    {s:'function'        ,t:'fn'  ,m:'keyword.function',c:'.cm-apl-fn'  }, //+ ...
    {s:'global name'     ,t:'glb' ,m:'identifier.global',c:'.cm-apl-glb' },
    {s:'idiom'           ,t:'idm' ,m:'predefined.idiom',c:'.cm-apl-idm' }, //⊃⌽ ...
    {s:'keyword'         ,t:'kw'  ,m:'keyword',c:'.cm-apl-kw'  }, //:If ...
    {s:'label'           ,t:'lbl' ,m:'meta.label',c:'.cm-apl-lbl' }, //L:
    {s:'line number'     ,t:'lnum',c:'.CodeMirror-linenumber',e:'editorLineNumber.foreground'},
    {s:'matching bracket',t:'mtch',c:'.CodeMirror-matchingbracket',e:'editorBracketMatch.background'},
    {s:'modified line'   ,t:'mod' ,c:'.modified'   }, //in the session - lines queued for execution
    {s:'monadic operator',t:'op1' ,m:'keyword.operator.monadic',c:'.cm-apl-op1' }, //⌸ ...
    {s:'namespace'       ,t:'ns'  ,c:'.cm-apl-ns'  }, //#
    {s:'name'            ,t:'var' ,m:'identifier.local',c:'.cm-apl-var' }, //a.k.a. identifier
    {s:'normal'          ,t:'norm',c:'.cm-s-default,.CodeMirror-gutters,.ride_win_cm'},
    {s:'number'          ,t:'num' ,m:'number',c:'.cm-apl-num' }, //0 ...
    {s:'parenthesis'     ,t:'par' ,m:'delimiter.parenthesis',c:'.cm-apl-par' }, //()
    {s:'quad name'       ,t:'quad',m:'predefined.sysfn',c:'.cm-apl-quad'}, //⎕XYZ
    {s:'search match'    ,t:'srch',c:'.cm-searching',e:'editor.findMatchBackground',ctrls:{fg:0,BIU:0}},
    {s:'selection'       ,t:'sel' ,c:'.CodeMirror-selected,.CodeMirror-focused .CodeMirror-selected',e:'editor.selectionBackground',ctrls:{fg:0,BIU:0}},
    {s:'semicolon'       ,t:'semi',m:'delimiter.semicolon',c:'.cm-apl-semi'}, //as in A[B;C]
    {s:'string'          ,t:'str' ,m:'string',c:'.cm-apl-str' }, //'a.k.a. character vector or scalar'
    {s:'system command'  ,t:'scmd',m:'predefined.scmd',c:'.cm-apl-scmd'}, //)XYZ
    {s:'tracer'          ,t:'tc'  ,c:'/*noprefix*/.tracer .monaco-editor-background,/*noprefix*/.tracer .monaco-editor .margin'},
    {s:'pendent'         ,t:'tcpe',c:'/*noprefix*/.tracer.pendent .monaco-editor-background,/*noprefix*/.tracer.pendent .monaco-editor .margin'},
    {s:'tradfn'          ,t:'trad',m:'identifier.tradfn.apl', c:'.cm-apl-trad'}, //the header line (e.g. ∇{R}←A F B) or the closing ∇
    {s:'user command'    ,t:'ucmd',m:'predefined.ucmd',c:'.cm-apl-ucmd'}, //]XYZ
    {s:'value tip target',t:'vtt' ,c:'.vt_marker',ctrls:{bc:1,fg:0,BIU:0}}, //the rectangle around the token
    {s:'value tip'       ,t:'vtip',c:'/*noprefix*/#vt_bln,/*noprefix*/#vt_tri',ctrls:{bc:1}}, //the balloon
    {s:'zilde'           ,t:'zld' ,m:'predefined.zilde',c:'.cm-apl-zld' }  //⍬
  ]);
  /* eslint-enable */
  D.mop.then(() => updStl());
  D.prf.colourScheme(updStl); D.prf.colourSchemes(updStl);
  function uniqScmName(x) { // x:suggested root
    const h = {};
    for (let i = 0; i < scms.length; i++) h[scms[i].name] = 1;
    let r = x;
    if (h[x]) {
      const dx = x.replace(/ \(\d+\)$/, '');
      let i = 1;
      while (h[r = `${dx} (${i})`]) i += 1;
    }
    return r;
  }
  const SC_MATCH = 'search match'; // sample text to illustrate it
  function updSampleStl() {
    // I.col_sample_stl.textContent = renderCSS(scm, 1);
    monaco.editor.setTheme('vs');
    setMonacoTheme(scm);
    // me.layout();
  } // [sic]
  function selGrp(t, forceRefresh) {
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
    const c = (G[i] || G[0]).ctrls || {};
    q.fg_p.hidden = c.fg != null && !c.fg;
    q.bg_p.hidden = c.bg != null && !c.bg;
    q.fgo_p.hidden = (c.fg != null && !c.fg) || !h.fg;
    q.bgo_p.hidden = (c.bg != null && !c.bg) || !h.bg;
    q.BIU_p.hidden = c.BIU != null && !c.BIU;
    q.bc_p.hidden = !c.bc;
    sel = t;
  }
  function updScms() {
    q.scm.innerHTML = scms.map((x) => { const n = D.util.esc(x.name); return `<option value="${n}">${n}`; }).join('');
    q.scm.value = scm.name;
    q.scm.onchange();
    I.col.className = scm.frz ? 'frz' : '';
    updSampleStl();
    selGrp('norm', 1);
  }
  D.prf_tabs.col = {
    name: 'Colours',
    init() {
      q = J.col;
      const u = [];
      Object.keys(scm).forEach((g) => {
        const { fg } = scm[g];
        fg && u.indexOf(fg) < 0 && u.push(fg);
      });
      u.sort(); // u:unique colours
      q.list.innerHTML = u.map(x => `<option value=${x}>`).join('');
      q.grp.innerHTML = G.map((g, i) => `<option value=${i}>${g.s}`).join('');
      q.scm.onchange = () => {
        scm = scms[+q.scm.selectedIndex];
        updSampleStl();
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
        x.base = scm.base;
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
        autoClosingBrackets: true,
        automaticLayout: true,
        autoIndent: true,
        cursorStyle: D.prf.blockCursor() ? 'block' : 'line',
        cursorBlinking: D.prf.cursorBlinking(),
        fontFamily: 'apl',
        fontSize: fs,
        language: 'apl',
        lineHeight: fs + 2,
        lineNumbers: x => `[${x - 1}]`,
        matchBrackets: true,
        mouseWheelZoom: false,
        renderIndentGuides: false,
        showFoldingControls: 'always',
        wordBasedSuggestions: false,
        value: '{R}←{X}tradfn(Y Z);local\n' +
        'dfn←{ ⍝ comment\n' +
        '  0 ¯1.2e¯3j¯.45 \'string\' ⍬\n' +
        '  +/-⍣(×A):⍺∇⍵[i;j]\n' +
        '  {{{{nested ⍺:∇⍵}⍺:∇⍵}⍺:∇⍵}⍺:∇⍵}\n' +
        '}\n' +
        'label:\n' +
        ':For i :In ⍳X ⋄ :EndFor\n' +
        ':If condition\n' +
        '  {⍵[⍋⍵]} ⋄ global←local←0\n' +
        '  ⎕error ) ] } :error \'unclosed\n' +
        ':EndIf\n' +
        `${SC_MATCH}\n`,
      });
      D.prf.blockCursor(x => me.updateOptions({ cursorStyle: x ? 'block' : 'line' }));
      D.prf.cursorBlinking(x => me.updateOptions({ cursorBlinking: x }));
      // cm.addOverlay({
      //   token(sm) {
      //     const i = sm.string.slice(sm.pos).indexOf(SC_MATCH);
      //     if (!i) { sm.pos += SC_MATCH.length; return 'searching'; }
      //     i > 0 ? (sm.pos += i) : sm.skipToEnd(); return '';
      //   },
      // });
      // cm.on('gutterClick', () => { selGrp('lnum'); });
      me.onMouseDown((e) => {
        const t = e.target;
        const mt = monaco.editor.MouseTargetType;
        if (t.type === mt.GUTTER_LINE_NUMBERS) {
          selGrp('lnum');
        } else if (t.type === mt.CONTENT_TEXT) {
          // select by token?
        }
      });
      // cm.on('cursorActivity', () => {
      //   let tmp;
      //   let grp;
      //   if (cm.somethingSelected()) grp = 'sel';
      //   else if (cm.getLine(cm.getCursor().line).indexOf(SC_MATCH) >= 0) grp = 'srch';
      //   else if ((tmp = cm.getTokenTypeAt(cm.getCursor(), 1))) {
      //     grp = tmp.split(' ').sort((x, y) => y.length - x.length)[0].replace(/^apl-/, '');
      //   } else grp = 'norm';
      //   selGrp(grp);
      // });
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
          if (p === 'fg') q.fgo_p.hidden = !cb.checked;
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
      const a = SCMS.concat(D.prf.colourSchemes().map(decScm));
      scms = a;
      const s = D.prf.colourScheme();
      [scm] = a;
      for (let i = 0; i < a.length; i++) if (a[i].name === s) { scm = a[i]; break; }
      I.col.className = ''; updScms();
    },
    activate() { q.scm.focus(); },
    save() {
      D.prf.colourSchemes(scms.filter(x => !x.frz).map(encScm));
      D.prf.colourScheme(scm.name);
    },
    resize() { },
  };
}
