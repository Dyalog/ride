



### Re-executing Multiple Previous Expressions


Applicable in the Session window


Multiple expressions can be re-executed together irrespective of whether they were originally executed sequentially (certain system commands cause re‑execution to stop once they have been completed, for example, `)LOAD` and `)CLEAR`).


To re-execute multiple previously-entered expressions

1. Locate the first expression to re-execute in one of the following ways:- Scroll back through the Session log.
- Use the Backward command (<BK>) and the Forward command (<FD>) to cycle backwards and forwards through the input history, successively copying previously-entered expressions into the input line.
2. Change the expression in some way. The change does not have to impact the purpose of the expression; it could be an additional space character.
3. Scroll through the Session log to locate the next expression to re-execute and change it in some way. Repeat until all the required expressions have been changed.
4. Press the Enter key or enter the Enter command (<ER>).




The amended expressions are copied to the input line and executed in the order in which they appear in the Session log; the modified expressions in the Session log are restored to their original content.





To re-execute contiguous previously-entered expressions

1. Position the cursor at the start of the first expression to re-execute.
2. Press and hold the mouse button (left-click) while moving the cursor to the end of the last expression to re-execute.
3. Copy the selected lines to the clipboard using the Copy command (<CP>) or the Cut command (<CT>) or the Copy/Cut options in the Edit menu.
4. Position the cursor in the input line and paste the content of the clipboard back into the Session using the Paste command (<PT>), the Paste option in the Edit menu or the Paste option in the context menu.
5. Press the Enter key or enter the Enter command (<ER>).




This technique can also be used to move lines from the Edit window into the Session window and execute them.


