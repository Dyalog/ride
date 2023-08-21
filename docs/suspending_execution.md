



## Suspending Execution


To assist with investigations into the behaviour of a set of statements (debugging), the system can be instructed to suspend execution just before a particular statement. This is done by setting a breakpoint – see [Section ](breakpoints.md#).


It is sometimes necessary to suspend the execution of a function, for example, if an  endless loop has been inadvertently created or a response is taking an unacceptably long time. This is done using an interrupt – see [Section ](interrupts.md#).


Suspended functions can be viewed through the stack; the most recently-referenced function is at the top of the stack. The content of the stack can be queried with the `)SI` system command; this generates a list of all suspended and pendent (that is, awaiting the return of a called function) functions, where suspended functions are indicated by a `*`. For more information on the stack and the state indicator, see the Dyalog Programming Reference Guide.


