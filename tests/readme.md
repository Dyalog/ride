#Running the test suite

Install a 64-bit Unicode interpreter on Linux and in RIDE's git root do:

    ./mk c b l               # clean, build, and package RIDE for Linux
    rm -r ~/.config/ride31   # reset prefs to factory defaults
    rm "$OBJDIR"/default.dlf # delete interpreter's session log
    RIDE_SPAWN=dyalog RIDE_JS=tests/t.js _/ride31/ride31-linux-x64/ride31

Electron's console will print test actions as they are being executed (lines from `test/t.txt`)
and will say "brilliant" at the end if everything's kushti.  Anything in red indicates failure.

#Writing a test case
`test/t.txt` contains a series of test cases, for example:

    testcase Strong Interrupt
      mousedown Actions
      click Strong Interrupt
      200
      assert(sessionLastLines(2)[0]==='INTERRUPT')

A line in a test case can be one of:
* a number, meaning that execution should be paused for that number of milliseconds
* a JavaScript expression
* an function name followed by a space and some text to the end of line; `click Strong Interrupt` will be treated as `click("Strong Interrupt")`

All of RIDE's global variables are accessible here.  In addition, the test framework provides some utility functions:

##`find(x)`
selects an element by text and returns it as a jQuery wrapper.  The text must match exactly except for leading/trailing spaces and a traling `:`, for instance `find('Canc')` won't find the Cancel button.  It the element is not unique, that's an error.  If the element is a `<label>`, `find()` will return its corresponding `<input>` instead (or `<select>` or `<textarea>`, etc.)

##`click(x)`, `mousedown(x)`, `mouseup(x)`, `mouseover(x)`, `mouseout(x)`
use `find(x)` to select an element and trigger an event.

Note: top level menu items require a `mousedown` instead of `click`, e.g.: `mousedown('Edit');click('Preferences')`

##`fillIn(x,value)`
uses `find(x)` to select an element, set its value to `value`, and trigger a `change` event.

##`inSession(s)`, `inEditor(s)`
type text or send keystrokes.  `s` is a string that can contain keystrokes surrounded with `<>`, e.g. `<Shift-Enter>`, `<S-Enter>`, `<C-A-S-Space>`.  Command codes are also supported: `<ED>`, `<TC>`, `<PRF>`.

##`sessionLastLines(n)`
returns an array of the last `n` lines in the session

##`testcase(description)`
does nothing, it's only an ornament
