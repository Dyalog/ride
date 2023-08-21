### Toolbar (Trace Window)

The toolbar displayed at the top of the Edit window is shown in [](#tracewin_toolbar); the icons on this toolbar are detailed in [](#tracewin_toobar_icons)and the icons on this toolbar are detailed below.

The Edit Window's toolbar





| Icon | Action | Description |
| --- | --- | --- |
|  | Quit this function | Cuts the execution stack back one level. |
|  | Toggle line numbers | Turns the display of line numbers on/off. |
|  | Execute line | Executes the current line and advances to the next line. |
|  | Trace into expression | Traces execution of the current line and advances to the next line. If the current line calls a user-defined function then this is also traced. |
|  | Stop on next line of calling function | Continues execution of the code in the Trace window from the current line to completion of the current function or operator. If successful, the selection advances to the next line of the calling function (if there is one). |
|  | Continue execution of this thread | Closes the Trace window and resumes execution of the current application thread from the current line. |
|  | Continue execution of all threads | Closes the Trace window and resumes execution of all suspended threads. |
|  | Interrupt | Interrupts execution with a weak interrupt. |
|  | Edit name | Converts the Trace window into an Edit window as long as the cursor is on a blank line or in an empty space. However, if the cursor is on or immediately after an object name that is not the name of the suspended function, then an Edit window for that object name is opened. |
|  | Clear stops for this object | Clears all breakpoints (resets `⎕STOP` ) on the function(s) in the Edit / Trace windows. |
|  | Search | Opens the Search bar, enabling a search to be performed – see [Section ](#) ). |


