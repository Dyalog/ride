



## Trace Window


The Trace window aids debugging by enabling you to step through your code line by line, display variables in Edit windows and watch them change as the execution progresses. Alternatively, you can use the Session window and Edit windows to experiment with and correct your code.


A Trace window can be opened from the Session window by entering  `<expression>` <TC>. This is an explicit trace and lets you step through the execution of any non-primitive functions/operators in the expression.


By default, Dyalog is also configured to initiate an automatic trace whenever an error occurs, that is, the Trace window opens and becomes the active window and the line that caused the execution to suspend is selected. This is controlled by the interpreter configuration parameter TRACE_ON_ERROR (for information on configuration parameters, see the Dyalog for <operating system> Installation and Configuration Guide specific to the operating system that you are using).


By default, the Trace window is docked beneath the Session and Edit windows. Other than setting/removing breakpoints (see [Section ](breakpoints.md#)), Trace windows are read only.


