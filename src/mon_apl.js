D.monarch={
    conf: {
        comments: {
            lineComment: '⍝'
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')']
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
        ],
        surroundingPairs: [
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
        ],
        indentationRules: {
		// ^(.*\*/)?\s*\}.*$
		    decreaseIndentPattern: /^((?!.*?\/\*).*\*\/)?\s*[\}\]\)].*$/,
		// ^.*\{[^}"']*$
		    increaseIndentPattern: /^((?!\/\/).)*(\{[^}"'`]*|\([^)"'`]*|\[[^\]"'`]*)$/
	    }
    },
    language: {
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
      
        keywords: '(if|else|elseif|orif|andif|endif|trap|endtrap|end|while|endwhile|for|in|ineach|endfor|return|namespace|endnamespace|section|endsection)', 
      
        // The main tokenizer for our languages
        tokenizer: {
          root: [
      
            // identifiers and keywords
            [/:@keywords\b/, 'keyword'],
            [/:repeat/,{ token: 'keyword', bracket: '@open'}],
            [/:until/, { token: 'keyword', bracket: '@close' }],
      
            // whitespace
            { include: '@whitespace' },
      
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
    }
}
