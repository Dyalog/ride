// This is the list of command-to-keystroke mappings that are configurable in Preferences>Keys.
// The list does not necessarily contain all commands and all keystrokes in Ride,
// only those in Preferences>Keys.
// Some of the codes are inherited from Dyalog's old IDE
// (see ../docs/cmd-codes.txt and near the end of km.js)
// Others were made up for Ride's purposes - those use no fewer than three letters.
D.cmds = [
  /* eslint-disable */
  //code description                default keys
  ['ABT','About Ride',              ['Shift+F1']],
  ['AC', 'Align comments',          []],
  ['AO', 'Comment out lines',       []],
  ['ASW', 'Auto Status',            []],
  ['BH', 'Run to exit (in tracer)', []],
  ['BK', 'Backward or Undo',        ['Ctrl+Shift+Backspace']],
  ['BP', 'Toggle breakpoint',       []],
  ['BT', 'Back Tab between windows',['Ctrl+Shift+Tab']],
  ['CAM','Clear all trace/stop/monitor',[]],
  ['CAW','Close All Windows',[]],
  ['CBP','Clear stops for active object',[]],
  ['CLS','Close window',            D.mac?['Cmd+W']:[]],
  ['CNC','Connect',                 []],
  ['DK', 'Delete lines',            []],
  ['DHI','Dyalog Help Index',       []],
  ['DMN','Next line in demo',       []],
  ['DMP','Previous line in demo',   []],
  ['DMR','Load demo file',          []],
  ['DOX','Documentation Centre',    []],
  ['DO', 'Uncomment lines',         []],
  ['EMI','Exit multiline input',    []],
  ['ED', 'Edit',                    ['Shift+Enter']],
  ['EP', 'Exit (and save changes)', ['Escape']],
  ['ER', 'Execute line',            ['Enter']],
  ['EXP','Expand selection',        [D.mac?'Shift+Option+Up':'Shift+Alt+Up']],
  ['FD', 'Forward or Redo',         ['Ctrl+Shift+Enter']],
  ['FX', 'Fix the current function',[]],
  ['HLP','Help',                    ['F1']],
  ['IT', 'Inline Tracing',          ['Ctrl+Alt+Enter']],
  ['JBK','Jump back',               ['Ctrl+Shift+J']],
  ['JSC','Show JavaScript console', ['F12']],
  ['LBR','Toggle language bar',     []],
  ['LL', 'Left Limit',              ['Home']],
  ['LN', 'Toggle line numbers',     []],
  ['LOG','Show Ride protocol log',  ['Ctrl+F12']],
  ['MA', 'Continue execution of all threads',[]],
  ['NEW','New session',             [D.mac?'Cmd+N':'Ctrl+N']],
  ['NX' ,'Next match',              []],
  ['OWS','Open Workspace',          [D.mac?'Cmd+O':'Ctrl+O']],
  ['PAT','Pause all Threads',       []],
  ['POE','Pause on Error',          []],
  ['PRF','Show preferences',        D.mac?['Cmd+,']:[]],
  ['PV' ,'Previous match',          []], 
  ['QCP','Quick Command Palette',   []], 
  ['QIT','Quit',                    [D.mac?'Cmd+Q':'Ctrl+Q']],
  ['QT', 'Close window (and lose changes)',['Shift+Escape']],
  ['RD', 'Reformat',                ['NumPad_Divide']],
  ['RDO', 'Redo',                   [D.mac?'Shift+Cmd+Z':'Ctrl+Y']],
  ['RP', 'Replace',                 []],
  ['RL', 'Right Limit',             ['End']],
  ['RM', 'Continue execution of this thread', []],
  ['UAT','Unpause all paused threads',[]],
  ['SA', 'Select All',              [D.mac?'Cmd+A':'Ctrl+A']],
  ['SC', 'Search',                  ['Ctrl+F']],
  ['SI', 'Strong interrupt',        []],
  ['SBR','Toggle status bar',       []],
  ['SSW','Toggle status window',    []],
  ['STL','Skip to line',            []],
  ['TB', 'Tab between windows',     ['Ctrl+Tab']],
  ['TC', 'Trace line',              ['Ctrl+Enter']],
  ['TGC','Toggle comment',          []],
  ['TIP','Show value tip',          []],
  ['TL', 'Toggle localisation',     ['Ctrl+Up']],
  ['TO', 'Toggle fold',             []],
  ['TVB','Toggle view stops',       []],
  ['TVO','Toggle view outline',     []],
  ['TFR', 'Refresh threads',        []],
  ['UND', 'Undo',                   [D.mac?'Cmd+Z':'Ctrl+Z']],
  ['VAL','Evaluate selection or name under cursor',[]],
  ['WI', 'Weak interrupt',          ['Ctrl+PauseBreak']],
  ['WSE','Toggle workspace explorer',[]],
  ['ZM', 'Toggle maximise editor',  []],
  ['ZMI','Increase font size',      [D.mac?'Cmd+=':'Ctrl+=']],
  ['ZMO','Decrease font size',      [D.mac?'Cmd+-':'Ctrl+-']],
  ['ZMR','Reset font size',         [D.mac?'Cmd+0':'Ctrl+0']],
  ['PF1' ,'',                       []],
  ['PF2' ,'',                       ['F2']],
  ['PF3' ,'',                       ['F3']],
  ['PF4' ,'',                       ['F4']],
  ['PF5' ,'',                       ['F5']],
  ['PF6' ,'',                       ['F6']],
  ['PF7' ,'',                       ['F7']],
  ['PF8' ,'',                       ['F8']],
  ['PF9' ,'',                       ['F9']],
  ['PF10','',                       ['F10']],
  ['PF11','',                       []],
  ['PF12','',                       []],
  ['PF13','',                       []],
  ['PF14','',                       ['Shift+F2']],
  ['PF15','',                       ['Shift+F3']],
  ['PF16','',                       ['Shift+F4']],
  ['PF17','',                       ['Shift+F5']],
  ['PF18','',                       ['Shift+F6']],
  ['PF19','',                       ['Shift+F7']],
  ['PF20','',                       ['Shift+F8']],
  ['PF21','',                       ['Shift+F9']],
  ['PF22','',                       ['Shift+F10']],
  ['PF23','',                       ['Shift+F11']],
  ['PF24','',                       ['Shift+F12']],
  ['PF25','',                       ['Ctrl+F1']],
  ['PF26','',                       ['Ctrl+F2']],
  ['PF27','',                       ['Ctrl+F3']],
  ['PF28','',                       ['Ctrl+F4']],
  ['PF29','',                       ['Ctrl+F5']],
  ['PF30','',                       ['Ctrl+F6']],
  ['PF31','',                       ['Ctrl+F7']],
  ['PF32','',                       ['Ctrl+F8']],
  ['PF33','',                       ['Ctrl+F9']],
  ['PF34','',                       ['Ctrl+F10']],
  ['PF35','',                       ['Ctrl+F11']],
  ['PF36','',                       []],
  ['PF37','',                       ['Ctrl+Shift+F1']],
  ['PF38','',                       ['Ctrl+Shift+F2']],
  ['PF39','',                       ['Ctrl+Shift+F3']],
  ['PF40','',                       ['Ctrl+Shift+F4']],
  ['PF41','',                       ['Ctrl+Shift+F5']],
  ['PF42','',                       ['Ctrl+Shift+F6']],
  ['PF43','',                       ['Ctrl+Shift+F7']],
  ['PF44','',                       ['Ctrl+Shift+F8']],
  ['PF45','',                       ['Ctrl+Shift+F9']],
  ['PF46','',                       ['Ctrl+Shift+F10']],
  ['PF47','',                       ['Ctrl+Shift+F11']],
  ['PF48','',                       ['Ctrl+Shift+F12']],
  /* eslint-enable */
];
