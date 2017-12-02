const conf = {
    comments: {
        lineComment: '⍝'
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
const language = {
    // Set defaultToken to invalid to see what you do not tokenize yet
    // defaultToken: 'invalid',
    ignoreCase: true,
    tokenPostfix: '.apl',
    outdentTriggers: 'l',
    brackets: [
        { token: 'delimiter.bracket', open: '{', close: '}' },
        { token: 'delimiter.parenthesis', open: '(', close: ')' },
        { token: 'delimiter.square', open: '[', close: ']' }
    ],

    letter:'A-Z_a-zÀ-ÖØ-Ýß-öø-üþ∆⍙Ⓐ-Ⓩ',
    name0: /[@letter]/,
    name1: /[@letter\d]*/,
    name: /(?:[@letter][@letter\d]*)/,
    notName: /[^@letter0-9]+/,
    end:/(?:⍝|$)/,
    
    keywords: '(if|else|elseif|orif|andif|endif|trap|endtrap|end|while|endwhile|for|in|ineach|endfor|return|namespace|endnamespace|section|endsection|select|case|caselist|endselect)', 
    aplfn:/[\+\-×÷⌈⌊\|⍳⍸\?\*⍟○!⌹<≤=≥>≠≡≢∊⍷∪∩~∧∨⍲⍱⍴,⍪⌽⊖⍉↑↓⊆⊂⊃⌷⍋⍒⊤⊥⍕⍎⊣⊢→]/,
    aplop1:/[\/\\⌿⍀¨⍨⌸⌶&]/,
    aplop2:/[\.∘⍤⍣⍠@⌺]/,
    sysfns:/\B⎕(a|á|af|ai|an|arbin|arbout|arg|at|av|avu|base|class|clear|cmd|cr|cs|csv|ct|cy|d|dct|df|div|dl|dm|dmx|dq|dr|ea|ec|ed|em|en|env|es|et|ex|exception|export|fappend|favail|fc|fchk|fcopy|fcreate|fdrop|ferase|fhist|fhold|fix|flib|fmt|fnames|fnums|fprops|fr|frdac|frdci|fread|frename|freplace|fresize|fsize|fstac|fstie|ftie|funtie|fx|inp|instances|io|json|kl|l|lc|load|lock|lx|map|mkdir|mkdir|ml|monitor|na|nappend|nc|ncreate|ndelete|nerase|new|nexists|nget|ninfo|nl|nlock|nnames|nnums|nparts|nput|nq|nr|nread|nrename|nreplace|nresize|ns|nsi|nsize|ntie|null|nuntie|nxlate|off|opt|or|path|pfkey|pp|pr|profile|ps|pt|pw|r|refs|rl|rsi|rtl|s|save|sd|se|sh|shadow|si|signal|size|sm|sr|src|stack|state|stop|svc|sve|svo|svq|svr|svs|syl|tc|tcnums|tf|tget|this|tid|tkill|tname|tnums|tpool|tput|trace|trap|treq|ts|tsync|tz|ucs|ul|using|vfi|vr|wa|wc|wg|wn|ws|wsid|wx|x|xml|xsi|xt)\b/,
    
    // The main tokenizer for our languages
    tokenizer: {
        root: [
    
        // identifiers and keywords
        [/:@keywords\b/, {cases:{
            ':if':'invalid',
            '@default':'keyword'
        }}],
        [/:repeat/,{ token: 'keyword', bracket: '@open'}],
        [/:(until|endrepeat)/, { token: 'keyword', bracket: '@close' }],

        // whitespace
        { include: '@whitespace' },

        // apl pimitives
        ['@aplfn','keyword.function'],
        ['@aplop1','keyword.operator.monadic'],
        ['@aplop2','keyword.operator.dyadic'],
        ['@sysfns','predefined.sysfn'],
    
        // delimiters and operators
        [/[{}()\[\]]/, '@brackets'],
        
        // numbers
        [/¯?(?:\d*\.)?\d+(?:e¯?\d+)?(?:j¯?(?:\d*\.)?\d+(?:e¯?\d+)?)?/, 'number'],
        
        // strings
        [/'([^'])*'/, 'string'],
        [/'[^']*$/, 'invalid.string']
        ],
        
        whitespace: [
        [/[ \t\r\n]+/, 'white'],
        [/⍝.*/,    'comment'],
        ],
    },
};
const snippets = { provideCompletionItems: () => { return [
    //class
    {
        label: 'Private',
        kind: monaco.languages.CompletionItemKind.Text
    },
    {
        label: 'Public',
        kind: monaco.languages.CompletionItemKind.Text
    },
    {
        label: 'Instance',
        kind: monaco.languages.CompletionItemKind.Text
    },
    {
        label: 'Shared',
        kind: monaco.languages.CompletionItemKind.Text
    },
    {
        label: 'access',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText:{value:':Access ${1:Public} ${2:Shared}'}
    },
    {
        label: 'class',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: {
            value: [
                ':Class ${1:name}',
                '\t$0',
                ':EndClass'
            ].join('\n')
        },
        documentation: 'Class script'
    },
    {
        label: 'disposable',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: {
            value: [
                ':Disposable ${1:objects}',
                '\t$0',
                ':EndDisposable'
            ].join('\n')
        },
        documentation: 'DSisposable Statement'
    },
    {
        label: 'for',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: {
            value: [
                ':For ${1:item} :In ${2:items}',
                '\t$0',
                ':EndFor'
            ].join('\n')
        },
        documentation: 'For loop'
    },
    {
        label: 'ifelse',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: {
            value: [
                ':If ${1:condition}',
                '\t$2',
                ':Else',
                '\t$0',
                ':EndIf'
            ].join('\n')
        },
        documentation: 'If-Else Statement'
    },
    {
        label: 'interface',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: {
            value: [
                ':Interface ${1:name}',
                '\t$0',
                ':EndInterface'
            ].join('\n')
        },
        documentation: 'Interface script'
    },
    {
        label: 'namespace',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: {
            value: [
                ':Namespace ${1:name}',
                '\t$0',
                ':EndNamespace'
            ].join('\n')
        },
        documentation: 'Namespace script'
    },
    {
        label: 'property',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: {
            value: [
                ':Property ${1:name}',
                '\t∇ r←get args',
                '\t  r←$2',
                '\t∇',
                '\t∇ set args',
                '\t∇',
                ':EndProperty'
            ].join('\n')
        },
        documentation: 'Property declaration'
    },
    {
        label: 'repeat',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: {
            value: [
                ':Repeat',
                '\t$0',
                ':EndRepeat'
            ].join('\n')
        },
        documentation: 'Repeat loop - endless'
    },
    {
        label: 'repeatuntil',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: {
            value: [
                ':Repeat',
                '\t$0',
                ':Until ${1:condition}'
            ].join('\n')
        },
        documentation: 'Repeat loop until'
    },
    {
        label: 'section',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: {
            value: [
                ':Section ${1:name}',
                '\t$0',
                ':EndSection'
            ].join('\n')
        },
        documentation: 'If-Else Statement'
    },
    {
        label: 'select',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: {
            value: [
                ':Select ${1:object}',
                ':Case ${2:value}',
                '\t$3',
                ':Else',
                '\t$0',
                ':EndSelect'
            ].join('\n')
        },
        documentation: 'Select Statement'
    },
    {
        label: 'trap',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: {
            value: [
                ':Trap ${1:error number}',
                '\t$1',
                ':Else',
                '\t$0',
                ':EndTrap'
            ].join('\n')
        },
        documentation: 'Trap-Else Statement'
    },
    {
        label: 'while',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: {
            value: [
                ':While ${1:condition}',
                '\t$0',
                ':EndWhile'
            ].join('\n')
        },
        documentation: 'While loop'
    },
    {
        label: 'with',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: {
            value: [
                ':With ${1:condition}',
                '\t$0',
                ':EndWith'
            ].join('\n')
        },
        documentation: 'With Statement'
    },
]}};
D.mop.then(x=>{
    monaco.languages.register({
      id: 'apl',
      extensions: ['.dyapp', '.dyalog']
    })
    monaco.languages.setMonarchTokensProvider('apl', language);
    monaco.languages.setLanguageConfiguration('apl', conf);
    monaco.languages.registerCompletionItemProvider('apl', snippets);
});