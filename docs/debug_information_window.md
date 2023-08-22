



### Debug Information Window


The debug information window is located to the right of the Session window. It comprises two areas:

- The Threads area lists the threads that are currently in existence. For each thread the following information is provided:a description comprising the thread ID (`⎕TID`) and name (`⎕TNAME`)the state of the thread, that is, what it is doing (for example, `Session`, `Pending`, `:Hold`, `⎕NA`)the thread requirements (`⎕TREQ`)a flag indicating whether the thread is Normal or Paused
- a description comprising the thread ID (`⎕TID`) and name (`⎕TNAME`)
- the state of the thread, that is, what it is doing (for example, `Session`, `Pending`, `:Hold`, `⎕NA`)
- the thread requirements (`⎕TREQ`)
- a flag indicating whether the thread is Normal or Paused
- The SI Stack area lists the functions in the execution stack; each function in the list also has the line number and source code of the line that caused the function to be added to the stack. Equivalent to the result of `)SI`.

Display of the debug information window can be toggled with the View > Show Debug menu option.


