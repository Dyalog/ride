#Running the test suite
Use a 64-bit Linux Unicode interpreter.

Clear the session log

    rm "$OBJDIR"/default.dlf   # if the interpreter is from a development version

and reset RIDE's preferences to factory defaults

    rm -r ~/.config/ride20

Build and run RIDE with autospawning and load the test framework

    ./dist.sh linux64
    DYALOG_IDE_SPAWN=1 DYALOG_IDE_JS=tests/t.js build/ride20/linux64/ride20

RIDE's main window and a devtools window should appear near the right edge of your screen.
The latter will print test actions as they are being executed (lines from `test/t.txt`)
and will say "brilliant" at the end if everything's kushti.  Anything red indicates failure.

#Writing a test case
For example:

    testcase Strong Interrupt
      mousedown Actions
      click Strong Interrupt
      200
      assert(sessionLastLines(2)[0]==='INTERRUPT')

A line in a test case can be on of:
* a number, meaning that execution should be paused for that number of milliseconds
* a JavaScript expression
* an function name followed by space and some text to the end of line; `click Strong Interrupt` is equivalent to the
  `click("Strong Interrupt")`
