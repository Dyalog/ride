



### Operating System Terminal/Command Window Interaction


Features that rely on interaction with an operating system terminal/command window (that is, `⎕SR` and `)SH` or `)CMD` with no argument) cannot work in a Dyalog Session that is running through the RIDE. Instead of behaving as documented in the Dyalog APL Language Reference Guide, their behaviour depends on the way in which the interpreter and the RIDE combined to start a Dyalog Session:

- If the interpreter was started by the RIDE (see [Section ](type_start.md#)), then:`⎕SR` generates a trappable error`)SH` or `)CMD` with no argument produces a "Feature disabled in this environment" message.
- `⎕SR` generates a trappable error
- `)SH` or `)CMD` with no argument produces a "Feature disabled in this environment" message.
- If the interpreter and the RIDE were started independently and then connected to each other (see [Section ](type_connect.md#) and [Section ](type_listen.md#)), then the use of these features will appear to hang the Dyalog Session that is running through the RIDE. However, the Dyalog Session can be recovered by locating the operating system terminal/command window and using it to complete the operation. If there is no operating system terminal/command window, then the Dyalog Session is irrecoverable.

