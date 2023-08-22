



### Breakpoints


Applicable in the Edit window and the Trace window


When a function that includes a breakpoint is run, its execution is suspended immediately before executing the line on which the breakpoint is set and the Trace window is automatically opened (assuming that automatic trace is enabled – see [Section ](trace_window.md#)).


Breakpoints are defined by dyadic `⎕STOP` and can be toggled on and off in an Edit or Trace window by left-clicking on the far left of the line before which the breakpoint is to be applied or by placing the cursor anywhere in the line before which the breakpoint is to be applied and entering the Toggle Breakpoint command (<BP>). Note that:

- Breakpoints set or cleared in an Edit window are not established until the function is fixed.
- Breakpoints set or cleared in a Trace window are established immediately.

When a breakpoint is reached during code execution, event 1001 is generated; this can be trapped. For more information, see  `⎕TRAP` in the Dyalog APL Language Reference Guide.


