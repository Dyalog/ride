



#### Action Menu


The options available under the Action menu are detailed in [](#action_menu)below. These enable Edit and Trace windows to be opened and allow currently-running APL code to be interrupted with trappable events.

| Item | Description |
| --- | --- |
| Edit | If the cursor is on or immediately after `<object name>` , then opens an Edit window on that name. |
| Trace | In the Session window: If the cursor is on a line containing calls to multi-line functions, a Trace window is opened and the functions traced ( explicit trace ). If the cursor is on a line containing no text and there is a suspended function (or operator) on the execution stack, open a Trace window for that function ( naked trace ) In a Trace window: Open a new Trace window for any multi-line function (or operator) in that line and trace that line as it is evaluated. |
| Clear all trace/stop/monitor | Removes any trace/stop/monitor flags  (as set by `⎕TRACE` / `⎕STOP` / `⎕MONITOR` ) from all functions in the workspace. |
| Weak Interrupt | Suspends execution at the start of the next line. |
| Strong Interrupt | Suspends execution after the current primitive operation. |


